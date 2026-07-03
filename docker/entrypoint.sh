#!/bin/sh
# entrypoint.sh — Owner Panel backend

set -e

echo "Starting EduFlow Owner Panel Backend..."

if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "Running migrations..."
    python manage.py migrate --noinput || echo "Migration warning - continuing..."
fi

echo "Ensuring owner superuser exists (from .env, idempotent)..."
python manage.py ensure_superuser || echo "Superuser step warning - continuing..."

if [ ! -d "/app/staticfiles/admin" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput --clear
fi

echo "Setup complete! Starting server..."
exec "$@"