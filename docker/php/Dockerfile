# Development image for the Laravel API, the queue worker and the scheduler.
# The source is bind-mounted by docker-compose.yml, so nothing is copied here:
# the image only provides PHP 8.4 with the extensions Laravel + PostGIS need.
FROM php:8.4-cli-bookworm

# Build and runtime libraries for the extensions below, plus pg_isready
# (used by the entrypoint to wait for PostgreSQL).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git unzip libpq-dev libicu-dev libzip-dev postgresql-client \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql pcntl bcmath intl zip opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

WORKDIR /var/www/html
ENTRYPOINT ["entrypoint"]
