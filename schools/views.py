"""
School management views for owner panel
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import logging

from .models import School, SchoolMetric, ActivityLog
from .serializers import (
    SchoolSerializer, SchoolCreateSerializer, SchoolUpdateSerializer,
    SchoolMetricSerializer
)

logger = logging.getLogger(__name__)


class SchoolListView(generics.ListCreateAPIView):
    """List and create schools"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = School.objects.all()
        
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True, is_archived=False)
        elif status_filter == 'archived':
            queryset = queryset.filter(is_archived=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False, is_archived=False)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SchoolCreateSerializer
        return SchoolSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Include metrics for each school
        data = []
        for school, school_data in zip(queryset, serializer.data):
            if hasattr(school, 'metrics') and school.metrics:
                from .serializers import SchoolMetricSerializer
                school_data['metrics'] = SchoolMetricSerializer(school.metrics).data
            else:
                school_data['metrics'] = {
                    'total_users': 0,
                    'total_students': 0,
                    'total_staff': 0,
                    'total_revenue': 0,
                }
            data.append(school_data)
        
        return Response({
            'success': True,
            'count': len(data),
            'schools': data
        })
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        school = serializer.save()
        
        ActivityLog.objects.create(
            school=school,
            action='create',
            description=f"School '{school.name}' created",
            user=request.user.username,
        )
        
        # Get metrics
        result_data = SchoolSerializer(school).data
        if hasattr(school, 'metrics') and school.metrics:
            from .serializers import SchoolMetricSerializer
            result_data['metrics'] = SchoolMetricSerializer(school.metrics).data
        
        return Response({
            'success': True,
            'message': f"School '{school.name}' created",
            'school': result_data
        }, status=status.HTTP_201_CREATED)

class SchoolDetailView(APIView):
    """Get, update, delete school"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        school = get_object_or_404(School, pk=pk)
        serializer = SchoolSerializer(school)
        data = serializer.data
        
        if hasattr(school, 'metrics') and school.metrics:
            data['metrics'] = SchoolMetricSerializer(school.metrics).data
        
        return Response({'success': True, 'school': data})
    
    def put(self, request, pk):
        school = get_object_or_404(School, pk=pk)
        serializer = SchoolUpdateSerializer(school, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        ActivityLog.objects.create(
            school=school,
            action='update',
            description=f"School '{school.name}' updated",
            user=request.user.username,
        )
        
        return Response({'success': True, 'school': SchoolSerializer(school).data})
    
    def delete(self, request, pk):
        school = get_object_or_404(School, pk=pk)
        school.archive("Deleted via API")
        
        ActivityLog.objects.create(
            school=school,
            action='archive',
            description=f"School '{school.name}' archived",
            user=request.user.username,
        )
        
        return Response({'success': True, 'message': "School archived"})


class SchoolArchiveView(APIView):
    """Archive or restore a school"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        school = get_object_or_404(School, pk=pk)
        reason = request.data.get('reason', '')
        school.archive(reason)
        
        ActivityLog.objects.create(
            school=school,
            action='archive',
            description=f"School '{school.name}' archived. Reason: {reason}",
            user=request.user.username,
        )
        
        return Response({'success': True})
    
    def put(self, request, pk):
        school = get_object_or_404(School, pk=pk)
        school.restore()
        
        ActivityLog.objects.create(
            school=school,
            action='restore',
            description=f"School '{school.name}' restored",
            user=request.user.username,
        )
        
        return Response({'success': True})


class SchoolSyncView(APIView):
    """Sync school metrics"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        # Import sync_utils inside function to avoid circular imports
        from .sync_utils import sync_school_metrics
        
        school = get_object_or_404(School, pk=pk)
        success = sync_school_metrics(school)
        school.refresh_from_db()
        
        if hasattr(school, 'metrics'):
            school.metrics.refresh_from_db()
        
        ActivityLog.objects.create(
            school=school,
            action='sync',
            description=f"Manual sync for '{school.name}'",
            user=request.user.username,
        )
        
        serializer = SchoolSerializer(school)
        data = serializer.data
        if hasattr(school, 'metrics') and school.metrics:
            data['metrics'] = SchoolMetricSerializer(school.metrics).data
        
        return Response({
            'success': success,
            'message': 'Synced successfully' if success else 'Sync failed',
            'school': data
        })


class SchoolStatsAllView(APIView):
    """Get stats for all schools"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import School
        
        print("=" * 50)
        print("SchoolStatsAllView - GET request received")
        print(f"User: {request.user}")
        print("=" * 50)
        
        schools = School.objects.filter(is_active=True, is_archived=False)
        
        total_users = 0
        total_students = 0
        total_staff = 0
        total_parents = 0
        total_revenue = 0
        
        school_list = []
        
        for school in schools:
            if hasattr(school, 'metrics') and school.metrics:
                m = school.metrics
                total_users += m.total_users or 0
                total_students += m.total_students or 0
                total_staff += m.total_staff or 0
                total_parents += m.total_parents or 0
                total_revenue += float(m.total_revenue or 0)
                
                school_list.append({
                    'id': school.id,
                    'name': school.name,
                    'school_id': school.school_id,
                    'metrics': {
                        'total_users': m.total_users or 0,
                        'total_students': m.total_students or 0,
                        'total_staff': m.total_staff or 0,
                        'total_revenue': float(m.total_revenue or 0),
                    }
                })
            else:
                school_list.append({
                    'id': school.id,
                    'name': school.name,
                    'school_id': school.school_id,
                    'metrics': {
                        'total_users': 0,
                        'total_students': 0,
                        'total_staff': 0,
                        'total_revenue': 0,
                    }
                })
        
        return Response({
            'success': True,
            'summary': {
                'total_schools': schools.count(),
                'total_users': total_users,
                'total_students': total_students,
                'total_staff': total_staff,
                'total_parents': total_parents,
                'total_revenue': float(total_revenue),
            },
            'schools': school_list
        })