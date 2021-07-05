"""
owner_panel/backup/service.py - Backup service that connects directly to each
school's own Postgres database (not a local SQLite file).
"""

import csv
import io
import json
import logging
import os
import zipfile
from datetime import datetime
from decimal import Decimal

from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone

import psycopg2
import psycopg2.extras
from decouple import config

from backup.models import BackupRecord
from schools.models import School

logger = logging.getLogger(__name__)


def _get_school_db_url(school_id: str) -> str:
    """
    Each school's data lives in its own Postgres database (Supabase),
    configured via a per-school env var, e.g. SCHOOL_A_DATABASE_URL for
    school_id='school_a'. There is no local SQLite file to read on this
    server - that assumption was left over from local development on a
    Windows machine and never matched the deployed (Render) environment.
    """
    env_key = f"{school_id.upper()}_DATABASE_URL"
    url = config(env_key, default='')
    if not url:
        raise Exception(
            f"No database URL configured for school '{school_id}'. "
            f"Expected an env var named {env_key} on the Owner Panel service."
        )
    return url


def _safe_value(v):
    """Convert non-JSON-serialisable types to strings."""
    if isinstance(v, Decimal):
        return str(v)
    if isinstance(v, datetime):
        return v.isoformat()
    if hasattr(v, 'isoformat'):
        return v.isoformat()
    if isinstance(v, memoryview):
        return '<binary>'
    return v


def _rows_to_csv(headers, rows):
    """Return a CSV string."""
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=headers, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


# Models to backup from each school
BACKUP_MODELS = [
    # Users
    ('users', 'User'),
    ('users', 'Activity'),
    ('users', 'LoginAttempt'),
    # Students
    ('students', 'Student'),
    ('students', 'StudentEnrollment'),
    # Staff
    ('staff', 'Staff'),
    ('staff', 'StaffPermission'),
    ('staff', 'TeacherProfile'),
    # Parents
    ('parents', 'Parent'),
    # Academic
    ('academic', 'AcademicSession'),
    ('academic', 'AcademicTerm'),
    ('academic', 'ClassLevel'),
    ('academic', 'Class'),
    ('academic', 'Subject'),
    ('academic', 'Program'),
    # Results
    ('results', 'StudentResult'),
    ('results', 'SubjectScore'),
    ('results', 'PsychomotorSkills'),
    ('results', 'AffectiveDomains'),
    # Payments
    ('payments', 'FeeStructure'),
    ('payments', 'Invoice'),
    ('payments', 'Payment'),
    ('payments', 'BankAccount'),
    # Attendance
    ('attendance', 'Attendance'),
    ('attendance', 'ClassAttendanceReport'),
    ('attendance', 'AttendanceSummary'),
    # Timetable
    ('timetable', 'Timetable'),
    ('timetable', 'TimetableSlot'),
    ('timetable', 'Period'),
    # Library
    ('library', 'Book'),
    ('library', 'BookDownload'),
    ('library', 'BookView'),
    # Portal Fee
    ('portal_fee', 'PortalFeeInvoice'),
    ('portal_fee', 'PortalFeePayment'),
    ('portal_fee', 'StudentPortalAccess'),
    # Complaints
    ('complaints', 'Complaint'),
    ('complaints', 'ComplaintReply'),
    ('complaints', 'ComplaintNotification'),
]


