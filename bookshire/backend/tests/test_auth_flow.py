"""End-to-end check of sign-in and per-user data against a running API.

Run with the API up (docker compose up, or uvicorn) and seeded:
    API_BASE_URL=http://localhost:8000 python -m pytest tests/test_auth_flow.py
"""

import os
import uuid

import httpx
import pytest

BASE = os.getenv("API_BASE_URL", "http://localhost:8000") + "/api/v1"
SEED_BOOK_ID = "11111111-1111-4111-8111-111111111111"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=10) as c:
        yield c


def _register(client, name="Reader"):
    email = f"{name.lower()}-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/auth/register", json={"email": email, "password": "correct horse", "display_name": name})
    assert res.status_code == 201, res.text
    body = res.json()
    return email, {"Authorization": f"Bearer {body['access_token']}"}, body["user"]


def test_register_login_me(client):
    email, headers, user = _register(client)
    assert user["email"] == email

    assert client.post("/auth/register", json={"email": email.upper(), "password": "another one", "display_name": "x"}).status_code == 409
    assert client.post("/auth/login", json={"email": email, "password": "wrong password"}).status_code == 401

    res = client.post("/auth/login", json={"email": email.upper(), "password": "correct horse"})
    assert res.status_code == 200, res.text

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {res.json()['access_token']}"})
    assert me.json()["id"] == user["id"]


def test_requests_without_a_valid_token_are_rejected(client):
    assert client.get("/auth/me").status_code == 401
    assert client.get("/me/books").status_code == 401
    assert client.get("/me/books", headers={"Authorization": "Bearer not-a-token"}).status_code == 401
    assert client.post(f"/me/books/by-book/{SEED_BOOK_ID}").status_code == 401
    assert client.post(f"/books/{SEED_BOOK_ID}/reviews", json={"rating": 5}).status_code == 401


def test_shelves_are_private_to_their_owner(client):
    _, alice, _ = _register(client, "Alice")
    _, bob, _ = _register(client, "Bob")

    added = client.post(f"/me/books/by-book/{SEED_BOOK_ID}", headers=alice)
    assert added.status_code == 201, added.text
    item_id = added.json()["id"]

    assert [b["id"] for b in client.get("/me/books", headers=alice).json()] == [item_id]
    assert client.get("/me/books", headers=bob).json() == []

    assert client.patch(f"/me/books/{item_id}", headers=bob, json={"status": "read"}).status_code == 404
    assert client.delete(f"/me/books/{item_id}", headers=bob).status_code == 404

    updated = client.patch(f"/me/books/{item_id}", headers=alice, json={"status": "reading"})
    assert updated.json()["status"] == "reading"
    assert client.delete(f"/me/books/{item_id}", headers=alice).status_code == 200
    assert client.get("/me/books", headers=alice).json() == []


def test_reviews_belong_to_the_signed_in_user(client):
    _, alice, alice_user = _register(client, "Alice")
    _, bob, _ = _register(client, "Bob")

    res = client.post(f"/books/{SEED_BOOK_ID}/reviews", headers=alice, json={"rating": 4, "content": "Good", "user_id": str(uuid.uuid4())})
    assert res.status_code == 201, res.text
    review = res.json()
    assert review["user_id"] == alice_user["id"]

    assert client.patch(f"/reviews/{review['id']}", headers=bob, json={"rating": 1}).status_code == 404
    assert client.delete(f"/reviews/{review['id']}", headers=bob).status_code == 404

    private = client.patch(f"/reviews/{review['id']}", headers=alice, json={"visibility": "private"})
    assert private.status_code == 200, private.text
    assert client.get(f"/users/{alice_user['id']}/reviews").json() == []
    assert [r["id"] for r in client.get("/me/reviews", headers=alice).json()] == [review["id"]]

    assert client.delete(f"/reviews/{review['id']}", headers=alice).status_code == 200


def test_demo_user_can_sign_in_in_dev(client):
    res = client.post("/auth/login", json={"email": "demo@bookshire.local", "password": "bookshire-demo"})
    assert res.status_code == 200, res.text


def test_legacy_routes_are_off_by_default(client):
    assert client.get("/users/86f7818b-788e-4d0b-9e81-9c8bc918ac44/books").status_code == 404
