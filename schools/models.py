from django.db import models
from django.utils import timezone


class School(models.Model):
    """Registry of all schools in the system"""
    
    school_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    db_name = models.CharField(max_length=100)
    api_url = models.CharField(max_length=200, default="http://localhost:8001")
    
    # Paystack Configuration (School Fees)
    paystack_public_key = models.CharField(max_length=200, blank=True)
    paystack_secret_key = models.CharField(max_length=200, blank=True)
    
    # Portal Fee Configuration
    portal_fee_public_key = models.CharField(max_length=200, blank=True)
    portal_fee_secret_key = models.CharField(max_length=200, blank=True)
    portal_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=1000)
    
    # Contact Information
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    archived_reason = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.school_id})"
    
    def archive(self, reason=""):
        self.is_archived = True
        self.is_active = False
        self.archived_at = timezone.now()
        self.archived_reason = reason
        self.save()
    
    def restore(self):
        self.is_archived = False
        self.is_active = True
        self.archived_at = None
        self.archived_reason = ""
        self.save()


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


class ActivityLog(models.Model):
    """Log of system activities"""
    
    ACTION_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('archive', 'Archive'),
        ('restore', 'Restore'),
        ('sync', 'Sync'),
    ]
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField()
    user = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} - {self.created_at}"


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