# 📚 BookShire — Plan & Specifications

## 🧭 Project Overview

**BookShire** is a platform that starts as a **personal book management tool** and evolves into a **local book exchange and social ecosystem**.

The system is designed around:
- 📖 Personal library management  
- 📷 Smart book ingestion (barcode + image recognition)  
- 🔁 Local book exchange  
- 🧠 Content-driven social interaction  

---

## 🎯 Product Vision

> Build a **“book-centered data + interaction network”**, where books connect people through ownership, knowledge, and trust.

---

## 🚀 Product Roadmap

### 🟢 Phase 1 — Personal Library (MVP)

**Goal:** Fully usable standalone system

#### Features:
- Add books (manual + ISBN scan)
- Basic metadata management
- Book status tracking:
  - unread / reading / read
- Book condition (1–5 scale)
- Local storage (DB + JSON export/import)
- Basic search (title / author / ISBN)
- Private notes

---

### 🔵 Phase 2 — Data Intelligence & UX

**Goal:** Improve automation and usability

#### Features:
- OCR-based metadata extraction
- Cover image detection
- Multi-source book lookup
- Multi-language support
- User override (cover / metadata)
- Notes visibility control
- Rating system

---

### 🟣 Phase 3 — Local Exchange Network

**Goal:** Enable real-world interactions

#### Features:
- Mark books as exchangeable
- Geo-based discovery (PostGIS)
- Exchange request workflow
- Trust system (ratings / success rate)

---

### 🔴 Phase 4 — Social & Discovery

**Goal:** Growth and engagement

#### Features:
- Public reviews
- Feed system
- Recommendation engine
- Follow users
- Trending books

---

## 🧠 Core Data Architecture

### Data Layering Principle

```
Book (abstract work)
 └── Editions (versions)
       └── UserBooks (ownership)
             ├── Notes
             ├── Reviews
             └── Exchanges
```

---

## 📘 Data Model Specification

### 1. Book (Shared Metadata)

```json
{
  "id": "",
  "title": "",
  "subtitle": "",
  "authors": [],
  "translators": [],
  "editors": [],
  "original_language": "en",
  "categories": [],
  "tags": [],
  "descriptions": [
    { "lang": "en", "text": "" }
  ],
  "cover_url": ""
}
```

---

### 2. Edition (Version-Specific)

```json
{
  "id": "",
  "book_id": "",
  "language": "zh",
  "isbn": "",
  "publisher": "",
  "publication_date": "",
  "format": "paperback",
  "cover_url": ""
}
```

---

### 3. UserBook (Ownership Layer)

```json
{
  "id": "",
  "user_id": "",
  "edition_id": "",
  "status": "reading",
  "condition": 4,
  "location": {
    "geo": { "lat": 0, "lng": 0 },
    "text": "Home shelf"
  },
  "exchangeable": true,
  "visibility": "private",
  "user_cover": ""
}
```

---

### 4. Notes (Reading Content)

```json
{
  "id": "",
  "user_id": "",
  "book_id": "",
  "content": "",
  "page": 10,
  "visibility": "private"
}
```

---

### 5. Reviews (Public Feedback)

```json
{
  "id": "",
  "user_id": "",
  "book_id": "",
  "rating": 4,
  "content": "",
  "visibility": "public"
}
```

---

### 6. Exchange

```json
{
  "id": "",
  "book_id": "",
  "owner_id": "",
  "requester_id": "",
  "status": "pending",
  "location": "",
  "created_at": ""
}
```

---

## 🌍 Language System

### Key Principles

| Layer | Field |
|------|------|
| Book | original_language |
| Edition | language |
| User | preferred_languages |

### Standard:
- ISO 639-1 (en, zh, fr)
- Optional region support (zh-CN, zh-TW)

---

## 📷 Book Ingestion System

### Multi-Modal Pipeline

```
Camera/Image Input
    ↓
[1] Barcode Scan (ISBN)
    ↓ success
    Metadata Fetch
    ↓
    User Confirm

    ↓ fail
[2] Cover Recognition
[3] OCR Extraction
[4] Keyword Search
    ↓
Candidate Results
    ↓
User Selection
```

---

### Design Principles

- Recognition ≠ automatic entry  
- Always require user confirmation  
- Must support manual fallback  

---

## 🐳 Engineering Architecture

### Stack

| Layer | Technology |
|------|------------|
| Frontend | Next.js |
| Backend | FastAPI |
| Database | PostgreSQL + PostGIS |
| Search | Meilisearch |
| Container | Docker |

---

## ⚙️ Docker Architecture

```yaml
services:
  frontend:
  backend:
  db:
  search:
```

---

### Dev Workflow

```bash
docker compose up
```

Features:
- Hot reload
- Volume mounting
- DevContainer support

---

## 📁 Project Structure

```
project-root/
├── docker-compose.yml
├── backend/
├── frontend/
├── db/
└── .devcontainer/
```

---

## 🧪 Development Plan

### Step 1 — Foundation (1–2 weeks)
- Docker setup
- DB schema (basic)
- API skeleton
- Frontend base UI

---

### Step 2 — Library System (2–3 weeks)
- CRUD books
- Search
- Status tracking

---

### Step 3 — Scan System (2 weeks)
- ISBN scanning
- API integration
- Auto-fill UI

---

### Step 4 — OCR & Vision (2–3 weeks)
- OCR service
- Image fallback
- Candidate selection UI

---

### Step 5 — Notes & Reviews (2 weeks)
- Notes system
- Review system
- Permissions

---

### Step 6 — Exchange System (3–4 weeks)
- Exchange flow
- Geo support
- Trust system

---

## 🔐 Trust System

- User rating
- Exchange success rate
- Future moderation system

---

## ⚠️ Risks & Pitfalls

### Must Avoid

- ❌ Flat data model (no layering)
- ❌ Over-reliance on AI recognition
- ❌ No user confirmation step
- ❌ Non-containerized dev environment

---

## 🧭 Development Priorities

```
1. Data schema
2. CRUD system
3. Scan ingestion
4. Search
5. Exchange
6. Social features
```

---

## 🧠 Final Insight

BookShire is not just:

❌ a book catalog tool  

It is:

> ✅ a **data + interaction platform centered on books**

---

## 📌 Next Steps

Start with:

- Database schema (PostgreSQL)
- Dockerized MVP system