class SchoolBackupService:
    """Backup service that connects directly to each school's Postgres database."""

    @classmethod
    def run(cls, school_id: str, initiated_by: str = '',
            recipient_email: str = '') -> BackupRecord:
        """Run backup for a specific school"""

        # Get school info
        try:
            school = School.objects.get(school_id=school_id)
            school_name = school.name
        except School.DoesNotExist:
            school_name = school_id

        # Create backup record
        record = BackupRecord.objects.create(
            school_id=school_id,
            school_name=school_name,
            initiated_by=initiated_by,
            status='running',
            recipient_email=recipient_email,
            trigger='manual',
        )

        try:
            # Resolve the school's own Postgres connection string
            db_url = _get_school_db_url(school_id)

            # Build backup zip
            zip_path, counts = cls._build_zip(school_id, db_url, record)

            record.zip_filename = os.path.basename(zip_path)
            record.file_size_bytes = os.path.getsize(zip_path)
            record.tables_backed_up = counts
            record.status = 'completed'
            record.completed_at = timezone.now()
            record.save()

            # Send email if recipient provided
            if recipient_email:
                cls._email_zip(zip_path, recipient_email, school_name, record)
                record.status = 'emailed'
                record.emailed_at = timezone.now()
                record.save()

            logger.info(f"[Backup] School={school_id} completed, size={record.file_size_mb}MB")

        except Exception as exc:
            logger.exception(f"[Backup] FAILED school={school_id}: {exc}")
            record.status = 'failed'
            record.error_message = str(exc)
            record.completed_at = timezone.now()
            record.save()

        return record

    @staticmethod
    def _build_zip(school_id: str, db_url: str, record: BackupRecord):
        """Build ZIP file by directly querying the school's Postgres database"""

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = os.path.join(settings.MEDIA_ROOT, 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        zip_filename = f"backup_{school_id}_{timestamp}.zip"
        zip_path = os.path.join(backup_dir, zip_filename)

        counts = {}
        summary = {
            'school_id': school_id,
            'backup_date': timestamp,
            'record_id': record.id,
            'tables': {},
        }

        # Connect to the school's own Postgres database
        conn = psycopg2.connect(db_url)
        # autocommit avoids a failed query (e.g. "table not found") aborting
        # the whole transaction and poisoning every query after it - Postgres
        # behaves differently from SQLite here, so this matters.
        conn.autocommit = True

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for app_label, model_name in BACKUP_MODELS:
                table_name = f"{app_label}_{model_name.lower()}"
                try:
                    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                        cursor.execute(f'SELECT * FROM "{table_name}"')
                        rows = cursor.fetchall()

                    table_key = f"{app_label}.{model_name}"

                    if rows:
                        data = [dict(row) for row in rows]
                        # normalise Decimal/datetime/etc. before writing
                        data = [
                            {k: _safe_value(v) for k, v in row.items()}
                            for row in data
                        ]
                        row_count = len(data)
                        counts[table_key] = row_count
                        summary['tables'][table_key] = row_count

                        # Write CSV
                        headers = list(data[0].keys())
                        csv_data = _rows_to_csv(headers, data)
                        zf.writestr(f"{app_label}/{model_name}.csv", csv_data.encode('utf-8'))

                        # Write JSON
                        json_data = json.dumps(data, default=str, indent=2)
                        zf.writestr(f"{app_label}/{model_name}.json", json_data.encode('utf-8'))

                        logger.debug(f"[Backup] {table_key}: {row_count} rows")
                    else:
                        counts[table_key] = 0

                except psycopg2.errors.UndefinedTable:
                    # Table doesn't exist in this school's schema - skip it
                    logger.debug(f"Table {table_name} not found")
                    counts[f"{app_label}.{model_name}"] = "Table not found"
                except Exception as e:
                    logger.warning(f"Error backing up {app_label}.{model_name}: {e}")
                    counts[f"{app_label}.{model_name}"] = f"ERROR: {e}"

            # Write summary
            zf.writestr('BACKUP_SUMMARY.json', json.dumps(summary, indent=2).encode('utf-8'))

        conn.close()
        return zip_path, counts

    @staticmethod
    def _email_zip(zip_path: str, recipient: str, school_name: str,
                    record: BackupRecord):
        """Send email with backup attachment"""

        subject = f"[EduFlow Owner] Data Backup – {school_name} – {record.started_at:%Y-%m-%d %H:%M}"
        body = (
            f"Hello,\n\n"
            f"Please find attached the full data backup for {school_name}.\n\n"
            f"• Backup ID   : {record.id}\n"
            f"• School      : {school_name} ({record.school_id})\n"
            f"• Started     : {record.started_at:%Y-%m-%d %H:%M:%S}\n"
            f"• Completed   : {record.completed_at:%Y-%m-%d %H:%M:%S}\n"
            f"• File size   : {record.file_size_mb} MB\n"
            f"• Tables      : {len(record.tables_backed_up)}\n\n"
            f"The ZIP contains CSV and JSON files for all school data.\n\n"
            f"Regards,\nEduFlow Owner System"
        )

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )

        with open(zip_path, 'rb') as f:
            email.attach(
                os.path.basename(zip_path),
                f.read(),
                'application/zip'
            )

        email.send(fail_silently=False)
        logger.info(f"[Backup] Email sent to {recipient}")