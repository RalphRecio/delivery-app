#!/bin/sh
# Prepares the bind-mounted backend before the container's command runs:
# installs dependencies on a fresh clone, waits for PostgreSQL, then migrates
# and seeds (both are idempotent). The queue worker and scheduler skip the
# migration step (RUN_MIGRATIONS=0) so only the API container touches the schema.
set -eu

if [ ! -f vendor/autoload.php ]; then
    echo "entrypoint: vendor/ missing, running composer install"
    composer install --no-interaction --prefer-dist
fi

until pg_isready -q -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-delivery}"; do
    echo "entrypoint: waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}"
    sleep 1
done

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
    php artisan migrate --force
    php artisan db:seed --force
fi

exec "$@"
