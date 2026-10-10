.PHONY: dev up down restart build ps logs logs-backend logs-frontend logs-db health books shelf search psql backup migrate revision frontend-dev frontend-stop clean-next

DEMO_USER_ID=86f7818b-788e-4d0b-9e81-9c8bc918ac44

dev:
	docker compose up --build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

build:
	docker compose build

ps:
	docker compose ps

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f db

health:
	curl -i http://localhost:8000/health

books:
	curl -s "http://localhost:8000/api/v1/books/" | python -m json.tool

shelf:
	curl -s "http://localhost:8000/api/v1/users/$(DEMO_USER_ID)/books" | python -m json.tool

search:
	curl -s "http://localhost:8000/api/v1/books/search?q=sapiens" | python -m json.tool

psql:
	docker exec -it bookshire-db psql -U bookshire -d bookshire -P pager=off

backup:
	./scripts/backup_dev_db.sh

migrate:
	docker compose exec backend alembic upgrade head

revision:
	docker compose exec backend alembic revision --autogenerate -m "$(m)"

frontend-stop:
	docker compose stop frontend

frontend-dev:
	cd frontend && npm run dev

clean-next:
	rm -rf frontend/.next
