"""Unit tests for ISBN parsing and the Google Books / Open Library response parsers (no network)."""

from app.services.isbn_lookup import normalize_isbn, parse_google_books, parse_open_library


def test_normalize_isbn_accepts_10_and_13_digit_forms():
    assert normalize_isbn("978-0-306-40615-7") == ("9780306406157", "0306406152")
    assert normalize_isbn("0306406152") == ("9780306406157", "0306406152")
    assert normalize_isbn("0 8044 2957 x") == ("9780804429573", "080442957X")
    assert normalize_isbn("9791032305690") == ("9791032305690", None)


def test_normalize_isbn_rejects_bad_check_digits_and_junk():
    assert normalize_isbn("9780306406158") is None
    assert normalize_isbn("0306406153") is None
    assert normalize_isbn("1234567890123") is None
    assert normalize_isbn("not an isbn") is None
    assert normalize_isbn("") is None


def test_parse_google_books():
    data = {
        "items": [
            {
                "id": "abc123",
                "volumeInfo": {
                    "title": "活着",
                    "authors": ["余华"],
                    "publisher": "作家出版社",
                    "publishedDate": "2012-08",
                    "language": "zh-CN",
                    "pageCount": 191,
                    "imageLinks": {"thumbnail": "http://books.google.com/x.jpg"},
                },
            }
        ]
    }
    meta = parse_google_books(data)
    assert meta.title == "活着"
    assert meta.authors == ["余华"]
    assert meta.publication_year == 2012
    assert meta.cover_url == "https://books.google.com/x.jpg"
    assert meta.external_ids == {"google_books_id": "abc123"}
    assert meta.source == "google_books"
    assert parse_google_books({"totalItems": 0}) is None
    assert parse_google_books(None) is None


def test_parse_open_library():
    data = {
        "ISBN:9780306406157": {
            "key": "/books/OL1M",
            "title": "Some Book",
            "authors": [{"name": "A. Writer"}],
            "publishers": [{"name": "Pub House"}],
            "publish_date": "March 1999",
            "number_of_pages": 300,
            "cover": {"medium": "https://covers.openlibrary.org/b/id/1-M.jpg"},
        }
    }
    meta = parse_open_library(data, "9780306406157")
    assert meta.title == "Some Book"
    assert meta.authors == ["A. Writer"]
    assert meta.publisher == "Pub House"
    assert meta.publication_year == 1999
    assert meta.external_ids == {"open_library_key": "/books/OL1M"}
    assert parse_open_library({}, "9780306406157") is None
