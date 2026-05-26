from django.urls import path
from . import views

urlpatterns = [
    # School CRUD
    path('', views.SchoolListView.as_view(), name='school-list'),
    path('<int:pk>/', views.SchoolDetailView.as_view(), name='school-detail'),
    path('<int:pk>/archive/', views.SchoolArchiveView.as_view(), name='school-archive'),
    path('<int:pk>/sync/', views.SchoolSyncView.as_view(), name='school-sync'),
    path('stats/all/', views.SchoolStatsAllView.as_view(), name='school-stats-all'),  # Make sure this line exists
]