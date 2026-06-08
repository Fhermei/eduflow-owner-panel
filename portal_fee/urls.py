# owner_panel/portal_fee/urls.py
from django.urls import path
from . import views

app_name = 'portal_fee'

urlpatterns = [
    path('overview/', views.OwnerPortalFeeOverviewView.as_view(), name='overview'),
    path('analytics/global/', views.OwnerPortalFeeGlobalAnalyticsView.as_view(), name='global-analytics'),
    path('bulk-generate/', views.OwnerPortalFeeBulkGenerateView.as_view(), name='bulk-generate'),
    path('school/<int:school_id>/summary/', views.OwnerPortalFeeSchoolSummaryView.as_view(), name='school-summary'),
    path('school/<int:school_id>/sessions-terms/', views.OwnerPortalFeeSessionsTermsView.as_view(), name='sessions-terms'),
    path('school/<int:school_id>/invoices/', views.OwnerPortalFeeInvoicesView.as_view(), name='invoices'),
    path('school/<int:school_id>/payments/', views.OwnerPortalFeePaymentsView.as_view(), name='payments'),
    path('school/<int:school_id>/access/', views.OwnerPortalFeeAccessView.as_view(), name='access'),
    path('school/<int:school_id>/analytics/', views.OwnerPortalFeeAnalyticsView.as_view(), name='analytics'),
    path('school/<int:school_id>/settings/', views.OwnerPortalFeeSettingsView.as_view(), name='settings'),
]