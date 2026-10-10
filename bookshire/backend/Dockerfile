FROM python:3.11

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic ./alembic
COPY alembic.ini .
COPY app ./app
COPY entrypoint.sh .
COPY wait_for_db.py .

RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
