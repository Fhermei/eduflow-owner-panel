from django.db import models
from django.utils import timezone
import uuid


class School(models.Model):
    school_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    db_name = models.CharField(max_length=100)
    api_url = models.CharField(max_length=200, default="http://localhost:8001")
    
    # ========== ADD THIS FIELD ==========
    registration_prefix = models.CharField(
        max_length=10,
        default="EDU",
        help_text="Prefix for registration numbers (e.g., EDU, PRIME, GF). Min 2 characters, max 10."
    )
    # ====================================
    
    paystack_public_key = models.CharField(max_length=200, blank=True)
    paystack_secret_key = models.CharField(max_length=200, blank=True)
    
    portal_fee_public_key = models.CharField(max_length=200, blank=True)
    portal_fee_secret_key = models.CharField(max_length=200, blank=True)
    portal_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=1000)
    
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)

class SchoolMetric(models.Model):
    """Cached metrics for each school"""
    
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='metrics')
    
    # User counts
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)
    active_students = models.IntegerField(default=0)
    total_staff = models.IntegerField(default=0)
    active_staff = models.IntegerField(default=0)
    total_parents = models.IntegerField(default=0)
    total_admins = models.IntegerField(default=0)
    
    # Role breakdown
    role_breakdown = models.JSONField(default=dict, blank=True)
    
    # School Fee Metrics
    school_fee_success = models.IntegerField(default=0)
    school_fee_pending = models.IntegerField(default=0)
    school_fee_failed = models.IntegerField(default=0)
    school_fee_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Portal Fee Metrics
    portal_success = models.IntegerField(default=0)
    portal_pending = models.IntegerField(default=0)
    portal_failed = models.IntegerField(default=0)
    portal_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    portal_paid_count = models.IntegerField(default=0)
    portal_pending_count = models.IntegerField(default=0)
    
    # Total revenue
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Health metrics
    last_health_check = models.DateTimeField(null=True, blank=True)
    health_status = models.CharField(max_length=20, default='unknown', choices=[
        ('healthy', 'Healthy'),
        ('unhealthy', 'Unhealthy'),
        ('down', 'Down'),
        ('unknown', 'Unknown'),
    ])
    response_time_ms = models.FloatField(default=0)
    error_message = models.TextField(blank=True)
    
    # Storage metrics
    db_size_mb = models.FloatField(default=0)
    media_size_mb = models.FloatField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Metrics for {self.school.name}"


# Add this to owner_panel/schools/models.py

# Replace your ActivityLog, LoginAttempt, and UserSession models with these:

class ActivityLog(models.Model):
    """Store activity logs from all schools in owner panel's database"""
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='activity_logs', null=True, blank=True)
    # Remove school_id - use school.school_id instead
    action = models.CharField(max_length=100, db_index=True)
    description = models.TextField(blank=True)
    user = models.CharField(max_length=100, blank=True)
    user_registration_number = models.CharField(max_length=50, blank=True, db_index=True)
    user_role = models.CharField(max_length=50, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['user_registration_number', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.created_at}"


class LoginAttempt(models.Model):
    """Store login attempts from all schools in owner panel's database"""
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='login_attempts', null=True, blank=True)
    # Remove school_id - use school.school_id instead
    registration_number = models.CharField(max_length=50, db_index=True)
    user_name = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    was_successful = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=200, blank=True)
    attempted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['registration_number', '-attempted_at']),
            models.Index(fields=['ip_address', '-attempted_at']),
            models.Index(fields=['attempted_at']),
        ]
    
    def __str__(self):
        return f"{self.registration_number} - {'Success' if self.was_successful else 'Failed'}"


class UserSession(models.Model):
    """Store user sessions from all schools in owner panel's database"""
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    # Remove school_id - use school.school_id instead
    user_id = models.IntegerField()
    registration_number = models.CharField(max_length=50, db_index=True)
    user_name = models.CharField(max_length=200, blank=True)
    user_role = models.CharField(max_length=50, blank=True)
    session_key = models.CharField(max_length=255, unique=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True, db_index=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    
    class Meta:
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['registration_number', 'is_active']),
            models.Index(fields=['last_activity']),
        ]
    
    def __str__(self):
        return f"{self.user_name} - {'Active' if self.is_active else 'Inactive'}"
    
class DailyAnalytics(models.Model):
    """Daily aggregated analytics"""
    
    date = models.DateField(unique=True)
    
    # System-wide
    total_schools = models.IntegerField(default=0)
    total_users = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    portal_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Activity
    total_logins = models.IntegerField(default=0)
    active_schools = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"Analytics for {self.date}"