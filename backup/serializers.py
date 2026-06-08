"""
owner_panel/backup/serializers.py
"""

from rest_framework import serializers
from backup.models import BackupRecord, BackupSchedule


class BackupRecordSerializer(serializers.ModelSerializer):
    duration_seconds = serializers.ReadOnlyField()
    file_size_mb = serializers.ReadOnlyField()
    table_count = serializers.SerializerMethodField()

    class Meta:
        model = BackupRecord
        fields = [
            'id', 'school_id', 'school_name', 'initiated_by',
            'started_at', 'completed_at', 'status',
            'file_size_bytes', 'file_size_mb', 'zip_filename',
            'tables_backed_up', 'table_count', 'error_message',
            'recipient_email', 'emailed_at', 'trigger',
            'duration_seconds',
        ]
        read_only_fields = fields

    def get_table_count(self, obj):
        return len(obj.tables_backed_up) if obj.tables_backed_up else 0


class InitiateBackupSerializer(serializers.Serializer):
    school_id = serializers.CharField(max_length=100)
    recipient_email = serializers.EmailField(required=False, allow_blank=True, default='')


class BackupScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupSchedule
        fields = [
            'id', 'school_id', 'school_name', 'is_active',
            'day_of_month', 'recipient_email', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_day_of_month(self, value):
        if not (1 <= value <= 28):
            raise serializers.ValidationError("day_of_month must be between 1 and 28.")
        return value