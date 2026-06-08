"""
backup/tasks.py - Background execution for backups.
"""

import logging
import threading

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Thread-based background execution (always available)
# ─────────────────────────────────────────────────────────────────────────────

def _thread_target(school_id, initiated_by, recipient_email):
    """Target function run in a background daemon thread."""
    from backup.service import BackupService
    try:
        BackupService.run(
            school_id=school_id,
            initiated_by=initiated_by,
            recipient_email=recipient_email,
        )
    except Exception as exc:
        logger.exception(f"[BackupThread] Unhandled error for school={school_id}: {exc}")


def run_backup_in_thread(school_id: str, initiated_by: str = '',
                         recipient_email: str = '') -> threading.Thread:
    """Fire-and-forget: start a daemon thread and return it immediately."""
    t = threading.Thread(
        target=_thread_target,
        args=(school_id, initiated_by, recipient_email),
        daemon=True,
        name=f"backup-{school_id}",
    )
    t.start()
    logger.info(f"[Backup] Thread started for school={school_id}")
    return t


# ─────────────────────────────────────────────────────────────────────────────
# Celery task (optional – only registered if Celery is installed)
# ─────────────────────────────────────────────────────────────────────────────

CELERY_AVAILABLE = False
celery_backup_task = None

try:
    from celery import shared_task

    @shared_task(bind=True, max_retries=2, default_retry_delay=60,
                 name='backup.tasks.celery_backup_task')
    def celery_backup_task(self, school_id: str, initiated_by: str = '',
                           recipient_email: str = ''):
        """Celery-compatible backup task."""
        from backup.service import BackupService
        try:
            record = BackupService.run(
                school_id=school_id,
                initiated_by=initiated_by,
                recipient_email=recipient_email,
            )
            return {'record_id': record.id, 'status': record.status}
        except Exception as exc:
            logger.exception(f"[CeleryBackup] Error school={school_id}: {exc}")
            raise self.retry(exc=exc)

    CELERY_AVAILABLE = True

except ImportError:
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Scheduled backup runner
# ─────────────────────────────────────────────────────────────────────────────

def run_scheduled_backups():
    """
    Check BackupSchedule records and trigger any that are due today.
    Call this from a cron job or a management command.
    """
    from datetime import date
    from backup.models import BackupSchedule
    from core.school_registry import SCHOOL_REGISTRY

    today = date.today()
    day = today.day

    schedules = BackupSchedule.objects.filter(is_active=True, day_of_month=day)
    logger.info(f"[ScheduledBackup] Found {schedules.count()} schedule(s) due today (day {day})")

    for sched in schedules:
        if sched.school_id not in SCHOOL_REGISTRY:
            logger.warning(f"[ScheduledBackup] school_id={sched.school_id} not in registry – skipped")
            continue
        logger.info(f"[ScheduledBackup] Triggering backup for school={sched.school_id}")
        run_backup_async(
            school_id=sched.school_id,
            initiated_by='SCHEDULED',
            recipient_email=sched.recipient_email,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Unified entry point used by views
# ─────────────────────────────────────────────────────────────────────────────

def run_backup_async(school_id: str, initiated_by: str = '',
                     recipient_email: str = ''):
    """
    Dispatch a backup job.
    Prefers Celery if available; falls back to daemon thread.
    """
    if CELERY_AVAILABLE and celery_backup_task is not None:
        celery_backup_task.delay(
            school_id=school_id,
            initiated_by=initiated_by,
            recipient_email=recipient_email,
        )
        logger.info(f"[Backup] Dispatched via Celery for school={school_id}")
    else:
        run_backup_in_thread(
            school_id=school_id,
            initiated_by=initiated_by,
            recipient_email=recipient_email,
        )
        logger.info(f"[Backup] Dispatched via thread for school={school_id}")