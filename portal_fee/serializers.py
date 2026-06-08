# owner_panel/portal_fee/serializers.py
from rest_framework import serializers
from .models import PortalFeeOwnerSettings, PortalFeeSchoolConfig
from schools.models import School


class PortalFeeOwnerSettingsSerializer(serializers.ModelSerializer):
    """Serializer for global portal fee settings"""
    
    class Meta:
        model = PortalFeeOwnerSettings
        fields = [
            'id', 'default_fee_amount', 'is_enabled', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class PortalFeeSchoolConfigSerializer(serializers.ModelSerializer):
    """Serializer for per-school portal fee configuration"""
    
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_id = serializers.CharField(source='school.school_id', read_only=True)
    
    class Meta:
        model = PortalFeeSchoolConfig
        fields = [
            'id', 'school', 'school_name', 'school_id',
            'fee_amount', 'is_active', 'custom_message', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class PortalFeeSchoolConfigCreateSerializer(serializers.Serializer):
    """Serializer for creating/updating school config"""
    
    school_id = serializers.IntegerField(required=True)
    fee_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=1000)
    is_active = serializers.BooleanField(required=False, default=True)
    custom_message = serializers.CharField(required=False, allow_blank=True)
    
    def validate_school_id(self, value):
        try:
            school = School.objects.get(id=value)
            return school
        except School.DoesNotExist:
            raise serializers.ValidationError(f"School with id {value} not found")
    
    def create(self, validated_data):
        school = validated_data['school_id']
        config, created = PortalFeeSchoolConfig.objects.update_or_create(
            school=school,
            defaults={
                'fee_amount': validated_data.get('fee_amount', 1000),
                'is_active': validated_data.get('is_active', True),
                'custom_message': validated_data.get('custom_message', ''),
            }
        )
        return config


class PortalFeeInvoiceSerializer(serializers.Serializer):
    """Serializer for portal fee invoices (read-only from school backend)"""
    
    id = serializers.IntegerField()
    invoice_number = serializers.CharField()
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    admission_number = serializers.CharField()
    class_level = serializers.CharField()
    session_name = serializers.CharField()
    term_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    issue_date = serializers.DateField()
    due_date = serializers.DateField()
    paid_date = serializers.DateField(allow_null=True)
    created_at = serializers.DateTimeField()


class PortalFeePaymentSerializer(serializers.Serializer):
    """Serializer for portal fee payments (read-only from school backend)"""
    
    id = serializers.IntegerField()
    reference = serializers.CharField()
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    admission_number = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField()
    status = serializers.CharField()
    transaction_date = serializers.DateTimeField()
    verified_by = serializers.CharField(allow_null=True)
    verified_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()


class PortalFeeStatsSerializer(serializers.Serializer):
    """Serializer for portal fee statistics"""
    
    total_students = serializers.IntegerField()
    paid_count = serializers.IntegerField()
    pending_count = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    collection_rate = serializers.FloatField()


class PortalFeeSchoolStatsSerializer(serializers.Serializer):
    """Serializer for per-school portal fee statistics"""
    
    school_id = serializers.CharField()
    school_name = serializers.CharField()
    stats = PortalFeeStatsSerializer()
    config = serializers.DictField()