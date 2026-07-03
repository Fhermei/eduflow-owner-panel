from rest_framework import serializers
from .models import School, SchoolMetric


class SchoolMetricSerializer(serializers.ModelSerializer):
    """Serializer for school metrics"""
    
    health_status_display = serializers.CharField(source='get_health_status_display', read_only=True)
    
    class Meta:
        model = SchoolMetric
        fields = [
            'id',
            'total_users', 'active_users',
            'total_students', 'active_students',
            'total_staff', 'active_staff',
            'total_parents', 'total_admins',
            'role_breakdown',
            'school_fee_success', 'school_fee_pending', 'school_fee_failed',
            'school_fee_revenue',
            'portal_success', 'portal_pending', 'portal_failed',
            'portal_revenue', 'portal_paid_count', 'portal_pending_count',
            'total_revenue',
            'health_status', 'health_status_display', 'response_time_ms',
            'error_message', 'last_health_check',
            'db_size_mb', 'media_size_mb',
            'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for school model with metrics"""
    
    metrics = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = School
        fields = [
            'id', 'school_id', 'name', 'db_name', 'api_url', 'registration_prefix',
            'paystack_public_key', 'paystack_secret_key',
            'portal_fee_public_key', 'portal_fee_secret_key', 'portal_fee_amount',
            'contact_email', 'contact_phone', 'address',
            'is_active', 'is_archived', 'archived_at', 'archived_reason',
            'created_at', 'updated_at', 'last_sync_at',
            'metrics', 'status'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'archived_at']
    
    def get_metrics(self, obj):
        if hasattr(obj, 'metrics') and obj.metrics:
            return SchoolMetricSerializer(obj.metrics).data
        return {
            'total_users': 0,
            'total_students': 0,
            'total_staff': 0,
            'total_parents': 0,
            'total_revenue': 0,
        }
    
    def get_status(self, obj):
        if obj.is_archived:
            return 'archived'
        if obj.is_active:
            return 'active'
        return 'inactive'


class SchoolCreateSerializer(serializers.Serializer):
    """Serializer for creating a new school"""
    
    school_id = serializers.CharField(max_length=50, required=True)
    name = serializers.CharField(max_length=200, required=True)
    db_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    registration_prefix = serializers.CharField(
        max_length=10,
        required=False,
        default="EDU",
        help_text="Prefix for registration numbers (2-10 characters)"
    )
    api_url = serializers.CharField(max_length=200, default="http://localhost:8001")
    paystack_public_key = serializers.CharField(max_length=200, required=False, allow_blank=True)
    paystack_secret_key = serializers.CharField(max_length=200, required=False, allow_blank=True)
    portal_fee_public_key = serializers.CharField(max_length=200, required=False, allow_blank=True)
    portal_fee_secret_key = serializers.CharField(max_length=200, required=False, allow_blank=True)
    portal_fee_amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=1000)
    contact_email = serializers.EmailField(required=False, allow_blank=True)
    contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    
    def validate_registration_prefix(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Registration prefix must be at least 2 characters")
        if len(value) > 10:
            raise serializers.ValidationError("Registration prefix cannot exceed 10 characters")
        if not value.isalpha():
            raise serializers.ValidationError("Registration prefix must contain only letters")
        return value.upper()
    
    def validate_school_id(self, value):
        import re
        if not re.match(r'^[a-z][a-z0-9_]+$', value):
            raise serializers.ValidationError(
                "School ID must start with a letter and contain only lowercase letters, numbers, and underscores"
            )
        if School.objects.filter(school_id=value).exists():
            raise serializers.ValidationError(f"School with ID '{value}' already exists")
        return value
    
    def create(self, validated_data):
        if not validated_data.get('db_name'):
            validated_data['db_name'] = f"{validated_data['school_id']}_db"
        return School.objects.create(**validated_data)


class SchoolUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating school"""
    
    class Meta:
        model = School
        fields = [
            'name', 'api_url', 'registration_prefix',
            'paystack_public_key', 'paystack_secret_key',
            'portal_fee_public_key', 'portal_fee_secret_key', 'portal_fee_amount',
            'contact_email', 'contact_phone', 'address', 'is_active'
        ]


class SchoolArchiveSerializer(serializers.Serializer):
    """Serializer for archiving a school"""
    
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)