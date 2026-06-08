from django.contrib import admin
from backup.models import BackupRecord, BackupSchedule

@admin.register(BackupRecord)
class BackupRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'school_id', 'school_name', 'status', 'trigger', 'started_at', 'file_size_mb']
    list_filter = ['status', 'trigger', 'school_id']
    search_fields = ['school_id', 'school_name', 'initiated_by']
    readonly_fields = ['started_at', 'completed_at', 'file_size_bytes', 'zip_filename']
    ordering = ['-started_at']

@admin.register(BackupSchedule)
class BackupScheduleAdmin(admin.ModelAdmin):
    list_display = ['id', 'school_id', 'school_name', 'is_active', 'day_of_month', 'recipient_email']
    list_filter = ['is_active', 'day_of_month']
    search_fields = ['school_id', 'school_name', 'recipient_email']
    ordering = ['school_id']