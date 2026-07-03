# syntax=docker/dockerfile:1

FROM python:3.12.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONOPTIMIZE=2
ENV PYTHONHASHSEED=random

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

COPY requirements.txt .

RUN pip install --upgrade pip --no-cache-dir && \
    pip install --only-binary psycopg2-binary -r requirements.txt --no-cache-dir

COPY . .

RUN mkdir -p /app/staticfiles /app/media /app/logs

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN addgroup --system --gid 1002 owner_panel && \
    adduser --system --uid 1002 --gid 1002 owner_panel && \
    chown -R owner_panel:owner_panel /app && \
    chown owner_panel:owner_panel /entrypoint.sh

USER owner_panel

EXPOSE 8005

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "owner_panel.wsgi:application", "--config", "gunicorn.conf.py"]