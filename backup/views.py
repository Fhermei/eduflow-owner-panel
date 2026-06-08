"""
owner_panel/backup/views.py - Backup API endpoints for owner panel
"""

import logging
import os

from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from backup.models import BackupRecord, BackupSchedule
from backup.serializers import (
    BackupRecordSerializer,
    BackupScheduleSerializer,
    InitiateBackupSerializer,
)
from backup.service import SchoolBackupService
from backup.permissions import IsSuperAdmin

from schools.models import School

logger = logging.getLogger(__name__)


class InitiateBackupView(APIView):
    """POST /api/backup/initiate/ - Start backup for a school"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        serializer = InitiateBackupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        school_id = serializer.validated_data['school_id']
        recipient_email = serializer.validated_data.get('recipient_email', '')

        # Verify school exists
        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            return Response(
                {'error': f"School '{school_id}' not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not recipient_email:
            recipient_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')

        # Create pending record
        record = BackupRecord.objects.create(
            school_id=school_id,
            school_name=school.name,
            initiated_by=request.user.username,
            status='pending',
            recipient_email=recipient_email,
            trigger='manual',
        )

        # Run backup in background (simplified - use threading for now)
        import threading
        def run_backup():
            SchoolBackupService.run(
                school_id=school_id,
                initiated_by=request.user.username,
                recipient_email=recipient_email,
            )
        
        thread = threading.Thread(target=run_backup, daemon=True)
        thread.start()

        return Response(
            {
                'message': f"Backup initiated for '{school.name}'. You will receive an email at '{recipient_email}' when complete.",
                'record': BackupRecordSerializer(record).data,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class BackupRecordListView(generics.ListAPIView):
    """GET /api/backup/records/ - List all backup records"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = BackupRecordSerializer

    def get_queryset(self):
        qs = BackupRecord.objects.all()
        school_id = self.request.query_params.get('school_id')
        if school_id:
            qs = qs.filter(school_id=school_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by('-started_at')


class BackupRecordDetailView(generics.RetrieveDestroyAPIView):
    """GET / DELETE /api/backup/records/<id>/"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = BackupRecordSerializer
    queryset = BackupRecord.objects.all()

    def perform_destroy(self, instance):
        if instance.zip_filename:
            zip_path = os.path.join(settings.MEDIA_ROOT, 'backups', instance.zip_filename)
            if os.path.exists(zip_path):
                os.remove(zip_path)
        instance.delete()


class BackupDownloadView(APIView):
    """GET /api/backup/records/<id>/download/"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, pk):
        try:
            record = BackupRecord.objects.get(pk=pk)
        except BackupRecord.DoesNotExist:
            raise Http404

        if not record.zip_filename:
            return Response(
                {'error': 'No file available for this backup record.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        zip_path = os.path.join(settings.MEDIA_ROOT, 'backups', record.zip_filename)
        if not os.path.exists(zip_path):
            return Response(
                {'error': 'Backup file not found on disk.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        response = FileResponse(open(zip_path, 'rb'), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{record.zip_filename}"'
        return response


class RegisteredSchoolsView(APIView):
    """GET /api/backup/schools/ - List all registered schools"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        schools = School.objects.filter(is_active=True, is_archived=False)
        data = [
            {'school_id': s.school_id, 'name': s.name}
            for s in schools
        ]
        return Response({'schools': data})


# In owner_panel/backup/views.py - Fix the schedule create view

class BackupScheduleListCreateView(generics.ListCreateAPIView):
    """GET / POST /api/backup/schedules/"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = BackupScheduleSerializer
    queryset = BackupSchedule.objects.all()

    def create(self, request, *args, **kwargs):
        """Override create to handle school name lookup"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        school_id = serializer.validated_data.get('school_id')
        
        # Get school name from database
        try:
            from schools.models import School
            school = School.objects.get(school_id=school_id)
            school_name = school.name
        except School.DoesNotExist:
            school_name = school_id
        
        # Save with school_name
        self.perform_create(serializer, school_name)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer, school_name):
        serializer.save(school_name=school_name)


class BackupScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/backup/schedules/<id>/"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = BackupScheduleSerializer
    queryset = BackupSchedule.objects.all()


class BackupStatsView(APIView):
    """GET /api/backup/stats/ - Get backup statistics"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from django.db.models import Sum, Count
        
        qs = BackupRecord.objects.all()
        
        stats = {
            'total_backups': qs.count(),
            'completed_backups': qs.filter(status__in=['completed', 'emailed']).count(),
            'failed_backups': qs.filter(status='failed').count(),
            'running_backups': qs.filter(status='running').count(),
            'total_size_bytes': qs.aggregate(s=Sum('file_size_bytes'))['s'] or 0,
            'by_school': list(
                qs.values('school_id', 'school_name')
                  .annotate(count=Count('id'))
                  .order_by('school_id')
            ),
        }
        stats['total_size_mb'] = round(stats['total_size_bytes'] / (1024 * 1024), 2)
        return Response(stats)