FROM postgres:14

COPY init.sql /docker-entrypoint-initdb.d/

HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1