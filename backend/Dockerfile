FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

# Install build dependencies
RUN apt-get update && \
    apt-get install -y gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip and install psycopg2-binary from source
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --force-reinstall --no-binary :all: psycopg2-binary==2.9.5 && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
