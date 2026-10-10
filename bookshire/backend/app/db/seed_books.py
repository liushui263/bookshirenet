import json
import os

from sqlalchemy import create_engine, text


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://bookshire:password@db:5432/bookshire",
)


BOOKS = [
    {
        "id": "b016b716-3e4b-41ba-8ab3-be6bf214a308",
        "edition_id": "f394e6dc-2ee0-4109-9951-48dccdbcbb68",
        "title": "Sapiens",
        "subtitle": "A Brief History of Humankind",
        "normalized_title": "sapiens",
        "original_language": "en",
        "description": "A sweeping history of humankind, from early Homo sapiens to modern civilization.",
        "categories": ["history", "science"],
        "tags": ["nonfiction", "anthropology", "history"],
        "isbn_10": "0062316095",
        "isbn_13": "9780062316097",
        "publisher": "Harper",
        "publication_year": 2015,
        "avg_rating": 4.50,
        "rating_count": 1000,
        "popularity_score": 95.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111111",
        "edition_id": "21111111-1111-4111-8111-111111111111",
        "title": "1984",
        "subtitle": None,
        "normalized_title": "1984",
        "original_language": "en",
        "description": "A dystopian novel about surveillance, authoritarianism, language, and political control.",
        "categories": ["fiction", "politics"],
        "tags": ["dystopian", "classic", "fiction"],
        "isbn_10": "0451524934",
        "isbn_13": "9780451524935",
        "publisher": "Signet Classics",
        "publication_year": 1950,
        "avg_rating": 4.70,
        "rating_count": 2000,
        "popularity_score": 98.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111112",
        "edition_id": "21111111-1111-4111-8111-111111111112",
        "title": "Atomic Habits",
        "subtitle": "An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        "normalized_title": "atomic habits",
        "original_language": "en",
        "description": "A practical guide to habit formation, behavior change, and small incremental improvement.",
        "categories": ["self-help", "productivity"],
        "tags": ["habits", "self-help", "productivity"],
        "isbn_10": "0735211299",
        "isbn_13": "9780735211292",
        "publisher": "Avery",
        "publication_year": 2018,
        "avg_rating": 4.60,
        "rating_count": 1500,
        "popularity_score": 92.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111113",
        "edition_id": "21111111-1111-4111-8111-111111111113",
        "title": "The Pragmatic Programmer",
        "subtitle": "Your Journey to Mastery",
        "normalized_title": "the pragmatic programmer",
        "original_language": "en",
        "description": "A software engineering classic about craftsmanship, debugging, design, and professional practice.",
        "categories": ["technology", "programming"],
        "tags": ["software", "programming", "engineering"],
        "isbn_10": "0135957052",
        "isbn_13": "9780135957059",
        "publisher": "Addison-Wesley",
        "publication_year": 2019,
        "avg_rating": 4.80,
        "rating_count": 900,
        "popularity_score": 88.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111114",
        "edition_id": "21111111-1111-4111-8111-111111111114",
        "title": "Clean Code",
        "subtitle": "A Handbook of Agile Software Craftsmanship",
        "normalized_title": "clean code",
        "original_language": "en",
        "description": "A programming book focused on readable code, refactoring, testing, and software craftsmanship.",
        "categories": ["technology", "programming"],
        "tags": ["software", "clean-code", "engineering"],
        "isbn_10": "0132350882",
        "isbn_13": "9780132350884",
        "publisher": "Prentice Hall",
        "publication_year": 2008,
        "avg_rating": 4.40,
        "rating_count": 1200,
        "popularity_score": 86.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111115",
        "edition_id": "21111111-1111-4111-8111-111111111115",
        "title": "Designing Data-Intensive Applications",
        "subtitle": "The Big Ideas Behind Reliable, Scalable, and Maintainable Systems",
        "normalized_title": "designing data-intensive applications",
        "original_language": "en",
        "description": "A systems engineering book about databases, distributed systems, reliability, and scalability.",
        "categories": ["technology", "systems"],
        "tags": ["database", "distributed-systems", "backend"],
        "isbn_10": "1449373321",
        "isbn_13": "9781449373320",
        "publisher": "O'Reilly Media",
        "publication_year": 2017,
        "avg_rating": 4.80,
        "rating_count": 800,
        "popularity_score": 90.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111116",
        "edition_id": "21111111-1111-4111-8111-111111111116",
        "title": "The Three-Body Problem",
        "subtitle": None,
        "normalized_title": "the three-body problem",
        "original_language": "zh",
        "description": "A science fiction novel about first contact, physics, civilization, and cosmic survival.",
        "categories": ["fiction", "science-fiction"],
        "tags": ["sci-fi", "chinese-literature", "fiction"],
        "isbn_10": "0765382032",
        "isbn_13": "9780765382030",
        "publisher": "Tor Books",
        "publication_year": 2014,
        "avg_rating": 4.30,
        "rating_count": 1100,
        "popularity_score": 89.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111117",
        "edition_id": "21111111-1111-4111-8111-111111111117",
        "title": "To Kill a Mockingbird",
        "subtitle": None,
        "normalized_title": "to kill a mockingbird",
        "original_language": "en",
        "description": "A classic novel about justice, childhood, race, and morality in the American South.",
        "categories": ["fiction", "classic"],
        "tags": ["classic", "literature", "fiction"],
        "isbn_10": "0061120081",
        "isbn_13": "9780061120084",
        "publisher": "Harper Perennial",
        "publication_year": 2006,
        "avg_rating": 4.60,
        "rating_count": 1800,
        "popularity_score": 93.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111118",
        "edition_id": "21111111-1111-4111-8111-111111111118",
        "title": "The Great Gatsby",
        "subtitle": None,
        "normalized_title": "the great gatsby",
        "original_language": "en",
        "description": "A classic American novel about wealth, ambition, love, illusion, and the Jazz Age.",
        "categories": ["fiction", "classic"],
        "tags": ["classic", "american-literature", "fiction"],
        "isbn_10": "0743273567",
        "isbn_13": "9780743273565",
        "publisher": "Scribner",
        "publication_year": 2004,
        "avg_rating": 4.10,
        "rating_count": 1600,
        "popularity_score": 85.0,
    },
    {
        "id": "11111111-1111-4111-8111-111111111119",
        "edition_id": "21111111-1111-4111-8111-111111111119",
        "title": "Thinking, Fast and Slow",
        "subtitle": None,
        "normalized_title": "thinking fast and slow",
        "original_language": "en",
        "description": "A psychology and behavioral economics book about decision-making, bias, and two modes of thinking.",
        "categories": ["psychology", "economics"],
        "tags": ["psychology", "behavioral-economics", "nonfiction"],
        "isbn_10": "0374533555",
        "isbn_13": "9780374533557",
        "publisher": "Farrar, Straus and Giroux",
        "publication_year": 2013,
        "avg_rating": 4.40,
        "rating_count": 1400,
        "popularity_score": 87.0,
    },
]


