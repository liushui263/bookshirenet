"""End-to-end checks for add-by-ISBN and shelf export / import, against a running API.

    API_BASE_URL=http://localhost:8000 python -m pytest tests/test_library.py

ISBN lookups fall back to the title in each row when Google Books and Open Library are
unreachable, so these tests pass offline.
"""

import csv
import io
import json
import os
import random
import uuid

import httpx
import pytest

BASE = os.getenv("API_BASE_URL", "http://localhost:8000") + "/api/v1"


def _random_isbn13() -> str:
    body = "979" + "".join(random.choice("0123456789") for _ in range(9))
    total = sum(int(d) * (1 if i % 2 == 0 else 3) for i, d in enumerate(body))
    return body + str((10 - total % 10) % 10)


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=30) as c:
        yield c


@pytest.fixture()
def headers(client):
    email = f"lib-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/auth/register", json={"email": email, "password": "correct horse", "display_name": "Lib"})
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _import(client, headers, fmt, content):
    res = client.post("/me/books/import-file", json={"format": fmt, "content": content}, headers=headers)
    assert res.status_code == 200, res.text
    return res.json()


def test_import_csv_then_add_same_isbn_finds_the_edition(client, headers):
    isbn = _random_isbn13()
    title = f"Imported Novel {uuid.uuid4().hex[:6]}"
    content = (
        "title,authors,isbn_13,status,condition,visibility,exchangeable,tags,notes,started_at,finished_at\n"
        f"{title},Ann Author; Bo Writer,{isbn},finished,4,public,yes,keep; signed,My copy,2024-01-02,2024-02-03\n"
        "No ISBN Book,,,reading,,,,,,,\n"
        ",,,,,,,,,,\n"
        "Bad Row,,,unknown-status,,,,,,,\n"
    )
    result = _import(client, headers, "csv", content)
    assert result["added"] == 2
    assert result["failed"] == 2
    assert {e["row"] for e in result["errors"]} == {3, 4}

    shelf = client.get("/me/books", headers=headers).json()
    item = next(b for b in shelf if b["book_title"] == title)
    assert item["status"] == "read"
    assert item["condition"] == 4
    assert item["visibility"] == "public"
    assert item["exchangeable"] is True
    assert item["personal_tags"] == ["keep", "signed"]
    assert item["personal_notes_summary"] == "My copy"

    # Adding the same ISBN (in 10/13 or hyphenated form) returns the copy already on the shelf.
    res = client.post("/me/books/isbn", json={"isbn": f"{isbn[:3]}-{isbn[3:]}"}, headers=headers)
    assert res.status_code == 201, res.text
    assert res.json()["id"] == item["id"]
    assert len(client.get("/me/books", headers=headers).json()) == 2

    # The same title with another ISBN becomes a second edition of the same book, findable by that ISBN.
    other_isbn = _random_isbn13()
    assert _import(client, headers, "csv", f"title,authors,isbn\n{title},Ann Author,{other_isbn}\n")["added"] == 1
    res = client.post("/me/books/isbn", json={"isbn": other_isbn}, headers=headers)
    assert res.status_code == 201, res.text
    assert res.json()["book_id"] == item["book_id"]
    assert res.json()["edition_id"] != item["edition_id"]


def test_add_by_isbn_rejects_invalid_isbn(client, headers):
    res = client.post("/me/books/isbn", json={"isbn": "9780306406158"}, headers=headers)
    assert res.status_code == 400


def test_export_and_reimport_round_trip(client, headers):
    title = f"Round Trip {uuid.uuid4().hex[:6]}"
    _import(client, headers, "json", json.dumps([{"title": title, "authors": ["Zed"], "status": "reading", "notes": "line1\nline2, with comma"}]))

    res = client.get("/me/books/export?format=csv", headers=headers)
    assert res.status_code == 200
    assert "attachment" in res.headers["content-disposition"]
    rows = list(csv.DictReader(io.StringIO(res.text.lstrip("﻿"))))
    assert rows[0]["title"] == title
    assert rows[0]["authors"] == "Zed"
    assert rows[0]["notes"] == "line1\nline2, with comma"

    exported_json = client.get("/me/books/export?format=json", headers=headers).json()
    assert exported_json["books"][0]["title"] == title

    # Remove it, then import the CSV back: same catalog book, same details.
    item = client.get("/me/books", headers=headers).json()[0]
    assert client.delete(f"/me/books/{item['id']}", headers=headers).status_code == 200
    result = _import(client, headers, "csv", res.text)
    assert result == {"added": 1, "updated": 0, "failed": 0, "errors": []}
    again = client.get("/me/books", headers=headers).json()[0]
    assert again["book_id"] == item["book_id"]
    assert again["status"] == "reading"
    assert again["personal_notes_summary"] == "line1\nline2, with comma"

    # Importing again updates rather than duplicates.
    assert _import(client, headers, "csv", res.text)["updated"] == 1
    assert len(client.get("/me/books", headers=headers).json()) == 1


def test_import_rejects_bad_files(client, headers):
    res = client.post("/me/books/import-file", json={"format": "json", "content": "{not json"}, headers=headers)
    assert res.status_code == 400
    res = client.post("/me/books/import-file", json={"format": "json", "content": '"a string"'}, headers=headers)
    assert res.status_code == 400


def test_library_routes_need_sign_in(client):
    assert client.post("/me/books/isbn", json={"isbn": "9780306406157"}).status_code == 401
    assert client.get("/me/books/export").status_code == 401
    assert client.post("/me/books/import-file", json={"format": "csv", "content": "title\nx"}).status_code == 401
