"""
Owner Views - Multi-tenant management for super admin
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.db.models import Sum, Count
from datetime import timedelta
import requests
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
import logging
import psutil
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Import models from schools app
from schools.models import School, SchoolMetric, ActivityLog

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class OwnerLoginView(APIView):
    """Owner login view - CSRF exempt for API"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Login attempt - Username: {username}")
        print(f"Request data: {request.data}")
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=400)
        
        from django.contrib.auth import authenticate
        user = authenticate(request, username=username, password=password)
        
        print(f"Authentication result: {user}")
        
        if user and (user.is_staff or user.is_superuser):
            from rest_framework.authtoken.models import Token
            from django.contrib.auth import login
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'success': True,
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser
                }
            })
        
        print(f"Authentication failed for {username}")
        return Response({'error': 'Invalid credentials'}, status=401)
    
class OwnerLogoutView(APIView):
    """Owner logout view"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass
        logout(request)
        return Response({'success': True})


class OwnerComprehensiveDashboardView(APIView):
    """Get comprehensive dashboard data for owner"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School, SchoolMetric
        
        # Get ALL schools (not just active ones for the list)
        schools = School.objects.all()
        
        school_breakdown = []
        total_users = 0
        total_students = 0
        total_staff = 0
        total_revenue = 0
        
        for school in schools:
            if hasattr(school, 'metrics') and school.metrics:
                m = school.metrics
                total_users += m.total_users or 0
                total_students += m.total_students or 0
                total_staff += m.total_staff or 0
                total_revenue += float(m.total_revenue or 0)
                
                school_breakdown.append({
                    'id': school.id,
                    'name': school.name,
                    'school_id': school.school_id,
                    'api_url': school.api_url,
                    'is_active': school.is_active,
                    'is_archived': school.is_archived,
                    'metrics': {
                        'total_users': m.total_users or 0,
                        'total_students': m.total_students or 0,
                        'total_staff': m.total_staff or 0,
                        'total_parents': m.total_parents or 0,
                        'school_fee_revenue': float(m.school_fee_revenue or 0),
                        'portal_revenue': float(m.portal_revenue or 0),
                        'total_revenue': float(m.total_revenue or 0),
                        'portal_paid_count': m.portal_paid_count or 0,
                        'health_status': m.health_status or 'unknown',
                    }
                })
            else:
                school_breakdown.append({
                    'id': school.id,
                    'name': school.name,
                    'school_id': school.school_id,
                    'api_url': school.api_url,
                    'is_active': school.is_active,
                    'is_archived': school.is_archived,
                    'metrics': {
                        'total_users': 0,
                        'total_students': 0,
                        'total_staff': 0,
                        'total_parents': 0,
                        'school_fee_revenue': 0,
                        'portal_revenue': 0,
                        'total_revenue': 0,
                        'portal_paid_count': 0,
                        'health_status': 'unknown',
                    }
                })
        
        # Count active schools (not archived)
        active_schools = [s for s in school_breakdown if not s.get('is_archived', False)]
        
        return Response({
            'success': True,
            'summary': {
                'total_schools': schools.count(),
                'total_users': total_users,
                'total_students': total_students,
                'total_staff': total_staff,
                'total_revenue': float(total_revenue),
                'healthy_servers': len([s for s in school_breakdown if s['metrics']['health_status'] == 'healthy']),
                'down_servers': len([s for s in school_breakdown if s['metrics']['health_status'] == 'down']),
                'health_percentage': round(len([s for s in school_breakdown if s['metrics']['health_status'] == 'healthy']) / schools.count() * 100, 2) if schools.count() > 0 else 0,
            },
            'schools': school_breakdown,
            'top_schools': {
                'by_students': sorted(school_breakdown, key=lambda x: x['metrics']['total_students'], reverse=True)[:5],
                'by_revenue': sorted(school_breakdown, key=lambda x: x['metrics']['total_revenue'], reverse=True)[:5],
                'by_portal_paid': sorted(school_breakdown, key=lambda x: x['metrics']['portal_paid_count'], reverse=True)[:5],
            },
            'system_health': {
                'cpu_percent': 0,
                'memory_percent': 0,
                'disk_percent': 0,
            },
        })
        
