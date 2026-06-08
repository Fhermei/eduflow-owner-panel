"""
owner_panel/backup/models.py
"""

from django.db import models
from django.utils import timezone


class BackupRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('emailed', 'Emailed'),
    ]
    TRIGGER_CHOICES = [
        ('manual', 'Manual'),
        ('scheduled', 'Scheduled'),
    ]

    school_id = models.CharField(max_length=100)
    school_name = models.CharField(max_length=255, blank=True)
    initiated_by = models.CharField(max_length=150, blank=True)
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    zip_filename = models.CharField(max_length=512, blank=True)
    tables_backed_up = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)
    recipient_email = models.EmailField(blank=True)
    emailed_at = models.DateTimeField(null=True, blank=True)
    trigger = models.CharField(max_length=20, choices=TRIGGER_CHOICES, default='manual')

    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Backup Record'
        verbose_name_plural = 'Backup Records'

    def __str__(self):
        return f"[{self.school_id}] {self.status} @ {self.started_at:%Y-%m-%d %H:%M}"

    @property
    def duration_seconds(self):
        if self.completed_at and self.started_at:
            return round((self.completed_at - self.started_at).total_seconds())
        return None

    @property
    def file_size_mb(self):
        if self.file_size_bytes:
            return round(self.file_size_bytes / (1024 * 1024), 2)
        return None


class BackupSchedule(models.Model):
    school_id = models.CharField(max_length=100, unique=True)
    school_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=False)
    day_of_month = models.PositiveSmallIntegerField(default=1)
    recipient_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Backup Schedule'
        verbose_name_plural = 'Backup Schedules'

    def __str__(self):
        return f"Schedule for {self.school_id} – day {self.day_of_month}"