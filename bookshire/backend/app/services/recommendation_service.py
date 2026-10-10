from sqlalchemy.orm import Session
from app.models.book import Book
from app.models.user import User

def recommend_books(db, user_id: str):
    user = db.query(User).filter(User.id == user_id).first()

    books = db.query(Book).all()

    if not user or not user.preferences:
        return books[:10]

    def score(book):
        if not book.tags:
            return 0
        return len(set(book.tags) & set(user.preferences))

    ranked = sorted(books, key=score, reverse=True)

    return ranked[:20]