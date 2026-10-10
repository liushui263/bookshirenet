"""add user review and book fields

Revision ID: a51810f24042
Revises: 0001_create_books_table
Create Date: 2026-04-30 22:40:03.946685

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a51810f24042'
down_revision: Union[str, Sequence[str], None] = '0001_create_books_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('preferences', sa.ARRAY(sa.String()))
    )

    op.create_table(
        'reviews',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String()),
        sa.Column('book_id', sa.String()),
        sa.Column('rating', sa.Integer()),
        sa.Column('content', sa.Text())
    )

    op.add_column('books', sa.Column('rating_avg', sa.Float(), server_default="0"))
    op.add_column('books', sa.Column('rating_count', sa.Integer(), server_default="0"))
    op.add_column('books', sa.Column('tags', sa.ARRAY(sa.String())))

def downgrade():
    op.drop_column('books', 'tags')
    op.drop_column('books', 'rating_count')
    op.drop_column('books', 'rating_avg')

    op.drop_table('reviews')
    op.drop_table('users')