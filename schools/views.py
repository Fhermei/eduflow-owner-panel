"""
School management views for owner panel
"""
import requests
import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from datetime import timedelta   # ← ADD THIS, was missing
from decimal import Decimal

from .models import School, SchoolMetric, ActivityLog
from .serializers import (
    SchoolSerializer, SchoolCreateSerializer, SchoolUpdateSerializer,
    SchoolMetricSerializer
)

logger = logging.getLogger(__name__)


class SchoolListView(generics.ListCreateAPIView):
    """List and create schools - FIXED to show ALL schools"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Remove any filtering that might hide schools - get ALL schools
        queryset = School.objects.all()
        
        # Optional filters (only if provided)
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
        
        # Return ALL schools ordered by creation date
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SchoolCreateSerializer
        return SchoolSerializer
    
    def list(self, request, *args, **kwargs):
        import traceback
        try:
            queryset = self.get_queryset()
            print(f"[DEBUG] queryset count: {queryset.count()}")
            serializer = self.get_serializer(queryset, many=True)
            print(f"[DEBUG] serializer done")
            serializer_data = serializer.data
            print(f"[DEBUG] serializer.data done, count: {len(serializer_data)}")
            data = []
            for school, school_data in zip(queryset, serializer_data):
                row = dict(school_data)
                if hasattr(school, 'metrics') and school.metrics:
                    row['metrics'] = SchoolMetricSerializer(school.metrics).data
                else:
                    row['metrics'] = {'total_users': 0, 'total_students': 0, 'total_staff': 0, 'total_revenue': 0}
                data.append(row)
            return Response({'success': True, 'count': len(data), 'schools': data})
        except Exception as e:
            tb = traceback.format_exc()
            print("=== SCHOOLS LIST ERROR ===")
            print(tb)
            print("=========================")
            return Response({'error': str(e), 'detail': tb}, status=500)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        school_data = serializer.validated_data
        admin_data = request.data.get('admin_user', {})
        
        with transaction.atomic():
            # Create school
            school = School.objects.create(**school_data)
            
            # Create admin user for this school
            if admin_data:
                self._create_school_admin(school, admin_data, request.user.username)
            
            ActivityLog.objects.create(
                school=school,
                action='create',
                description=f"School '{school.name}' created",
                user=request.user.username,
            )
        
        # Get metrics
        result_data = SchoolSerializer(school).data
        if hasattr(school, 'metrics') and school.metrics:
            result_data['metrics'] = SchoolMetricSerializer(school.metrics).data
        
        return Response({
            'success': True,
            'message': f"School '{school.name}' created successfully",
            'school': result_data
        }, status=status.HTTP_201_CREATED)
    
    def _create_school_admin(self, school, admin_data, created_by):
        """Create admin user in the school's database"""
        try:
            # Get the school's API URL
            api_url = school.api_url.rstrip('/')
            
            # Prepare admin data
            admin_payload = {
                'first_name': admin_data.get('first_name', 'Admin'),
                'last_name': admin_data.get('last_name', 'User'),
                'email': admin_data.get('email', f'admin@{school.school_id}.com'),
                'phone_number': admin_data.get('phone_number', ''),
                'role': admin_data.get('role', 'head'),
                'password': admin_data.get('password', 'Admin@2024'),
                'school_id': school.school_id,
            }
            
            # Call the school backend to create admin user
            response = requests.post(
                f"{api_url}/api/auth/register-admin/",
                json=admin_payload,
                timeout=30
            )
            
            if response.status_code == 201:
                logger.info(f"Admin user created for school {school.name}")
                return response.json()
            else:
                logger.error(f"Failed to create admin for {school.name}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating admin for school {school.name}: {e}")
            return None

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


# owner_panel/schools/views.py - Fix the SchoolSyncView

