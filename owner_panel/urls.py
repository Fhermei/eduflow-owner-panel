# from django.contrib import admin
# from django.urls import path, include
# from django.http import JsonResponse

# from . import views

# # Simple health check
# def health_check(request):
#     return JsonResponse({'status': 'ok', 'message': 'Owner panel is running'})

# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('health/', health_check, name='health'),
    
#     # Owner Auth endpoints
#     path('api/schools/login/', views.OwnerLoginView.as_view(), name='owner-login'),
#     path('api/schools/logout/', views.OwnerLogoutView.as_view(), name='owner-logout'),
    
#     # Owner Dashboard API endpoints
#     path('api/owner/comprehensive-dashboard/', views.OwnerComprehensiveDashboardView.as_view(), name='owner-comprehensive-dashboard'),
#     path('api/owner/per-school-activity/<int:school_id>/', views.OwnerPerSchoolActivityView.as_view(), name='owner-per-school-activity'),
#     path('api/owner/force-logout-school/<int:school_id>/', views.OwnerForceLogoutSchoolView.as_view(), name='owner-force-logout-school'),
#     path('api/owner/manage-school-user/', views.OwnerManageSchoolUserView.as_view(), name='owner-manage-school-user'),
#     path('api/owner/all-failed-logins/', views.OwnerAllFailedLoginsView.as_view(), name='owner-all-failed-logins'),
#     path('api/owner/unlock-user-in-school/', views.OwnerUnlockUserInSchoolView.as_view(), name='owner-unlock-user-in-school'),
#     path('api/owner/unlock-user-all-schools/', views.OwnerUnlockUserAllSchoolsView.as_view(), name='owner-unlock-user-all-schools'),
#     path('api/owner/all-users/', views.OwnerAllUsersView.as_view(), name='owner-all-users'), 
#     path('api/owner/unlock-user-in-school/', views.OwnerUnlockUserInSchoolView.as_view(), name='owner-unlock-user-in-school'),
#     # Schools app endpoints
#     path('api/schools/', include('schools.urls')),
#     path('api/backup/', include('backup.urls')),
    
#     path('api/portal-fee/', include('portal_fee.urls')),
#     path('api/academic/', include('academic.urls')),
# ]


from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from . import views

# Simple health check
def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Owner panel is running'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health'),
    
    # Owner Auth endpoints
    path('api/schools/login/', views.OwnerLoginView.as_view(), name='owner-login'),
    path('api/schools/logout/', views.OwnerLogoutView.as_view(), name='owner-logout'),
    
    # Owner Dashboard API endpoints
    path('api/owner/comprehensive-dashboard/', views.OwnerComprehensiveDashboardView.as_view(), name='owner-comprehensive-dashboard'),
    path('api/owner/per-school-activity/<int:school_id>/', views.OwnerPerSchoolActivityView.as_view(), name='owner-per-school-activity'),
    path('api/owner/force-logout-school/<int:school_id>/', views.OwnerForceLogoutSchoolView.as_view(), name='owner-force-logout-school'),
    path('api/owner/manage-school-user/', views.OwnerManageSchoolUserView.as_view(), name='owner-manage-school-user'),
    path('api/owner/all-failed-logins/', views.OwnerAllFailedLoginsView.as_view(), name='owner-all-failed-logins'),
    path('api/owner/unlock-user-in-school/', views.OwnerUnlockUserInSchoolView.as_view(), name='owner-unlock-user-in-school'),
    path('api/owner/unlock-user-all-schools/', views.OwnerUnlockUserAllSchoolsView.as_view(), name='owner-unlock-user-all-schools'),
    path('api/owner/all-users/', views.OwnerAllUsersView.as_view(), name='owner-all-users'),
    
    # Schools app endpoints
    path('api/schools/', include('schools.urls')),
    path('api/backup/', include('backup.urls')),
    path('api/portal-fee/', include('portal_fee.urls')),
    path('api/academic/', include('academic.urls')),
    
    # ============================================
    # OWNER ACTIVITY DASHBOARD ENDPOINTS
    # ============================================
    # These endpoints aggregate data from all schools
    path('api/owner/activity/all-schools/', views.OwnerActivityAllSchoolsView.as_view(), name='owner-activity-all-schools'),
    path('api/owner/activity/statistics/', views.OwnerActivityStatisticsView.as_view(), name='owner-activity-statistics'),
    
    # Proxy endpoint for individual school activity (goes through school's own backend)
    path('api/proxy/school/<str:school_id>/owner/activity/<str:endpoint>/', views.ProxySchoolActivityView.as_view(), name='proxy-school-activity'),
    path('api/proxy/school/<str:school_id>/owner/activity/<str:endpoint>/', views.OwnerActivityProxyView.as_view(), name='proxy-owner-activity'),
]