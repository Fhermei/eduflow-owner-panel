"""
owner_panel/backup/urls.py
"""

from django.urls import path
from backup.views import (
    BackupDownloadView,
    BackupRecordDetailView,
    BackupRecordListView,
    BackupScheduleDetailView,
    BackupScheduleListCreateView,
    BackupStatsView,
    InitiateBackupView,
    RegisteredSchoolsView,
)

app_name = 'backup'

urlpatterns = [
    path('initiate/', InitiateBackupView.as_view(), name='initiate'),
    path('stats/', BackupStatsView.as_view(), name='stats'),
    path('schools/', RegisteredSchoolsView.as_view(), name='schools'),
    path('records/', BackupRecordListView.as_view(), name='record-list'),
    path('records/<int:pk>/', BackupRecordDetailView.as_view(), name='record-detail'),
    path('records/<int:pk>/download/', BackupDownloadView.as_view(), name='record-download'),
    path('schedules/', BackupScheduleListCreateView.as_view(), name='schedule-list'),
    path('schedules/<int:pk>/', BackupScheduleDetailView.as_view(), name='schedule-detail'),
]