-- BookShire PostgreSQL Production Schema
-- Target: PostgreSQL 15+ with PostGIS
-- Purpose: Personal book management + future local exchange + notes/reviews/social visibility

BEGIN;

-- ============================================================
-- 0. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1. ENUM Types
-- ============================================================
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active', 'disabled', 'deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE visibility_level AS ENUM ('private', 'friends', 'public'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE reading_status AS ENUM ('unread', 'reading', 'read', 'abandoned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE book_format AS ENUM ('hardcover', 'paperback', 'ebook', 'audiobook', 'unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE metadata_source AS ENUM ('google_books', 'open_library', 'user', 'ocr', 'vision', 'import', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE note_type AS ENUM ('note', 'highlight', 'summary', 'quote'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE exchange_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'completed', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ingestion_input_type AS ENUM ('isbn_scan', 'image_upload', 'camera_image', 'manual', 'import'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ingestion_status AS ENUM ('pending', 'recognized', 'multiple_candidates', 'needs_user_input', 'confirmed', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE image_kind AS ENUM ('cover', 'spine', 'back_cover', 'inside_page', 'user_upload', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. Common updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Users and social graph
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE,
    username CITEXT UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    status user_status NOT NULL DEFAULT 'active',
    preferred_languages TEXT[] NOT NULL DEFAULT ARRAY['en']::TEXT[],
    home_location GEOGRAPHY(POINT, 4326),
    home_location_text TEXT,
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    trust_score NUMERIC(8,4) NOT NULL DEFAULT 0 CHECK (trust_score >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_users_home_location ON users USING gist(home_location);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score DESC);

CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id),
    CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);
DROP TRIGGER IF EXISTS trg_friendships_updated_at ON friendships;
CREATE TRIGGER trg_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- ============================================================
-- 4. Contributors
-- ============================================================
CREATE TABLE IF NOT EXISTS contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT,
    original_name TEXT,
    birth_year INTEGER,
    death_year INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT contributors_name_not_empty CHECK (length(trim(name)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_contributors_normalized_name ON contributors(normalized_name);
CREATE INDEX IF NOT EXISTS idx_contributors_name_trgm ON contributors USING gin(normalized_name gin_trgm_ops);
CREATE OR REPLACE FUNCTION normalize_contributor_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name := lower(unaccent(NEW.name));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contributors_normalize ON contributors;

CREATE TRIGGER trg_contributors_normalize
BEFORE INSERT OR UPDATE ON contributors
FOR EACH ROW
EXECUTE FUNCTION normalize_contributor_name();
-- ============================================================
-- 5. Books / Editions / Descriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    subtitle TEXT,

    normalized_title TEXT,

    original_language VARCHAR(10),

    canonical_cover_url TEXT,
    canonical_description TEXT,
    canonical_description_language VARCHAR(10),

    categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    metadata_source TEXT,
    external_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
    avg_rating NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    popularity_score NUMERIC(12,4) DEFAULT 0,

    search_vector TSVECTOR,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION normalize_book_title()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_title := lower(unaccent(NEW.title));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_books_normalize ON books;

CREATE TRIGGER trg_books_normalize
BEFORE INSERT OR UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION normalize_book_title();

DROP TRIGGER IF EXISTS trg_books_updated_at ON books;
CREATE TRIGGER trg_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_books_normalized_title ON books(normalized_title);
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING gin(normalized_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_search_vector ON books USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_books_original_language ON books(original_language);
CREATE INDEX IF NOT EXISTS idx_books_categories ON books USING gin(categories);
CREATE INDEX IF NOT EXISTS idx_books_tags ON books USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_books_external_ids ON books USING gin(external_ids);

CREATE OR REPLACE FUNCTION update_books_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.subtitle, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(NEW.canonical_description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_books_search_vector ON books;

CREATE TRIGGER trg_books_search_vector
BEFORE INSERT OR UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_books_search_vector();

CREATE TABLE IF NOT EXISTS book_contributors (
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    contributor_id UUID NOT NULL REFERENCES contributors(id) ON DELETE RESTRICT,
    role TEXT NOT NULL CHECK (role IN ('author', 'translator', 'editor', 'illustrator', 'other')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (book_id, contributor_id, role)
);
CREATE INDEX IF NOT EXISTS idx_book_contributors_contributor ON book_contributors(contributor_id);
CREATE INDEX IF NOT EXISTS idx_book_contributors_role ON book_contributors(role);

CREATE TABLE IF NOT EXISTS book_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    source metadata_source NOT NULL DEFAULT 'user',
    source_url TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT book_descriptions_non_empty CHECK (length(trim(description)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_book_descriptions_book_lang ON book_descriptions(book_id, language);
CREATE UNIQUE INDEX IF NOT EXISTS uq_book_primary_description_per_lang ON book_descriptions(book_id, language) WHERE is_primary = true;

CREATE TABLE IF NOT EXISTS editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title TEXT,
    subtitle TEXT,
    language VARCHAR(10) NOT NULL,
    isbn_10 VARCHAR(10),
    isbn_13 VARCHAR(13),
    publisher TEXT,
    publication_date DATE,
    publication_year INTEGER,
    format book_format NOT NULL DEFAULT 'unknown',
    binding TEXT,
    page_count INTEGER CHECK (page_count IS NULL OR page_count >= 0),
    edition_statement TEXT,
    print_version TEXT,
    cover_url TEXT,
    cover_source metadata_source,
    metadata_source metadata_source NOT NULL DEFAULT 'user',
    external_ids JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT editions_isbn_10_length CHECK (isbn_10 IS NULL OR length(isbn_10) = 10),
    CONSTRAINT editions_isbn_13_length CHECK (isbn_13 IS NULL OR length(isbn_13) = 13)
);
DROP TRIGGER IF EXISTS trg_editions_updated_at ON editions;
CREATE TRIGGER trg_editions_updated_at BEFORE UPDATE ON editions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE UNIQUE INDEX IF NOT EXISTS uq_editions_isbn_10 ON editions(isbn_10) WHERE isbn_10 IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_editions_isbn_13 ON editions(isbn_13) WHERE isbn_13 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_editions_book_id ON editions(book_id);
CREATE INDEX IF NOT EXISTS idx_editions_language ON editions(language);
CREATE INDEX IF NOT EXISTS idx_editions_publisher ON editions(publisher);
CREATE INDEX IF NOT EXISTS idx_editions_publication_year ON editions(publication_year);
CREATE INDEX IF NOT EXISTS idx_editions_external_ids ON editions USING gin(external_ids);

-- ============================================================
-- 6. Images / Covers
-- ============================================================
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    kind image_kind NOT NULL DEFAULT 'cover',
    url TEXT NOT NULL,
    storage_key TEXT,
    width INTEGER CHECK (width IS NULL OR width > 0),
    height INTEGER CHECK (height IS NULL OR height > 0),
    mime_type TEXT,
    source metadata_source NOT NULL DEFAULT 'user',
    checksum TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_images_owner_user ON images(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_images_kind ON images(kind);
CREATE INDEX IF NOT EXISTS idx_images_checksum ON images(checksum);

CREATE TABLE IF NOT EXISTS book_images (
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (book_id, image_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_book_primary_image ON book_images(book_id) WHERE is_primary = true;

CREATE TABLE IF NOT EXISTS edition_images (
    edition_id UUID NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (edition_id, image_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_edition_primary_image ON edition_images(edition_id) WHERE is_primary = true;

-- ============================================================
-- 7. User library / ownership
-- ============================================================
CREATE TABLE IF NOT EXISTS user_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    edition_id UUID NOT NULL REFERENCES editions(id) ON DELETE RESTRICT,
    status reading_status NOT NULL DEFAULT 'unread',
    condition INTEGER CHECK (condition IS NULL OR condition BETWEEN 1 AND 5),
    location_text TEXT,
    location_geo GEOGRAPHY(POINT, 4326),
    exchangeable BOOLEAN NOT NULL DEFAULT false,
    visibility visibility_level NOT NULL DEFAULT 'private',
    user_cover_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
    personal_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    personal_notes_summary TEXT,
    acquired_at DATE,
    started_at DATE,
    finished_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT user_books_dates_order CHECK (started_at IS NULL OR finished_at IS NULL OR started_at <= finished_at)
);
DROP TRIGGER IF EXISTS trg_user_books_updated_at ON user_books;
CREATE TRIGGER trg_user_books_updated_at BEFORE UPDATE ON user_books FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_edition_id ON user_books(edition_id);
CREATE INDEX IF NOT EXISTS idx_user_books_status ON user_books(status);
CREATE INDEX IF NOT EXISTS idx_user_books_exchangeable ON user_books(exchangeable);
CREATE INDEX IF NOT EXISTS idx_user_books_visibility ON user_books(visibility);
CREATE INDEX IF NOT EXISTS idx_user_books_personal_tags ON user_books USING gin(personal_tags);
CREATE INDEX IF NOT EXISTS idx_user_books_location_geo ON user_books USING gist(location_geo);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_books_active_copy ON user_books(user_id, edition_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 8. Notes and Reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_book_id UUID REFERENCES user_books(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    type note_type NOT NULL DEFAULT 'note',
    content TEXT NOT NULL,
    page_number INTEGER CHECK (page_number IS NULL OR page_number >= 0),
    location_hint TEXT,
    visibility visibility_level NOT NULL DEFAULT 'private',
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT notes_content_not_empty CHECK (length(trim(content)) > 0)
);
DROP TRIGGER IF EXISTS trg_notes_updated_at ON notes;
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE FUNCTION update_notes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', coalesce(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_notes_search_vector ON notes;
CREATE TRIGGER trg_notes_search_vector BEFORE INSERT OR UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_notes_search_vector();
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_book_id ON notes(user_book_id);
CREATE INDEX IF NOT EXISTS idx_notes_visibility ON notes(visibility);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_notes_search_vector ON notes USING gin(search_vector);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    edition_id UUID REFERENCES editions(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    content TEXT,
    visibility visibility_level NOT NULL DEFAULT 'public',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT reviews_content_or_rating CHECK (rating IS NOT NULL OR (content IS NOT NULL AND length(trim(content)) > 0))
);
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_user_book_active ON reviews(user_id, book_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_visibility ON reviews(visibility);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ============================================================
-- 9. Exchange system
-- ============================================================
CREATE TABLE IF NOT EXISTS exchange_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status exchange_status NOT NULL DEFAULT 'pending',
    request_message TEXT,
    response_message TEXT,
    proposed_meeting_location_text TEXT,
    proposed_meeting_location_geo GEOGRAPHY(POINT, 4326),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT exchange_not_self CHECK (owner_id <> requester_id)
);
DROP TRIGGER IF EXISTS trg_exchange_requests_updated_at ON exchange_requests;
CREATE TRIGGER trg_exchange_requests_updated_at BEFORE UPDATE ON exchange_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_exchange_requests_user_book ON exchange_requests(user_book_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_owner ON exchange_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester ON exchange_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_status ON exchange_requests(status);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_location_geo ON exchange_requests USING gist(proposed_meeting_location_geo);
CREATE UNIQUE INDEX IF NOT EXISTS uq_exchange_pending_per_requester_book ON exchange_requests(user_book_id, requester_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS exchange_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_request_id UUID NOT NULL REFERENCES exchange_requests(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT exchange_reviews_not_self CHECK (reviewer_id <> reviewee_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_exchange_review_once ON exchange_reviews(exchange_request_id, reviewer_id, reviewee_id);
CREATE INDEX IF NOT EXISTS idx_exchange_reviews_reviewee ON exchange_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_exchange_reviews_reviewer ON exchange_reviews(reviewer_id);

-- ============================================================
-- 10. Ingestion / recognition pipeline
-- ============================================================
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input_type ingestion_input_type NOT NULL,
    status ingestion_status NOT NULL DEFAULT 'pending',
    raw_input JSONB NOT NULL DEFAULT '{}'::JSONB,
    parsed_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    confidence JSONB NOT NULL DEFAULT '{}'::JSONB,
    selected_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    selected_edition_id UUID REFERENCES editions(id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);
DROP TRIGGER IF EXISTS trg_ingestion_jobs_updated_at ON ingestion_jobs;
CREATE TRIGGER trg_ingestion_jobs_updated_at BEFORE UPDATE ON ingestion_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_user ON ingestion_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_input_type ON ingestion_jobs(input_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_raw_input ON ingestion_jobs USING gin(raw_input);

CREATE TABLE IF NOT EXISTS ingestion_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingestion_job_id UUID NOT NULL REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
    source metadata_source NOT NULL,
    candidate_data JSONB NOT NULL,
    confidence NUMERIC(5,4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    edition_id UUID REFERENCES editions(id) ON DELETE SET NULL,
    rank INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ingestion_candidates_job ON ingestion_candidates(ingestion_job_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_candidates_rank ON ingestion_candidates(ingestion_job_id, rank);

CREATE TABLE IF NOT EXISTS isbn_cache (
    isbn VARCHAR(13) PRIMARY KEY,
    source metadata_source NOT NULL,
    payload JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    edition_id UUID REFERENCES editions(id) ON DELETE SET NULL,
    CONSTRAINT isbn_cache_valid_length CHECK (length(isbn) IN (10, 13))
);
CREATE INDEX IF NOT EXISTS idx_isbn_cache_expires_at ON isbn_cache(expires_at);

-- ============================================================
-- 11. Derived stats functions
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_user_trust(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    cnt INTEGER;
    completed_count INTEGER;
    total_count INTEGER;
    completion_rate NUMERIC;
BEGIN
    SELECT COALESCE(avg(rating), 5.00)::NUMERIC(3,2), count(*)
    INTO avg_rating, cnt
    FROM exchange_reviews
    WHERE reviewee_id = target_user_id;

    SELECT count(*) FILTER (WHERE status = 'completed'), count(*)
    INTO completed_count, total_count
    FROM exchange_requests
    WHERE owner_id = target_user_id OR requester_id = target_user_id;

    IF total_count = 0 THEN
        completion_rate := 0;
    ELSE
        completion_rate := completed_count::NUMERIC / total_count::NUMERIC;
    END IF;

    UPDATE users
    SET rating_avg = COALESCE(avg_rating, 5.00),
        rating_count = COALESCE(cnt, 0),
        trust_score = (0.50 * COALESCE(avg_rating, 5.00)) +
                      (0.30 * ln(COALESCE(completed_count, 0) + 1)) +
                      (0.20 * COALESCE(completion_rate, 0)),
        updated_at = now()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_book_rating(target_book_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE books
    SET avg_rating = COALESCE((
            SELECT avg(rating)::NUMERIC(3,2)
            FROM reviews
            WHERE book_id = target_book_id
              AND visibility = 'public'
              AND deleted_at IS NULL
              AND rating IS NOT NULL
        ), 0),
        rating_count = COALESCE((
            SELECT count(*)
            FROM reviews
            WHERE book_id = target_book_id
              AND visibility = 'public'
              AND deleted_at IS NULL
              AND rating IS NOT NULL
        ), 0),
        updated_at = now()
    WHERE id = target_book_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 12. Useful query view
-- ============================================================
CREATE OR REPLACE VIEW public_exchangeable_books AS
SELECT
    ub.id AS user_book_id,
    ub.user_id AS owner_id,
    u.display_name AS owner_display_name,
    b.id AS book_id,
    b.title,
    b.subtitle,
    e.id AS edition_id,
    e.language,
    e.isbn_13,
    e.isbn_10,
    e.publisher,
    e.publication_year,
    COALESCE(e.cover_url, b.canonical_cover_url) AS cover_url,
    ub.user_cover_image_id,
    ub.condition,
    ub.location_text,
    ub.location_geo,
    ub.created_at
FROM user_books ub
JOIN users u ON u.id = ub.user_id
JOIN editions e ON e.id = ub.edition_id
JOIN books b ON b.id = e.book_id
WHERE ub.exchangeable = true
  AND ub.deleted_at IS NULL
  AND ub.visibility IN ('friends', 'public')
  AND u.status = 'active';

-- ============================================================
-- 13. Comments
-- ============================================================
COMMENT ON TABLE books IS 'Abstract work-level book metadata shared across users.';
COMMENT ON TABLE editions IS 'Version-level book metadata such as ISBN, publisher, language, and format.';
COMMENT ON TABLE user_books IS 'User-owned physical/digital copy of an edition, including condition, location, and exchange status.';
COMMENT ON TABLE notes IS 'Private/friends/public reading notes and highlights.';
COMMENT ON TABLE reviews IS 'User reviews of books; distinct from reading notes.';
COMMENT ON TABLE exchange_requests IS 'Book exchange workflow between owner and requester.';
COMMENT ON TABLE ingestion_jobs IS 'Book ingestion workflow for ISBN scan, image upload, OCR, vision, manual entry, or import.';

COMMIT;
