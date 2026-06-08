# from django.urls import path
# from . import views

# app_name = 'schools'

# urlpatterns = [
#     # School CRUD
#     path('', views.SchoolListView.as_view(), name='school-list'),
#     path('<int:pk>/', views.SchoolDetailView.as_view(), name='school-detail'),
#     path('<int:pk>/archive/', views.SchoolArchiveView.as_view(), name='school-archive'),
#     path('<int:pk>/sync/', views.SchoolSyncView.as_view(), name='school-sync'),
#     path('stats/all/', views.SchoolStatsAllView.as_view(), name='school-stats-all'),
#     path('sync-all/', views.SyncAllSchoolsView.as_view(), name='sync-all-schools'),

#     # Admin management
#     path('<int:school_id>/admins/', views.SchoolAdminUsersView.as_view(), name='school-admins'),
#     path('<int:school_id>/admins/add/', views.AddSchoolAdminView.as_view(), name='add-school-admin'),
#     path('<int:school_id>/admins/<int:user_id>/disable/', views.DisableSchoolAdminView.as_view(), name='disable-school-admin'),
#     path('<int:school_id>/admins/<int:user_id>/restore/', views.RestoreSchoolAdminView.as_view(), name='restore-school-admin'),
#     path("<str:school_id>/populate-academic/",
#                 views.PopulateSchoolAcademicDataView.as_view(),
#                 name="populate-school-academic",
#             ),
# ]

from django.urls import path
from . import views

app_name = 'schools'

urlpatterns = [
    path('', views.SchoolListView.as_view(), name='school-list'),
    path('<int:pk>/', views.SchoolDetailView.as_view(), name='school-detail'),
    path('<int:pk>/archive/', views.SchoolArchiveView.as_view(), name='school-archive'),
    path('<int:pk>/sync/', views.SchoolSyncView.as_view(), name='school-sync'),
    path('stats/all/', views.SchoolStatsAllView.as_view(), name='school-stats-all'),
    path('sync-all/', views.SyncAllSchoolsView.as_view(), name='sync-all-schools'),

    path('<int:school_id>/admins/', views.SchoolAdminUsersView.as_view(), name='school-admins'),
    path('<int:school_id>/admins/add/', views.AddSchoolAdminView.as_view(), name='add-school-admin'),
    path('<int:school_id>/admins/<int:user_id>/disable/', views.DisableSchoolAdminView.as_view(), name='disable-school-admin'),
    path('<int:school_id>/admins/<int:user_id>/restore/', views.RestoreSchoolAdminView.as_view(), name='restore-school-admin'),
    
    path("<str:school_id>/populate-academic/", views.PopulateSchoolAcademicDataView.as_view(), name="populate-school-academic"),
    path('api/proxy/school/<str:school_id>/<path:endpoint>/', views.ProxySchoolActivityView.as_view(), name='proxy-school'),
]