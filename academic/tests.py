# owner_panel/academic/urls.py
from django.urls import path
from .views import AcademicSessionsView, AcademicTermsView

urlpatterns = [
    path('sessions/', AcademicSessionsView.as_view(), name='academic-sessions'),
    path('terms/', AcademicTermsView.as_view(), name='academic-terms'),
]