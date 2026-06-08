# owner_panel/academic/urls.py
from django.urls import path
from .views import AcademicSessionsProxyView, AcademicTermsProxyView

urlpatterns = [
    path('sessions/', AcademicSessionsProxyView.as_view()),
    path('terms/', AcademicTermsProxyView.as_view()),
]