class SchoolSyncView(APIView):
    """Sync a single school's metrics"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        from .sync_utils import sync_school_metrics_from_db
        
        try:
            school = School.objects.get(pk=pk)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)
        
        # Sync using direct database access
        success = sync_school_metrics_from_db(school)
        
        if success:
            # Refresh school data
            school.refresh_from_db()
            serializer = SchoolSerializer(school)
            data = serializer.data
            
            if hasattr(school, 'metrics') and school.metrics:
                data['metrics'] = SchoolMetricSerializer(school.metrics).data
            
            return Response({
                'success': True,
                'message': f'Synced {school.name} successfully',
                'school': data
            })
        else:
            return Response({
                'success': False,
                'message': f'Failed to sync {school.name}. Database file may be missing.',
                'school': SchoolSerializer(school).data
            }, status=500)


class SyncAllSchoolsView(APIView):
    """Sync all schools at once"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .sync_utils import sync_school_metrics_from_db
        
        schools = School.objects.all()
        results = []
        success_count = 0
        
        for school in schools:
            success = sync_school_metrics_from_db(school)
            if success:
                success_count += 1
            results.append({
                'school_id': school.school_id,
                'name': school.name,
                'success': success
            })
        
        # Get updated metrics for all schools
        school_data = []
        total_students = 0
        total_users = 0
        total_staff = 0
        total_revenue = 0
        
        for school in schools:
            school.refresh_from_db()
            if hasattr(school, 'metrics') and school.metrics:
                school_data.append({
                    'id': school.id,
                    'school_id': school.school_id,
                    'name': school.name,
                    'metrics': {
                        'total_users': school.metrics.total_users,
                        'total_students': school.metrics.total_students,
                        'total_staff': school.metrics.total_staff,
                        'total_revenue': float(school.metrics.total_revenue),
                    }
                })
                total_students += school.metrics.total_students
                total_users += school.metrics.total_users
                total_staff += school.metrics.total_staff
                total_revenue += float(school.metrics.total_revenue)
        
        return Response({
            'success': True,
            'message': f'Successfully synced {success_count} of {len(schools)} schools',
            'results': results,
            'summary': {
                'total_schools': len(school_data),
                'total_students': total_students,
                'total_users': total_users,
                'total_staff': total_staff,
                'total_revenue': total_revenue,
            },
            'schools': school_data
        })
    
