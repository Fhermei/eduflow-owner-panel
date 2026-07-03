# gunicorn.conf.py — OPTIMIZED FOR 512MB RAM (Render free tier)

import os

# 1 worker is safe for 512MB; bump via env if you're on a bigger plan
workers = int(os.environ.get('GUNICORN_WORKERS', 1))

# Sync workers use less memory than gevent/eventlet
worker_class = "sync"

# Threads are cheap (~1-2MB each) — use them instead of more processes
threads = int(os.environ.get('GUNICORN_THREADS', 4))

# Restart workers periodically to shed any memory leaks
max_requests = 200
max_requests_jitter = 50

timeout = 60
graceful_timeout = 10
keepalive = 2

bind = f"0.0.0.0:{os.environ.get('PORT', 8005)}"

# Don't preload — keeps memory usage lower at the cost of slightly slower boot
preload_app = False

loglevel = "warning"
accesslog = None
errorlog = "-"
capture_output = False

proc_name = "eduflow-owner-panel"

print(f"[gunicorn] Workers: {workers}, Threads: {threads}, Worker Class: {worker_class}")
print(f"[gunicorn] Bind: {bind}")
