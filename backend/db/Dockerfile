FROM postgis/postgis:16-3.4

# Install pre-compiled pgvector directly from PostgreSQL apt repository
RUN apt-get update && apt-get install -y \
    postgresql-16-pgvector \
    && rm -rf /var/lib/apt/lists/*

# Add initialization script to enable extensions
RUN mkdir -p /docker-entrypoint-initdb.d
COPY init-extensions.sql /docker-entrypoint-initdb.d/