def seed_books():
    engine = create_engine(DATABASE_URL)

    insert_demo_user_sql = text(
        """
        INSERT INTO users (
            id,
            email,
            username,
            display_name
        )
        VALUES (
            '86f7818b-788e-4d0b-9e81-9c8bc918ac44',
            'demo@bookshire.local',
            'demo',
            'Demo User'
        )
        ON CONFLICT (id) DO NOTHING
        """
    )

    insert_book_sql = text(
        """
        INSERT INTO books (
            id,
            title,
            subtitle,
            normalized_title,
            original_language,
            canonical_description,
            categories,
            tags,
            metadata_source,
            external_ids,
            avg_rating,
            rating_count,
            popularity_score
        )
        VALUES (
            :id,
            :title,
            :subtitle,
            :normalized_title,
            :original_language,
            :canonical_description,
            :categories,
            :tags,
            'user',
            CAST(:external_ids AS jsonb),
            :avg_rating,
            :rating_count,
            :popularity_score
        )
        ON CONFLICT (id) DO NOTHING
        """
    )

    insert_edition_sql = text(
        """
        INSERT INTO editions (
            id,
            book_id,
            title,
            subtitle,
            language,
            isbn_10,
            isbn_13,
            publisher,
            publication_year,
            format,
            metadata_source,
            external_ids
        )
        VALUES (
            :edition_id,
            :book_id,
            :title,
            :subtitle,
            :language,
            :isbn_10,
            :isbn_13,
            :publisher,
            :publication_year,
            'unknown',
            'user',
            CAST(:external_ids AS jsonb)
        )
        ON CONFLICT (id) DO NOTHING
        """
    )

    with engine.begin() as conn:
        conn.execute(insert_demo_user_sql)

        for book in BOOKS:
            external_ids = {
                "isbn_10": book["isbn_10"],
                "isbn_13": book["isbn_13"],
                "seed": "bookshire-dev-v1",
            }

            conn.execute(
                insert_book_sql,
                {
                    "id": book["id"],
                    "title": book["title"],
                    "subtitle": book["subtitle"],
                    "normalized_title": book["normalized_title"],
                    "original_language": book["original_language"],
                    "canonical_description": book["description"],
                    "categories": book["categories"],
                    "tags": book["tags"],
                    "external_ids": json.dumps(external_ids),
                    "avg_rating": book["avg_rating"],
                    "rating_count": book["rating_count"],
                    "popularity_score": book["popularity_score"],
                },
            )

            conn.execute(
                insert_edition_sql,
                {
                    "edition_id": book["edition_id"],
                    "book_id": book["id"],
                    "title": book["title"],
                    "subtitle": book["subtitle"],
                    "language": book["original_language"],
                    "isbn_10": book["isbn_10"],
                    "isbn_13": book["isbn_13"],
                    "publisher": book["publisher"],
                    "publication_year": book["publication_year"],
                    "external_ids": json.dumps(external_ids),
                },
            )

    print(f"Seeded demo user and {len(BOOKS)} books/editions if missing.")


if __name__ == "__main__":
    seed_books()
