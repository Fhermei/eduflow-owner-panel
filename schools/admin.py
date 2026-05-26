from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import School, SchoolMetric, ActivityLog, DailyAnalytics


class SchoolMetricInline(admin.StackedInline):
    """Inline for school metrics"""
    model = SchoolMetric
    can_delete = False
    verbose_name_plural = "School Metrics"
    fields = [
        'total_users', 'active_users', 'total_students', 'active_students',
        'total_staff', 'total_parents', 'total_admins',
        'school_fee_revenue', 'portal_revenue', 'total_revenue',
        'health_status', 'response_time_ms', 'last_health_check'
    ]
    # Use a list of strings for readonly_fields - each must be a field name
    readonly_fields = [
        'total_users', 'active_users', 'total_students', 'active_students',
        'total_staff', 'total_parents', 'total_admins',
        'school_fee_revenue', 'portal_revenue', 'total_revenue',
        'health_status', 'response_time_ms', 'last_health_check'
    ]


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = [
        'school_id', 'name', 'is_active', 'is_archived', 'get_health_status', 
        'get_total_users', 'get_total_revenue', 'created_at'
    ]
    list_filter = ['is_active', 'is_archived', 'created_at']
    search_fields = ['school_id', 'name', 'contact_email', 'contact_phone']
    readonly_fields = ['created_at', 'updated_at', 'last_sync_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school_id', 'name', 'db_name', 'api_url', 'is_active', 'is_archived')
        }),
        ('Paystack Configuration (School Fees)', {
            'fields': ('paystack_public_key', 'paystack_secret_key'),
            'classes': ('collapse',)
        }),
        ('Portal Fee Configuration', {
            'fields': ('portal_fee_public_key', 'portal_fee_secret_key', 'portal_fee_amount'),
            'classes': ('collapse',)
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone', 'address'),
            'classes': ('collapse',)
        }),
        ('Archival', {
            'fields': ('archived_at', 'archived_reason'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'last_sync_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [SchoolMetricInline]
    actions = ['archive_selected', 'restore_selected', 'sync_metrics']
    
    def get_health_status(self, obj):
        if hasattr(obj, 'metrics') and obj.metrics:
            status = obj.metrics.health_status
            colors = {
                'healthy': '#10b981',
                'unhealthy': '#f59e0b',
                'down': '#ef4444',
                'unknown': '#6b7280'
            }
            return format_html(
                '<span style="color: {}; font-weight: bold;">{}</span>',
                colors.get(status, '#6b7280'),
                status.upper()
            )
        return 'Unknown'
    get_health_status.short_description = 'Health'
    
    def get_total_users(self, obj):
        if hasattr(obj, 'metrics') and obj.metrics:
            return obj.metrics.total_users
        return 'N/A'
    get_total_users.short_description = 'Total Users'
    
    def get_total_revenue(self, obj):
        if hasattr(obj, 'metrics') and obj.metrics:
            return f"₦{obj.metrics.total_revenue:,.2f}"
        return 'N/A'
    get_total_revenue.short_description = 'Total Revenue'
    
    def archive_selected(self, request, queryset):
        for school in queryset:
            school.archive("Archived via admin")
        self.message_user(request, f"{queryset.count()} school(s) archived.")
    archive_selected.short_description = "Archive selected schools"
    
    def restore_selected(self, request, queryset):
        for school in queryset:
            school.restore()
        self.message_user(request, f"{queryset.count()} school(s) restored.")
    restore_selected.short_description = "Restore selected schools"
    
    def sync_metrics(self, request, queryset):
        from .views import sync_school_metrics
        for school in queryset:
            sync_school_metrics(school)
        self.message_user(request, f"Metrics synced for {queryset.count()} school(s).")
    sync_metrics.short_description = "Sync metrics for selected schools"


@admin.register(SchoolMetric)
class SchoolMetricAdmin(admin.ModelAdmin):
    list_display = ['school', 'total_users', 'total_students', 'total_revenue', 'health_status', 'updated_at']
    list_filter = ['health_status', 'updated_at']
    readonly_fields = [f.name for f in SchoolMetric._meta.fields if f.name not in ['id', 'school']]
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'school', 'action', 'user', 'description']
    list_filter = ['action', 'created_at', 'school']
    search_fields = ['description', 'user']
    readonly_fields = [f.name for f in ActivityLog._meta.fields]
    
    def has_add_permission(self, request):
        return False


@admin.register(DailyAnalytics)
class DailyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_schools', 'total_users', 'total_revenue', 'total_logins']
    list_filter = ['date']
    readonly_fields = [f.name for f in DailyAnalytics._meta.fields]
    
    def has_add_permission(self, request):
        return False