class OwnerPerSchoolActivityView(APIView):
    """
    Get detailed activity logs for a specific school
    GET /api/owner/per-school-activity/<int:school_id>/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, school_id):
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)
        
        # Get date range
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Get school metrics
        metric_data = {}
        if hasattr(school, 'metrics') and school.metrics:
            m = school.metrics
            metric_data = {
                'total_users': m.total_users or 0,
                'total_students': m.total_students or 0,
                'total_staff': m.total_staff or 0,
                'total_parents': m.total_parents or 0,
                'school_fee_revenue': float(m.school_fee_revenue or 0),
                'portal_revenue': float(m.portal_revenue or 0),
                'portal_paid_count': m.portal_paid_count or 0,
                'portal_pending_count': m.portal_pending_count or 0,
                'health_status': m.health_status or 'unknown',
                'response_time_ms': m.response_time_ms or 0,
            }
        
        # Get activity logs
        activities = ActivityLog.objects.filter(
            school=school,
            created_at__gte=start_date
        ).order_by('-created_at')[:200]
        
        activity_data = []
        for act in activities:
            activity_data.append({
                'action': act.action,
                'description': act.description,
                'user': act.user,
                'ip_address': act.ip_address,
                'time_ago': self._time_ago(act.created_at),
                'created_at': act.created_at.isoformat(),
            })
        
        return Response({
            'success': True,
            'school': {
                'id': school.id,
                'name': school.name,
                'school_id': school.school_id,
                'api_url': school.api_url,
                'is_active': school.is_active,
                'is_archived': school.is_archived,
                'created_at': school.created_at,
            },
            'metrics': metric_data,
            'activities': activity_data,
            'total_activities': len(activity_data),
        })
    
    def _time_ago(self, dt):
        if not dt:
            return 'Never'
        now = timezone.now()
        diff = now - dt
        if diff.days > 0:
            return f"{diff.days} day(s) ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600} hour(s) ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60} minute(s) ago"
        else:
            return "Just now"


class OwnerForceLogoutSchoolView(APIView):
    """
    Force logout all users in a specific school
    POST /api/owner/force-logout-school/<int:school_id>/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, school_id):
        from schools.models import School, ActivityLog
        
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)
        
        # Get the owner's username to exclude them
        owner_username = request.user.username
        
        secret = getattr(settings, 'OWNER_API_SECRET', '')
        
        # Add exclude_username parameter to exclude the owner
        url = f"{school.api_url}/api/auth/admin/force-logout-all/"
        
        try:
            response = requests.post(
                url,
                json={
                    'secret': secret, 
                    'school_id': school.school_id,
                    'exclude_username': owner_username  # Exclude owner
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ActivityLog.objects.create(
                    school=school,
                    action='force_logout',
                    description=f"All users force logged out by owner (owner excluded)",
                    user=request.user.username,
                )
                return Response({
                    'success': True, 
                    'message': f"All users (except owner) logged out from {school.name}"
                })
            else:
                return Response({'error': response.text}, status=response.status_code)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class OwnerManageSchoolUserView(APIView):
    """
    Archive/Restore a user in a specific school
    POST /api/owner/manage-school-user/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        school_id = request.data.get('school_id')
        registration_number = request.data.get('registration_number')
        action = request.data.get('action')
        reason = request.data.get('reason', '')
        
        if not school_id or not registration_number or not action:
            return Response({'error': 'school_id, registration_number, and action required'}, status=400)
        
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=404)
        
        secret = getattr(settings, 'OWNER_API_SECRET', '')
        url = f"{school.api_url}/api/auth/admin/manage-user/"
        
        try:
            response = requests.post(
                url,
                json={
                    'registration_number': registration_number,
                    'action': action,
                    'reason': reason,
                    'secret': secret,
                    'school_id': school.school_id,
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ActivityLog.objects.create(
                    school=school,
                    action=f"user_{action}",
                    description=f"User {registration_number} {action}d. Reason: {reason}",
                    user=request.user.username,
                )
                return Response({
                    'success': True,
                    'message': f"User {registration_number} {action}d successfully in {school.name}"
                })
            else:
                return Response({'error': response.text}, status=response.status_code)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class OwnerAllFailedLoginsView(APIView):
    """
    Get all failed login attempts across all schools
    GET /api/owner/all-failed-logins/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School
        from pathlib import Path
        import sqlite3
        
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        
        all_failed_attempts = []
        total_failed = 0
        
        schools = School.objects.filter(is_active=True, is_archived=False)
        
        for school in schools:
            # Try multiple possible database paths
            possible_paths = [
                MAIN_BACKEND_DIR / f"{school.school_id}.sqlite3",
                MAIN_BACKEND_DIR / f"{school.school_id}_db.sqlite3",
                MAIN_BACKEND_DIR / f"{school.db_name}.sqlite3",
            ]
            
            db_path = None
            for path in possible_paths:
                if path.exists():
                    db_path = path
                    break
            
            if not db_path:
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Get failed login attempts grouped by user
                cursor.execute("""
                    SELECT 
                        la.registration_number,
                        COUNT(*) as failed_count,
                        MAX(la.attempted_at) as latest_attempt,
                        GROUP_CONCAT(DISTINCT la.ip_address) as ip_addresses,
                        u.first_name,
                        u.last_name,
                        u.is_locked,
                        u.failed_login_attempts as user_failed_count,
                        u.locked_until
                    FROM users_loginattempt la
                    LEFT JOIN users_user u ON u.registration_number = la.registration_number
                    WHERE la.was_successful = 0
                    GROUP BY la.registration_number
                    ORDER BY failed_count DESC
                """)
                
                rows = cursor.fetchall()
                conn.close()
                
                for row in rows:
                    reg = row[0] or 'Unknown'
                    failed_count = row[1] or 1
                    latest_attempt = row[2]
                    ip_addresses = row[3] or ''
                    first_name = row[4] or ''
                    last_name = row[5] or ''
                    is_locked = bool(row[6]) if row[6] is not None else False
                    user_failed_count = row[7] or 0
                    locked_until = row[8]
                    
                    ip = ip_addresses.split(',')[0] if ip_addresses else 'Unknown'
                    
                    all_failed_attempts.append({
                        'registration_number': reg,
                        'user_name': f"{first_name} {last_name}".strip() or 'Unknown',
                        'failed_count': failed_count,
                        'user_failed_count': user_failed_count,
                        'latest_attempt': latest_attempt,
                        'ip_address': ip,
                        'is_locked': is_locked,
                        'locked_until': locked_until,
                        'school_name': school.name,
                        'school_id': school.school_id,
                    })
                    total_failed += failed_count
                
            except Exception as e:
                print(f"Error for {school.name}: {e}")
        
        all_failed_attempts.sort(key=lambda x: x['failed_count'], reverse=True)
        
        return Response({
            'success': True,
            'summary': {
                'total_failed_attempts': total_failed,
                'suspicious_users_count': len(all_failed_attempts),
            },
            'failed_attempts': all_failed_attempts,
            'timestamp': timezone.now().isoformat()
        })
       
class OwnerUnlockUserInSchoolView(APIView):
    """
    Unlock a user in a specific school
    POST /api/owner/unlock-user-in-school/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        registration_number = request.data.get('registration_number')
        school_id = request.data.get('school_id')
        
        if not registration_number or not school_id:
            return Response({'error': 'registration_number and school_id required'}, status=400)
        
        from schools.models import School
        from pathlib import Path
        import sqlite3
        
        BASE_DIR = Path(__file__).resolve().parent.parent
        db_path = BASE_DIR / f"{school_id}.sqlite3"
        
        if not db_path.exists():
            return Response({'error': f'Database not found for school {school_id}'}, status=404)
        
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            
            # Update user to unlocked
            cursor.execute("""
                UPDATE users_user 
                SET is_locked = 0, 
                    failed_login_attempts = 0,
                    locked_until = NULL
                WHERE registration_number = ?
            """, (registration_number,))
            
            conn.commit()
            
            # Check if any row was updated
            if cursor.rowcount == 0:
                conn.close()
                return Response({'error': f'User {registration_number} not found'}, status=404)
            
            conn.close()
            
            # Log the activity
            try:
                from .models import ActivityLog
                ActivityLog.objects.create(
                    action='user_unlock',
                    description=f"User {registration_number} unlocked in school {school_id} by owner",
                    user=request.user.username,
                )
            except:
                pass
            
            return Response({
                'success': True,
                'message': f'User {registration_number} unlocked successfully'
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class OwnerUnlockUserAllSchoolsView(APIView):
    """
    Unlock a user across all schools
    POST /api/owner/unlock-user-all-schools/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        registration_number = request.data.get('registration_number')
        
        if not registration_number:
            return Response({'error': 'registration_number required'}, status=400)
        
        from schools.models import School
        from pathlib import Path
        import sqlite3
        
        BASE_DIR = Path(__file__).resolve().parent.parent
        schools = School.objects.filter(is_active=True, is_archived=False)
        
        unlocked_schools = []
        failed_schools = []
        
        for school in schools:
            db_path = BASE_DIR / f"{school.school_id}.sqlite3"
            
            if not db_path.exists():
                failed_schools.append(f"{school.name} (DB not found)")
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                cursor.execute("""
                    UPDATE users_user 
                    SET is_locked = 0, 
                        failed_login_attempts = 0,
                        locked_until = NULL
                    WHERE registration_number = ?
                """, (registration_number,))
                
                conn.commit()
                conn.close()
                
                if cursor.rowcount > 0:
                    unlocked_schools.append(school.name)
                else:
                    failed_schools.append(f"{school.name} (User not found)")
                    
            except Exception as e:
                failed_schools.append(f"{school.name} ({str(e)})")
        
        return Response({
            'success': True,
            'message': f'User {registration_number} unlocked in {len(unlocked_schools)} schools',
            'unlocked_schools': unlocked_schools,
            'failed_schools': failed_schools
        })
        
class OwnerAllUsersView(APIView):
    """
    Get all users across all schools
    GET /api/owner/all-users/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School
        from pathlib import Path
        import sqlite3
        from django.utils import timezone
        
        # The database files are in the main backend directory
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        
        all_users = []
        total_users = 0
        
        schools = School.objects.filter(is_active=True, is_archived=False)
        
        for school in schools:
            # Try multiple possible database paths in the main backend
            possible_paths = [
                MAIN_BACKEND_DIR / f"{school.school_id}.sqlite3",
                MAIN_BACKEND_DIR / f"{school.school_id}_db.sqlite3",
                MAIN_BACKEND_DIR / f"{school.db_name}.sqlite3",
                MAIN_BACKEND_DIR / "db.sqlite3",  # fallback
            ]
            
            db_path = None
            for path in possible_paths:
                if path.exists():
                    db_path = path
                    print(f"Found database for {school.name} at: {db_path}")
                    break
            
            if not db_path:
                print(f"Database not found for {school.name}. Tried: {possible_paths}")
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Check if users table exists
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='users_user'
                """)
                
                if not cursor.fetchone():
                    print(f"No users_user table in {school.name}")
                    conn.close()
                    continue
                
                # Get all users with their details
                cursor.execute("""
                    SELECT 
                        registration_number,
                        first_name,
                        last_name,
                        email,
                        phone_number,
                        role,
                        is_active,
                        is_verified,
                        is_locked,
                        failed_login_attempts,
                        locked_until,
                        last_login,
                        created_at
                    FROM users_user
                    ORDER BY created_at DESC
                """)
                
                rows = cursor.fetchall()
                conn.close()
                
                print(f"Found {len(rows)} users in {school.name}")
                
                for row in rows:
                    user_data = {
                        'school_id': school.school_id,
                        'school_name': school.name,
                        'registration_number': row[0] or 'N/A',
                        'first_name': row[1] or '',
                        'last_name': row[2] or '',
                        'full_name': f"{row[1] or ''} {row[2] or ''}".strip() or 'Unknown',
                        'email': row[3] or '',
                        'phone': row[4] or '',
                        'role': row[5] or 'unknown',
                        'is_active': bool(row[6]) if row[6] is not None else True,
                        'is_verified': bool(row[7]) if row[7] is not None else True,
                        'is_locked': bool(row[8]) if row[8] is not None else False,
                        'failed_attempts': row[9] or 0,
                        'locked_until': row[10],
                        'last_login': row[11],
                        'created_at': row[12],
                    }
                    all_users.append(user_data)
                    total_users += 1
                
            except Exception as e:
                print(f"Error for {school.name}: {e}")
                import traceback
                traceback.print_exc()
        
        print(f"Total users across all schools: {total_users}")
        
        return Response({
            'success': True,
            'summary': {
                'total_users': total_users,
                'total_schools': schools.count(),
            },
            'users': all_users,
            'timestamp': timezone.now().isoformat()
        })
        
        
# Add these classes to owner_panel/views.py

class OwnerActivityAllSchoolsView(APIView):
    """Get activity data for all schools aggregated"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School
        from django.utils import timezone
        import requests
        
        schools = School.objects.filter(is_archived=False)
        
        schools_data = []
        total_activities = 0
        today_activities = 0
        week_activities = 0
        
        for school in schools:
            try:
                api_url = school.api_url.rstrip('/')
                target_url = f"{api_url}/api/users/owner/activity/school/{school.school_id}/summary/"
                
                response = requests.get(
                    target_url,
                    headers={
                        'X-Owner-Secret': getattr(settings, 'OWNER_API_SECRET', '')
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    schools_data.append({
                        'id': school.id,
                        'school_id': school.school_id,
                        'name': school.name,
                        'total_activities': data.get('total_activities', 0),
                        'today_activities': data.get('today_activities', 0),
                        'week_activities': data.get('week_activities', 0),
                        'last_activity': data.get('last_activity'),
                        'health_status': 'healthy'
                    })
                    total_activities += data.get('total_activities', 0)
                    today_activities += data.get('today_activities', 0)
                    week_activities += data.get('week_activities', 0)
                else:
                    schools_data.append({
                        'id': school.id,
                        'school_id': school.school_id,
                        'name': school.name,
                        'total_activities': 0,
                        'today_activities': 0,
                        'week_activities': 0,
                        'health_status': 'unknown'
                    })
            except requests.exceptions.ConnectionError:
                schools_data.append({
                    'id': school.id,
                    'school_id': school.school_id,
                    'name': school.name,
                    'total_activities': 0,
                    'today_activities': 0,
                    'week_activities': 0,
                    'health_status': 'down'
                })
            except Exception as e:
                schools_data.append({
                    'id': school.id,
                    'school_id': school.school_id,
                    'name': school.name,
                    'total_activities': 0,
                    'today_activities': 0,
                    'week_activities': 0,
                    'health_status': 'error'
                })
        
        return Response({
            'success': True,
            'total_activities': total_activities,
            'today_activities': today_activities,
            'week_activities': week_activities,
            'schools': schools_data,
            'timestamp': timezone.now().isoformat()
        })


class OwnerActivityStatisticsView(APIView):
    """Get aggregated activity statistics across all schools"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School
        import requests
        
        schools = School.objects.filter(is_archived=False)
        
        total_activities = 0
        today_activities = 0
        week_activities = 0
        by_type = {}
        
        for school in schools:
            try:
                api_url = school.api_url.rstrip('/')
                target_url = f"{api_url}/api/users/owner/activity/statistics/"
                
                response = requests.get(
                    target_url,
                    headers={
                        'X-Owner-Secret': getattr(settings, 'OWNER_API_SECRET', '')
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    total_activities += data.get('total_activities', 0)
                    today_activities += data.get('today_activities', 0)
                    week_activities += data.get('week_activities', 0)
                    
                    # Merge by_type
                    for type_name, count in data.get('by_type', {}).items():
                        by_type[type_name] = by_type.get(type_name, 0) + count
            except Exception:
                pass
        
        return Response({
            'success': True,
            'total_schools': schools.count(),
            'total_activities': total_activities,
            'today_activities': today_activities,
            'week_activities': week_activities,
            'by_type': by_type,
            'timestamp': timezone.now().isoformat()
        })


class ProxySchoolActivityView(APIView):
    """Proxy request to school backend for activity data"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, school_id, endpoint):
        from schools.models import School
        import requests
        
        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            return Response({"error": "School not found"}, status=404)
        
        api_url = school.api_url.rstrip('/')
        
        # Map frontend endpoints to backend endpoints
        endpoint_mapping = {
            'summary': f'/api/users/owner/activity/school/{school_id}/summary/',
            'list': f'/api/users/owner/activity/school/{school_id}/list/',
            'statistics': f'/api/users/owner/activity/school/{school_id}/statistics/',
        }
        
        target_url = f"{api_url}{endpoint_mapping.get(endpoint, f'/api/users/owner/activity/{endpoint}/')}"
        
        # Forward query params
        params = request.query_params.dict()
        
        try:
            response = requests.get(
                target_url,
                params=params,
                headers={
                    'X-School-ID': school.school_id,
                    'X-Owner-Secret': getattr(settings, 'OWNER_API_SECRET', '')
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return Response(response.json(), status=200)
            else:
                return Response({"error": f"School backend returned {response.status_code}"}, status=response.status_code)
                
        except requests.exceptions.ConnectionError:
            return Response({"error": f"Cannot connect to school backend at {api_url}"}, status=503)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
        
class OwnerActivityProxyView(APIView):
    """Proxy request to school backend for activity data"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, school_id, endpoint):
        import requests
        
        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            return Response({"error": "School not found"}, status=404)
        
        api_url = school.api_url.rstrip('/')
        
        # Map the endpoint to the correct URL path
        if endpoint == 'summary':
            target_url = f"{api_url}/api/users/owner/activity/school/{school_id}/summary/"
        elif endpoint == 'list':
            target_url = f"{api_url}/api/users/owner/activity/school/{school_id}/list/"
        elif endpoint == 'statistics':
            target_url = f"{api_url}/api/users/owner/activity/school/{school_id}/statistics/"
        else:
            return Response({"error": f"Unknown endpoint: {endpoint}"}, status=400)
        
        # Forward query params
        params = request.query_params.dict()
        
        try:
            response = requests.get(
                target_url,
                params=params,
                headers={
                    'X-Owner-Secret': getattr(settings, 'OWNER_API_SECRET', '')
                },
                timeout=30
            )
            return Response(response.json(), status=response.status_code)
        except requests.exceptions.ConnectionError:
            return Response({"error": f"Cannot connect to school backend at {api_url}"}, status=503)
        except Exception as e:
            return Response({"error": str(e)}, status=500)