class SchoolStatsAllView(APIView):
    """Get stats for all schools - FIXED to show ALL schools"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        print(f"[SchoolStatsAllView] Getting stats for ALL schools...")
        
        # Get ALL schools - no filtering by active/archived
        schools = School.objects.all()
        
        print(f"[SchoolStatsAllView] Found {schools.count()} total schools")
        
        total_users = 0
        total_students = 0
        total_staff = 0
        total_parents = 0
        total_revenue = 0
        
        school_list = []
        
        for school in schools:
            print(f"[SchoolStatsAllView] Processing school: {school.name} (ID: {school.school_id})")
            
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
                    'is_active': school.is_active,
                    'is_archived': school.is_archived,
                    'registration_prefix': school.registration_prefix,
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
                    'is_active': school.is_active,
                    'is_archived': school.is_archived,
                    'registration_prefix': school.registration_prefix,
                    'metrics': {
                        'total_users': 0,
                        'total_students': 0,
                        'total_staff': 0,
                        'total_revenue': 0,
                    }
                })
        
        response_data = {
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
        }
        
        print(f"[SchoolStatsAllView] Returning {len(school_list)} schools")
        return Response(response_data)
    
def _make_school_headers(school):
    """Build headers that tell the backend which school DB to use."""
    return {
        'Content-Type': 'application/json',
        'X-School-ID': school.school_id,
    }


# class SchoolAdminUsersView(APIView):
#     """Get all admin users for a specific school"""
#     permission_classes = [IsAuthenticated]

#     def get(self, request, school_id):
#         try:
#             school = School.objects.get(id=school_id)
#         except School.DoesNotExist:
#             return Response({'error': 'School not found'}, status=404)

#         api_url = school.api_url.rstrip('/')

#         # ── connectivity check ──────────────────────────────────────────────
#         try:
#             requests.get(f"{api_url}/health/", timeout=5)
#         except requests.exceptions.ConnectionError:
#             return Response({
#                 'success': False,
#                 'error': (
#                     f'Cannot connect to school backend at {api_url}. '
#                     'Make sure the school server is running.'
#                 ),
#                 'admins': [],
#             }, status=200)
#         except requests.exceptions.Timeout:
#             return Response({
#                 'success': False,
#                 'error': f'Connection timeout to school backend at {api_url}',
#                 'admins': [],
#             }, status=200)

#         # ── fetch admins — pass X-School-ID so middleware picks the right DB ─
#         try:
#             response = requests.get(
#                 f"{api_url}/api/auth/school-admins/",   # correct URL
#                 headers=_make_school_headers(school),
#                 timeout=10,
#             )
#             if response.status_code == 200:
#                 return Response({
#                     'success': True,
#                     'school': {
#                         'id': school.id,
#                         'name': school.name,
#                         'school_id': school.school_id,
#                         'registration_prefix': school.registration_prefix,
#                     },
#                     'admins': response.json().get('admins', []),
#                 })
#             else:
#                 return Response({
#                     'success': False,
#                     'error': f'Backend returned {response.status_code}: {response.text}',
#                     'admins': [],
#                 }, status=200)
#         except Exception as e:
#             logger.error(f"Error fetching admins for {school.name}: {e}")
#             return Response({'success': False, 'error': str(e), 'admins': []}, status=200)


class AddSchoolAdminView(APIView):
    """Add a new admin user to a specific school"""
    permission_classes = [IsAuthenticated]

    def post(self, request, school_id):
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)

        api_url = school.api_url.rstrip('/')

        admin_payload = {
            'first_name':        request.data.get('first_name'),
            'last_name':         request.data.get('last_name'),
            'email':             request.data.get('email'),
            'phone_number':      request.data.get('phone_number', ''),
            'role':              request.data.get('role', 'head'),
            'password':          request.data.get('password'),
            'school_id':         school.school_id,
            'registration_prefix': school.registration_prefix,
        }

        # ── X-School-ID header routes the request to the correct SQLite DB ──
        try:
            response = requests.post(
                f"{api_url}/api/auth/register-admin/",
                json=admin_payload,
                headers=_make_school_headers(school),  # ← THE KEY FIX
                timeout=30,
            )
            if response.status_code == 201:
                ActivityLog.objects.create(
                    school=school,
                    action='create',
                    description=(
                        f"Admin '{request.data.get('first_name')} "
                        f"{request.data.get('last_name')}' created for {school.name}"
                    ),
                    user=request.user.username,
                )
                return Response({
                    'success': True,
                    'message': f"Admin user created successfully for {school.name}",
                    'admin': response.json(),
                }, status=201)
            else:
                error_detail = {}
                try:
                    error_detail = response.json()
                except Exception:
                    error_detail = {'raw': response.text}
                return Response({
                    'success': False,
                    'error': error_detail.get('error', f'Backend error {response.status_code}'),
                    'detail': error_detail,
                }, status=response.status_code)
        except requests.exceptions.ConnectionError:
            return Response({
                'success': False,
                'error': f'Cannot connect to school backend at {api_url}',
            }, status=503)
        except Exception as e:
            logger.error(f"Error creating admin for {school.name}: {e}")
            return Response({'success': False, 'error': str(e)}, status=500)

class DisableSchoolAdminView(APIView):
    """Disable an admin user in a specific school"""
    permission_classes = [IsAuthenticated]

    def post(self, request, school_id, user_id):
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)

        api_url = school.api_url.rstrip('/')
        reason  = request.data.get('reason', 'Disabled by owner')

        url = f"{api_url}/api/auth/disable-admin/{user_id}/"
        logger.info(f"[DisableAdmin] POST {url} school={school.school_id}")

        try:
            response = requests.post(
                url,
                json={'reason': reason},
                headers=_make_school_headers(school),
                timeout=30,
            )
            logger.info(f"[DisableAdmin] response status={response.status_code} body={response.text[:300]}")

            if response.status_code == 200:
                ActivityLog.objects.create(
                    school=school,
                    action='update',
                    description=f"Admin ID {user_id} disabled in {school.name}",
                    user=request.user.username,
                )
                return Response({'success': True, 'message': 'Admin user disabled successfully'})

            # surface the real error from the school backend
            try:
                error_body = response.json()
            except Exception:
                error_body = {'raw': response.text}

            return Response({
                'success': False,
                'error': error_body.get('error') or error_body.get('detail') or f'Backend returned {response.status_code}',
                'detail': error_body,
                'url_called': url,
            }, status=response.status_code)

        except requests.exceptions.ConnectionError:
            return Response({
                'success': False,
                'error': f'Cannot connect to school backend at {api_url}',
            }, status=503)
        except Exception as e:
            logger.error(f"[DisableAdmin] Exception: {e}")
            return Response({'success': False, 'error': str(e)}, status=500)


class RestoreSchoolAdminView(APIView):
    """Restore a disabled admin user in a specific school"""
    permission_classes = [IsAuthenticated]

    def post(self, request, school_id, user_id):
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)

        api_url = school.api_url.rstrip('/')
        url = f"{api_url}/api/auth/restore-admin/{user_id}/"
        logger.info(f"[RestoreAdmin] POST {url} school={school.school_id}")

        try:
            response = requests.post(
                url,
                headers=_make_school_headers(school),
                timeout=30,
            )
            logger.info(f"[RestoreAdmin] response status={response.status_code} body={response.text[:300]}")

            if response.status_code == 200:
                ActivityLog.objects.create(
                    school=school,
                    action='update',
                    description=f"Admin ID {user_id} restored in {school.name}",
                    user=request.user.username,
                )
                return Response({'success': True, 'message': 'Admin user restored successfully'})

            try:
                error_body = response.json()
            except Exception:
                error_body = {'raw': response.text}

            return Response({
                'success': False,
                'error': error_body.get('error') or error_body.get('detail') or f'Backend returned {response.status_code}',
                'detail': error_body,
                'url_called': url,
            }, status=response.status_code)

        except requests.exceptions.ConnectionError:
            return Response({
                'success': False,
                'error': f'Cannot connect to school backend at {api_url}',
            }, status=503)
        except Exception as e:
            logger.error(f"[RestoreAdmin] Exception: {e}")
            return Response({'success': False, 'error': str(e)}, status=500)

class OwnerUnlockUserInSchoolView(APIView):
    """Unlock a user in a specific school"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        registration_number = request.data.get('registration_number')
        school_id = request.data.get('school_id')
        
        if not registration_number or not school_id:
            return Response({
                'success': False,
                'error': 'registration_number and school_id are required'
            }, status=400)
        
        try:
            # Get the school to find its API URL
            school = School.objects.get(school_id=school_id)
            api_url = school.api_url.rstrip('/')
            
            # Call the school backend to unlock the user
            response = requests.post(
                f"{api_url}/api/auth/unlock-user/",
                json={
                    'registration_number': registration_number,
                    'secret': getattr(settings, 'OWNER_API_SECRET', '')
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ActivityLog.objects.create(
                    school=school,
                    action='unlock_user',
                    description=f"User {registration_number} unlocked in {school.name}",
                    user=request.user.username,
                )
                return Response({
                    'success': True,
                    'message': f'User {registration_number} unlocked successfully'
                })
            else:
                return Response({
                    'success': False,
                    'error': response.json().get('error', 'Failed to unlock user')
                }, status=response.status_code)
                
        except School.DoesNotExist:
            return Response({
                'success': False,
                'error': f'School {school_id} not found'
            }, status=404)
        except Exception as e:
            logger.error(f"Error unlocking user: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
            
            
# ── This must exist — if it was deleted or renamed, add it back ──────────────
class SchoolAdminUsersView(APIView):
    """Get all admin users for a specific school"""
    permission_classes = [IsAuthenticated]

    def get(self, request, school_id):
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)

        api_url = school.api_url.rstrip('/')

        # connectivity check
        try:
            requests.get(f"{api_url}/health/", timeout=5)
        except requests.exceptions.ConnectionError:
            return Response({
                'success': False,
                'error': f'Cannot connect to school backend at {api_url}. Make sure the school server is running.',
                'admins': [],
            }, status=200)
        except requests.exceptions.Timeout:
            return Response({
                'success': False,
                'error': f'Connection timeout to school backend at {api_url}',
                'admins': [],
            }, status=200)

        try:
            response = requests.get(
                f"{api_url}/api/auth/school-admins/",
                headers=_make_school_headers(school),
                timeout=10,
            )
            if response.status_code == 200:
                return Response({
                    'success': True,
                    'school': {
                        'id': school.id,
                        'name': school.name,
                        'school_id': school.school_id,
                        'registration_prefix': school.registration_prefix,
                    },
                    'admins': response.json().get('admins', []),
                })
            else:
                return Response({
                    'success': False,
                    'error': f'Backend returned {response.status_code}: {response.text}',
                    'admins': [],
                }, status=200)
        except Exception as e:
            logger.error(f"Error fetching admins for {school.name}: {e}")
            return Response({'success': False, 'error': str(e), 'admins': []}, status=200)