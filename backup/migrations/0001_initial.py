"""
backup/migrations/0001_initial.py
"""

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='BackupRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('school_id', models.CharField(max_length=100)),
                ('school_name', models.CharField(blank=True, max_length=255)),
                ('initiated_by', models.CharField(blank=True, max_length=150)),
                ('started_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('running', 'Running'),
                             ('completed', 'Completed'), ('failed', 'Failed'), ('emailed', 'Emailed')],
                    default='pending', max_length=20)),
                ('file_size_bytes', models.BigIntegerField(blank=True, null=True)),
                ('zip_filename', models.CharField(blank=True, max_length=512)),
                ('tables_backed_up', models.JSONField(default=dict)),
                ('error_message', models.TextField(blank=True)),
                ('recipient_email', models.EmailField(blank=True, max_length=254)),
                ('emailed_at', models.DateTimeField(blank=True, null=True)),
                ('trigger', models.CharField(
                    choices=[('manual', 'Manual'), ('scheduled', 'Scheduled')],
                    default='manual', max_length=20)),
            ],
            options={
                'ordering': ['-started_at'],
                'verbose_name': 'Backup Record',
                'verbose_name_plural': 'Backup Records',
            },
        ),
        migrations.CreateModel(
            name='BackupSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('school_id', models.CharField(max_length=100, unique=True)),
                ('school_name', models.CharField(blank=True, max_length=255)),
                ('is_active', models.BooleanField(default=False)),
                ('day_of_month', models.PositiveSmallIntegerField(default=1)),
                ('recipient_email', models.EmailField(blank=True, max_length=254)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Backup Schedule',
                'verbose_name_plural': 'Backup Schedules',
            },
        ),
    ]