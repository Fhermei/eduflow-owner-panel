"""
owner_panel/backup/apps.py
"""

from django.apps import AppConfig


class BackupConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backup'
    label = 'backup'
    verbose_name = 'Data Backup'