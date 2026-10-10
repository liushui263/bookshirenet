# BookShire Plan & Specifications

## 1. Vision
BookShire is a lightweight, scalable book discovery and management platform designed for rapid MVP validation and future production scaling.

## 2. Core Goals
- Minimal viable product (MVP) first
- Docker-based development (no local dependency setup)
- Clean, extensible backend architecture
- Production-ready migration path

## 3. Architecture Overview

### Backend
- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL (with optional PostGIS)

### Infrastructure
- Docker / Docker Compose
- Service-based architecture:
  - backend
  - db

### Dev Philosophy
- Zero local setup (everything runs in containers)
- Deterministic builds
- Reproducible environments

## 4. Data Model (Core Entities)

### Book
- id
- title
- description
- cover_id
- author_id

### Author
- id
- name
- bio

### Cover
- id
- image_url

### Tag
- id
- name

### Relationships
- Book ↔ Author (many-to-one)
- Book ↔ Tag (many-to-many)

## 5. Development Workflow

### Step 1: Start services
```
docker compose up --build
```

### Step 2: DB readiness handling
- Backend waits for DB using retry script

### Step 3: Migrations
```
alembic upgrade head
```

## 6. Deployment Strategy

### Phase 1 (MVP)
- Cheap domain (.net / .club)
- Landing page + API
- Validate idea

### Phase 2 (Growth)
- Move to production infra
- CI/CD pipeline
- Domain upgrade (.com if justified)

## 7. Key Design Decisions

### Docker-first
Avoid local Python / DB installation entirely.

### Alembic inside container
Migrations executed at container startup.

### DB readiness
Handled via retry loop (psycopg2 script).

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| DB not ready | Retry logic |
| Migration race | Controlled startup script |
| Over-engineering | Strict MVP scope |

## 9. Next Steps

- Implement schema models
- Add migration scripts
- Build basic API endpoints
- Create simple frontend / landing page

---

## 10. Long-Term Vision
- Recommendation system
- User accounts
- Book reviews
- Social features

