from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from . import views

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Owner panel is running'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health'),
    
    path('api/schools/login/', views.OwnerLoginView.as_view(), name='owner-login'),
    path('api/schools/logout/', views.OwnerLogoutView.as_view(), name='owner-logout'),
    
    path('api/owner/comprehensive-dashboard/', views.OwnerComprehensiveDashboardView.as_view(), name='owner-comprehensive-dashboard'),
    path('api/owner/per-school-activity/<int:school_id>/', views.OwnerPerSchoolActivityView.as_view(), name='owner-per-school-activity'),
    path('api/owner/force-logout-school/<int:school_id>/', views.OwnerForceLogoutSchoolView.as_view(), name='owner-force-logout-school'),
    path('api/owner/manage-school-user/', views.OwnerManageSchoolUserView.as_view(), name='owner-manage-school-user'),
    path('api/owner/all-failed-logins/', views.OwnerAllFailedLoginsView.as_view(), name='owner-all-failed-logins'),
    path('api/owner/unlock-user-in-school/', views.OwnerUnlockUserInSchoolView.as_view(), name='owner-unlock-user-in-school'),
    path('api/owner/unlock-user-all-schools/', views.OwnerUnlockUserAllSchoolsView.as_view(), name='owner-unlock-user-all-schools'),
    path('api/owner/all-users/', views.OwnerAllUsersView.as_view(), name='owner-all-users'),
    
    path('api/schools/', include('schools.urls')),
    path('api/backup/', include('backup.urls')),
    path('api/portal-fee/', include('portal_fee.urls')),
    path('api/academic/', include('academic.urls')),
    
    # ============================================
    # PROXY ENDPOINTS FOR SCHOOL DATA
    # These proxy requests to the individual school backends
    # ============================================
    
    # School stats endpoint
    path('api/schools/stats/all/', views.SchoolStatsAllView.as_view(), name='school-stats-all'),
    
    # Proxy endpoints for admin functionality
    path('api/proxy/school/<str:school_id>/admin/online-status/', views.ProxyAdminView.as_view(), name='proxy-online-status'),
    path('api/proxy/school/<str:school_id>/admin/login-analytics/', views.ProxyAdminView.as_view(), name='proxy-login-analytics'),
    path('api/proxy/school/<str:school_id>/admin/activity-log/', views.ProxyAdminView.as_view(), name='proxy-activity-log'),
    path('api/proxy/school/<str:school_id>/admin/lock-user/<str:registration_number>/', views.ProxyAdminView.as_view(), name='proxy-lock-user'),
    path('api/proxy/school/<str:school_id>/admin/unlock-user/<str:registration_number>/', views.ProxyAdminView.as_view(), name='proxy-unlock-user'),
    path('api/proxy/school/<str:school_id>/admin/force-logout-all/', views.ProxyAdminView.as_view(), name='proxy-force-logout-all'),
    path('api/proxy/school/<str:school_id>/admin/force-logout-user/<str:registration_number>/', views.ProxyAdminView.as_view(), name='proxy-force-logout-user'),
    
    path('api/owner/activity/online-status/', views.OwnerAggregatedOnlineStatusView.as_view(), name='owner-online-status'),
    path('api/owner/activity/login-analytics/', views.OwnerAggregatedLoginAnalyticsView.as_view(), name='owner-login-analytics'),
    path('api/owner/activity/activity-log/', views.OwnerAggregatedActivityLogView.as_view(), name='owner-activity-log'),
    path('api/owner/activity/lock-user/', views.OwnerLockUserView.as_view(), name='owner-lock-user'),
    path('api/owner/activity/unlock-user/', views.OwnerUnlockUserView.as_view(), name='owner-unlock-user'),
    path('api/owner/activity/force-logout-all/', views.OwnerForceLogoutAllView.as_view(), name='owner-force-logout-all'),
    path('api/owner/activity/force-logout-user/', views.OwnerForceLogoutUserView.as_view(), name='owner-force-logout-user'),
    path('api/owner/sync-activity/', views.OwnerSyncActivityView.as_view(), name='owner-sync-activity'),
    path('api/owner/sync-all-activities/', views.OwnerSyncAllActivitiesView.as_view(), name='owner-sync-all-activities'),
    path('api/owner/sync-activity-webhook/', views.OwnerSyncActivityWebhookView.as_view(), name='sync-activity-webhook'),
    ]