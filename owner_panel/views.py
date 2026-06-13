"""
Owner Views - Multi-tenant management for super admin
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta
import requests
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
import logging
import psutil
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
# Add these imports at the top
from django.utils import timezone
from datetime import timedelta, datetime
from collections import defaultdict

from schools.models import School, SchoolMetric, ActivityLog
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)


import os
from pathlib import Path

def get_school_db_path(school_id):
    """Get the correct database path for a school"""
    MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
    
    # Try all possible database filename patterns
    possible_names = [
        f"{school_id}_db.sqlite3",
        f"{school_id}.sqlite3",
        f"{school_id}_database.sqlite3",
        f"{school_id}_db.sqlite",
        f"{school_id}.sqlite",
        "db.sqlite3",  # fallback to default
    ]
    
    for name in possible_names:
        db_path = MAIN_BACKEND_DIR / name
        if db_path.exists():
            print(f"[DB Path] Found database for {school_id}: {db_path}")
            return db_path
    
    # Also try to find any database file that contains the school_id in name
    for file in MAIN_BACKEND_DIR.glob("*.sqlite3"):
        if school_id in str(file):
            print(f"[DB Path] Found matching database for {school_id}: {file}")
            return file
    
    print(f"[DB Path] No database found for {school_id}")
    return None


def get_all_school_databases():
    """Get all SQLite database files in the backend directory"""
    MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
    databases = []
    
    for file in MAIN_BACKEND_DIR.glob("*.sqlite3"):
        databases.append(file)
    
    print(f"[DB Path] Found {len(databases)} database files: {[f.name for f in databases]}")
    return databases

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
        

class OwnerActivityAllSchoolsView(APIView):
    """Get activity data for all schools"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School, ActivityLog
        from django.utils import timezone
        from datetime import timedelta
        
        schools = School.objects.filter(is_archived=False)
        
        schools_data = []
        total_activities = 0
        today_activities = 0
        week_activities = 0
        
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = timezone.now() - timedelta(days=7)
        
        for school in schools:
            # Get activity counts from ActivityLog
            school_activities = ActivityLog.objects.filter(school=school)
            school_total = school_activities.count()
            school_today = school_activities.filter(created_at__gte=today_start).count()
            school_week = school_activities.filter(created_at__gte=week_ago).count()
            
            last_activity_obj = school_activities.order_by('-created_at').first()
            last_activity = last_activity_obj.created_at if last_activity_obj else None
            
            schools_data.append({
                'id': school.id,
                'school_id': school.school_id,
                'name': school.name,
                'total_activities': school_total,
                'today_activities': school_today,
                'week_activities': school_week,
                'last_activity': last_activity,
                'health_status': 'healthy' if school.is_active else 'offline',
                'is_active': school.is_active,
                'is_archived': school.is_archived,
            })
            
            total_activities += school_total
            today_activities += school_today
            week_activities += school_week
        
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
        from schools.models import School, ActivityLog
        
        schools = School.objects.filter(is_archived=False)
        
        total_activities = 0
        today_activities = 0
        week_activities = 0
        by_type = {}
        
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = timezone.now() - timedelta(days=7)
        
        for school in schools:
            school_activities = ActivityLog.objects.filter(school=school)
            total_activities += school_activities.count()
            today_activities += school_activities.filter(created_at__gte=today_start).count()
            week_activities += school_activities.filter(created_at__gte=week_ago).count()
            
            # Get type distribution
            for act in school_activities:
                action = act.action or 'unknown'
                by_type[action] = by_type.get(action, 0) + 1
        
        return Response({
            'success': True,
            'total_schools': schools.count(),
            'total_activities': total_activities,
            'today_activities': today_activities,
            'week_activities': week_activities,
            'by_type': by_type,
            'timestamp': timezone.now().isoformat()
        })


class OwnerActivityProxyView(APIView):
    """Proxy request to get activity data from school backend"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, school_id):
        """
        Note: The endpoint is captured in the URL pattern but we'll extract it
        from the request path since the URL pattern might not capture it properly
        """
        from schools.models import School, ActivityLog
        from django.db.models import Q
        from django.utils import timezone
        from datetime import timedelta
        
        # Extract endpoint from the request path
        path = request.path
        if '/summary/' in path:
            endpoint = 'summary'
        elif '/list/' in path:
            endpoint = 'list'
        elif '/statistics/' in path:
            endpoint = 'statistics'
        else:
            endpoint = 'list'
        
        print(f"[OwnerActivityProxyView] school_id: {school_id}, endpoint: {endpoint}")
        
        try:
            # Find the school
            school = School.objects.filter(school_id=school_id).first()
            if not school:
                try:
                    school = School.objects.get(id=int(school_id))
                except (ValueError, School.DoesNotExist):
                    return Response({
                        'activities': [],
                        'total': 0,
                        'success': True,
                        'error': 'School not found'
                    }, status=200)
            
            print(f"[OwnerActivityProxyView] Found school: {school.name}")
            
            # Handle different endpoints
            if endpoint == 'summary':
                today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
                week_ago = timezone.now() - timedelta(days=7)
                month_ago = timezone.now() - timedelta(days=30)
                
                activities = ActivityLog.objects.filter(school=school)
                total = activities.count()
                today = activities.filter(created_at__gte=today_start).count()
                week = activities.filter(created_at__gte=week_ago).count()
                month = activities.filter(created_at__gte=month_ago).count()
                
                last_activity_obj = activities.order_by('-created_at').first()
                last_activity = last_activity_obj.created_at if last_activity_obj else None
                
                # Get activity by type
                by_type = {}
                for act in activities:
                    action = act.action or 'unknown'
                    by_type[action] = by_type.get(action, 0) + 1
                
                return Response({
                    'school_id': school.school_id,
                    'total_activities': total,
                    'today_activities': today,
                    'week_activities': week,
                    'month_activities': month,
                    'last_activity': last_activity,
                    'by_type': by_type,
                    'success': True
                }, status=200)
            
            elif endpoint == 'list':
                # Get pagination parameters
                limit = int(request.query_params.get('limit', 50))
                offset = int(request.query_params.get('offset', 0))
                activity_type = request.query_params.get('activity_type', '')
                search = request.query_params.get('search', '')
                
                print(f"[OwnerActivityProxyView] Filters - limit:{limit}, offset:{offset}, type:{activity_type}, search:{search}")
                
                # Base queryset
                queryset = ActivityLog.objects.filter(school=school)
                
                # Apply filters
                if activity_type and activity_type != 'all':
                    queryset = queryset.filter(action__icontains=activity_type)
                
                if search:
                    queryset = queryset.filter(
                        Q(description__icontains=search) |
                        Q(user__icontains=search) |
                        Q(action__icontains=search)
                    )
                
                # Get total count
                total = queryset.count()
                print(f"[OwnerActivityProxyView] Total activities: {total}")
                
                # Get paginated activities
                activities = queryset.order_by('-created_at')[offset:offset + limit]
                
                # Format activities
                activities_data = []
                for act in activities:
                    activities_data.append({
                        'id': act.id,
                        'activity_type': act.action,
                        'action': act.action,
                        'description': act.description,
                        'user_name': act.user,
                        'user_registration_number': act.user,
                        'target_name': act.description[:50] if act.description else '',
                        'ip_address': act.ip_address,
                        'created_at': act.created_at.isoformat() if act.created_at else None,
                    })
                
                return Response({
                    'school_id': school.school_id,
                    'total': total,
                    'activities': activities_data,
                    'limit': limit,
                    'offset': offset,
                    'success': True
                }, status=200)
            
            else:
                return Response({
                    'activities': [],
                    'total': 0,
                    'success': True
                }, status=200)
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'activities': [],
                'total': 0,
                'success': True,
                'error': str(e)
            }, status=200)
            
            
class SchoolStatsAllView(APIView):
    """Get all schools with their stats"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School
        
        schools = School.objects.filter(is_archived=False)
        school_list = []
        
        for school in schools:
            school_list.append({
                'id': school.id,
                'school_id': school.school_id,
                'name': school.name,
                'total_activities': 0,
                'health_status': 'healthy' if school.is_active else 'offline',
                'is_active': school.is_active,
                'is_archived': school.is_archived,
            })
        
        return Response({
            'success': True,
            'schools': school_list
        })


class ProxyAdminView(APIView):
    """
    Universal proxy view that forwards requests to the appropriate school backend
    """
    permission_classes = [IsAuthenticated]
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
    
    def get(self, request, school_id, registration_number=None):
        return self._forward_request(request, school_id, 'GET', registration_number)
    
    def post(self, request, school_id, registration_number=None):
        return self._forward_request(request, school_id, 'POST', registration_number)
    
    def _forward_request(self, request, school_id, method, registration_number=None):
        try:
            # Find the school
            school = School.objects.filter(school_id=school_id).first()
            if not school:
                try:
                    school = School.objects.get(id=int(school_id))
                except (ValueError, School.DoesNotExist):
                    return self._empty_response()
            
            # Build the target URL
            api_url = school.api_url.rstrip('/')
            path = request.path
            
            # Extract the endpoint from the path
            if '/online-status/' in path:
                target_path = '/api/auth/admin/online-status/'
            elif '/login-analytics/' in path:
                target_path = '/api/auth/admin/login-analytics/'
            elif '/activity-log/' in path:
                target_path = '/api/auth/admin/activity-log/'
            elif '/lock-user/' in path and registration_number:
                target_path = f'/api/auth/admin/lock-user/{registration_number}/'
            elif '/unlock-user/' in path and registration_number:
                target_path = f'/api/auth/admin/unlock-user/{registration_number}/'
            elif '/force-logout-all/' in path:
                target_path = '/api/auth/admin/force-logout-all/'
            elif '/force-logout-user/' in path and registration_number:
                target_path = f'/api/auth/admin/force-logout-user/{registration_number}/'
            else:
                return self._empty_response()
            
            target_url = f"{api_url}{target_path}"
            
            # Forward query parameters
            params = request.query_params.dict()
            
            # Make the request to the school backend
            headers = {
                'Content-Type': 'application/json',
                'X-School-ID': school.school_id,
            }
            
            # Add authorization if the school backend uses token auth
            # You might need to store a school token or use a shared secret
            school_token = getattr(settings, 'SCHOOL_API_TOKEN', '')
            if school_token:
                headers['Authorization'] = f'Token {school_token}'
            
            if method == 'GET':
                response = requests.get(target_url, params=params, headers=headers, timeout=30)
            else:
                response = requests.post(target_url, json=request.data, params=params, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return Response(response.json(), status=200)
            else:
                return self._empty_response()
                
        except requests.exceptions.ConnectionError:
            return self._empty_response()
        except Exception as e:
            print(f"Proxy error: {e}")
            return self._empty_response()
    
    def _empty_response(self):
        """Return empty response structure"""
        return Response({
            'summary': {'total_users': 0, 'total_online': 0, 'total_offline': 0},
            'online_by_role': {},
            'online_users': [],
            'today_stats': {'successful': 0, 'failed': 0, 'success_rate': 0},
            'suspicious_users': [],
            'daily_trends': [],
            'locked_accounts': [],
            'suspicious_ips': [],
            'activities': [],
            'total': 0,
            'success': True
        }, status=200)
        
        

# ============================================
# AGGREGATED VIEWS THAT READ FROM SCHOOL DATABASES
# ============================================

class OwnerAggregatedOnlineStatusView(APIView):
    """Get online status from ALL school databases"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School
        
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        
        total_users = 0
        total_online = 0
        online_by_role = defaultdict(int)
        online_users = []
        
        # Get all SQLite database files
        db_files = list(MAIN_BACKEND_DIR.glob("*.sqlite3"))
        print(f"[OnlineStatus] Found {len(db_files)} database files")
        
        for db_path in db_files:
            db_name = db_path.stem
            print(f"[OnlineStatus] Checking database: {db_name}")
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Check if users table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_user'")
                if not cursor.fetchone():
                    print(f"[OnlineStatus] No users table in {db_name}")
                    conn.close()
                    continue
                
                # Get total active users
                cursor.execute("SELECT COUNT(*) FROM users_user WHERE is_active = 1")
                total_count = cursor.fetchone()[0] or 0
                total_users += total_count
                print(f"[OnlineStatus] {db_name}: total users = {total_count}")
                
                # Get online users count
                cursor.execute("SELECT COUNT(*) FROM users_user WHERE is_online = 1")
                online_count = cursor.fetchone()[0] or 0
                total_online += online_count
                print(f"[OnlineStatus] {db_name}: online users = {online_count}")
                
                # Get online users by role
                cursor.execute("""
                    SELECT 
                        CASE role
                            WHEN 'head' THEN 'Head of School'
                            WHEN 'hm' THEN 'Head Master'
                            WHEN 'principal' THEN 'Principal'
                            WHEN 'vice_principal' THEN 'Vice Principal'
                            WHEN 'teacher' THEN 'Teacher'
                            WHEN 'form_teacher' THEN 'Form Teacher'
                            WHEN 'subject_teacher' THEN 'Subject Teacher'
                            WHEN 'student' THEN 'Student'
                            WHEN 'parent' THEN 'Parent'
                            WHEN 'accountant' THEN 'Accountant'
                            WHEN 'secretary' THEN 'Secretary'
                            WHEN 'superadmin' THEN 'Super Admin'
                            ELSE role
                        END as role_name,
                        COUNT(*) 
                    FROM users_user 
                    WHERE is_online = 1
                    GROUP BY role
                """)
                for row in cursor.fetchall():
                    online_by_role[row[0]] += row[1]
                
                # Get detailed online users
                cursor.execute("""
                    SELECT 
                        id, registration_number, first_name, last_name, 
                        role, last_activity, last_login_ip
                    FROM users_user 
                    WHERE is_online = 1
                    ORDER BY last_activity DESC
                    LIMIT 100
                """)
                for row in cursor.fetchall():
                    role_name = row[4]
                    role_display = {
                        'head': 'Head of School',
                        'hm': 'Head Master',
                        'principal': 'Principal',
                        'vice_principal': 'Vice Principal',
                        'teacher': 'Teacher',
                        'form_teacher': 'Form Teacher',
                        'subject_teacher': 'Subject Teacher',
                        'student': 'Student',
                        'parent': 'Parent',
                        'accountant': 'Accountant',
                        'secretary': 'Secretary',
                        'superadmin': 'Super Admin',
                    }.get(role_name, role_name)
                    
                    online_users.append({
                        'id': row[0],
                        'registration_number': row[1],
                        'name': f"{row[2] or ''} {row[3] or ''}".strip() or 'Unknown',
                        'role': role_display,
                        'last_activity': row[5],
                        'last_login_ip': row[6] or 'Unknown',
                        'school_name': db_name.replace('_db', '').replace('_database', '')
                    })
                
                conn.close()
                
            except Exception as e:
                print(f"[OnlineStatus] Error for {db_name}: {e}")
                import traceback
                traceback.print_exc()
        
        print(f"[OnlineStatus] FINAL - Total: {total_users}, Online: {total_online}")
        
        return Response({
            'success': True,
            'summary': {
                'total_users': total_users,
                'total_online': total_online,
                'total_offline': total_users - total_online,
            },
            'online_by_role': dict(online_by_role),
            'online_users': online_users,
            'timestamp': datetime.now().isoformat()
        })

class OwnerAggregatedLoginAnalyticsView(APIView):
    """Get login analytics from ALL school databases"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School
        
        schools = School.objects.filter(is_archived=False, is_active=True)
        
        today = datetime.now().date()
        today_total = 0
        today_successful = 0
        
        # Initialize daily trends for last 365 days (1 year)
        daily_trends = []
        for i in range(364, -1, -1):
            day = today - timedelta(days=i)
            daily_trends.append({
                'date': day.strftime('%Y-%m-%d'),
                'total': 0,
                'successful': 0,
                'failed': 0
            })
        
        suspicious_users = []
        suspicious_ips_dict = {}
        locked_accounts = []
        
        for school in schools:
            db_path = get_school_db_path(school.school_id)
            if not db_path:
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Check if loginattempt table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_loginattempt'")
                if not cursor.fetchone():
                    conn.close()
                    continue
                
                # Today's stats
                today_str = today.strftime('%Y-%m-%d')
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN was_successful = 1 THEN 1 ELSE 0 END) as successful
                    FROM users_loginattempt 
                    WHERE DATE(attempted_at) = ?
                """, (today_str,))
                row = cursor.fetchone()
                if row and row[0]:
                    today_total += row[0]
                    today_successful += row[1] or 0
                
                # Daily trends for last 365 days
                for trend in daily_trends:
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total,
                            SUM(CASE WHEN was_successful = 1 THEN 1 ELSE 0 END) as successful
                        FROM users_loginattempt 
                        WHERE DATE(attempted_at) = ?
                    """, (trend['date'],))
                    row = cursor.fetchone()
                    if row and row[0]:
                        trend['total'] += row[0]
                        trend['successful'] += row[1] or 0
                        trend['failed'] = trend['total'] - trend['successful']
                
                # Suspicious users (5+ failed attempts)
                cursor.execute("""
                    SELECT 
                        la.registration_number,
                        COUNT(*) as failed_count,
                        MAX(la.attempted_at) as latest_attempt,
                        la.ip_address,
                        u.first_name,
                        u.last_name,
                        u.is_locked
                    FROM users_loginattempt la
                    LEFT JOIN users_user u ON u.registration_number = la.registration_number
                    WHERE la.was_successful = 0
                    GROUP BY la.registration_number
                    HAVING failed_count >= 5
                    ORDER BY failed_count DESC
                """)
                for row in cursor.fetchall():
                    suspicious_users.append({
                        'registration_number': row[0],
                        'failed_count': row[1],
                        'latest_attempt': row[2],
                        'ip_address': row[3] or 'Unknown',
                        'user_name': f"{row[4] or ''} {row[5] or ''}".strip() or 'Unknown',
                        'is_locked': bool(row[6]) if row[6] is not None else False,
                        'school_name': school.name
                    })
                
                # Suspicious IPs
                one_year_ago = (datetime.now() - timedelta(days=365)).isoformat()
                cursor.execute("""
                    SELECT ip_address, COUNT(*) as attempt_count
                    FROM users_loginattempt 
                    WHERE was_successful = 0 AND attempted_at > ? AND ip_address IS NOT NULL AND ip_address != ''
                    GROUP BY ip_address
                    HAVING attempt_count >= 3
                    ORDER BY attempt_count DESC
                    LIMIT 10
                """, (one_year_ago,))
                for row in cursor.fetchall():
                    ip = row[0]
                    if ip not in suspicious_ips_dict:
                        suspicious_ips_dict[ip] = 0
                    suspicious_ips_dict[ip] += row[1]
                
                # Locked accounts
                cursor.execute("""
                    SELECT id, registration_number, first_name, last_name, role, locked_until
                    FROM users_user 
                    WHERE is_locked = 1 AND is_active = 1
                """)
                for row in cursor.fetchall():
                    role_name = row[4]
                    role_display = {
                        'head': 'Head of School',
                        'hm': 'Head Master',
                        'principal': 'Principal',
                    }.get(role_name, role_name)
                    
                    locked_accounts.append({
                        'id': row[0],
                        'registration_number': row[1],
                        'name': f"{row[2] or ''} {row[3] or ''}".strip() or 'Unknown',
                        'role': role_display,
                        'locked_until': row[5],
                        'school_name': school.name
                    })
                
                conn.close()
                
            except Exception as e:
                print(f"Error for {school.name}: {e}")
        
        # Convert suspicious_ips_dict to list
        suspicious_ips = [{'ip_address': ip, 'attempt_count': count} for ip, count in suspicious_ips_dict.items()]
        suspicious_ips = sorted(suspicious_ips, key=lambda x: x['attempt_count'], reverse=True)[:10]
        
        today_failed = today_total - today_successful
        
        return Response({
            'success': True,
            'today_stats': {
                'total_attempts': today_total,
                'successful': today_successful,
                'failed': today_failed,
                'success_rate': round((today_successful / today_total * 100), 2) if today_total > 0 else 0,
            },
            'daily_trends': daily_trends,
            'suspicious_users': suspicious_users,
            'suspicious_ips': suspicious_ips,
            'locked_accounts': locked_accounts,
            'timestamp': datetime.now().isoformat()
        })
         
class OwnerAggregatedActivityLogView(APIView):
    """Get activity logs from ALL school databases"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from schools.models import School
        
        schools = School.objects.filter(is_archived=False, is_active=True)
        
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        activity_type = request.query_params.get('activity_type', '')
        search = request.query_params.get('search', '')
        
        all_activities = []
        type_distribution = defaultdict(int)
        user_activity_count = defaultdict(int)
        
        for school in schools:
            db_path = get_school_db_path(school.school_id)
            if not db_path:
                print(f"Database not found for {school.name}")
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Check if activity table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_activity'")
                if not cursor.fetchone():
                    print(f"No users_activity table in {school.name}")
                    conn.close()
                    continue
                
                # Build query
                query = """
                    SELECT id, activity_type, action, description, user_id, user_name, 
                           user_registration_number, target_type, target_id, target_name,
                           ip_address, user_agent, created_at
                    FROM users_activity
                    WHERE 1=1
                """
                params = []
                
                if activity_type and activity_type != 'all':
                    query += " AND activity_type = ?"
                    params.append(activity_type)
                
                if search:
                    query += " AND (description LIKE ? OR user_name LIKE ? OR action LIKE ?)"
                    search_term = f"%{search}%"
                    params.extend([search_term, search_term, search_term])
                
                query += " ORDER BY created_at DESC LIMIT 200"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                print(f"{school.name}: found {len(rows)} activities")
                
                for row in rows:
                    all_activities.append({
                        'id': row[0],
                        'activity_type': row[1] or 'system',
                        'action': row[2],
                        'description': row[3],
                        'user_id': row[4],
                        'user_name': row[5] or 'System',
                        'registration_number': row[6],
                        'target_type': row[7],
                        'target_id': row[8],
                        'target_name': row[9],
                        'ip_address': row[10],
                        'user_agent': row[11],
                        'created_at': row[12],
                        'school_name': school.name
                    })
                    
                    # Count for type distribution
                    act_type = row[1] or 'system'
                    type_distribution[act_type] += 1
                    
                    # Count for user leaders
                    user_key = row[6] or row[5] or 'system'
                    user_activity_count[user_key] += 1
                
                conn.close()
                
            except Exception as e:
                print(f"Error for {school.name}: {e}")
                import traceback
                traceback.print_exc()
        
        # Sort by created_at (newest first)
        all_activities.sort(key=lambda x: x['created_at'] or '', reverse=True)
        
        total = len(all_activities)
        paginated_activities = all_activities[offset:offset + limit]
        
        # Get top 10 type distribution
        type_list = [
            {'activity_type': k, 'count': v}
            for k, v in sorted(type_distribution.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Get top 10 users
        user_leaders = [
            {'user__registration_number': k, 'user__name': k, 'activity_count': v}
            for k, v in sorted(user_activity_count.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        return Response({
            'success': True,
            'activities': paginated_activities,
            'total': total,
            'limit': limit,
            'offset': offset,
            'summary': {
                'type_distribution': type_list,
                'user_leaders': user_leaders
            },
            'timestamp': datetime.now().isoformat()
        })

class OwnerLockUserView(APIView):
    """Lock a user across ALL school databases"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        registration_number = request.data.get('registration_number')
        
        if not registration_number:
            return Response({'error': 'registration_number required'}, status=400)
        
        from schools.models import School
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        schools = School.objects.filter(is_archived=False, is_active=True)
        
        locked_schools = []
        for school in schools:
            db_path = MAIN_BACKEND_DIR / f"{school.school_id}.sqlite3"
            if not db_path.exists():
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                locked_until = (datetime.now() + timedelta(hours=24)).isoformat()
                cursor.execute("""
                    UPDATE users_user 
                    SET is_locked = 1, locked_until = ?, failed_login_attempts = 0
                    WHERE registration_number = ?
                """, (locked_until, registration_number))
                
                if cursor.rowcount > 0:
                    locked_schools.append(school.name)
                
                conn.commit()
                conn.close()
                
            except Exception as e:
                print(f"Error locking user in {school.name}: {e}")
        
        return Response({
            'success': True,
            'message': f'User {registration_number} locked in {len(locked_schools)} schools',
            'locked_schools': locked_schools
        })


class OwnerUnlockUserView(APIView):
    """Unlock a user across ALL school databases"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        registration_number = request.data.get('registration_number')
        
        if not registration_number:
            return Response({'error': 'registration_number required'}, status=400)
        
        from schools.models import School
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        schools = School.objects.filter(is_archived=False, is_active=True)
        
        unlocked_schools = []
        for school in schools:
            db_path = MAIN_BACKEND_DIR / f"{school.school_id}.sqlite3"
            if not db_path.exists():
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                cursor.execute("""
                    UPDATE users_user 
                    SET is_locked = 0, locked_until = NULL, failed_login_attempts = 0
                    WHERE registration_number = ?
                """, (registration_number,))
                
                if cursor.rowcount > 0:
                    unlocked_schools.append(school.name)
                
                conn.commit()
                conn.close()
                
            except Exception as e:
                print(f"Error unlocking user in {school.name}: {e}")
        
        return Response({
            'success': True,
            'message': f'User {registration_number} unlocked in {len(unlocked_schools)} schools',
            'unlocked_schools': unlocked_schools
        })


class OwnerForceLogoutAllView(APIView):
    """Force logout ALL users across ALL school databases"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from schools.models import School
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        schools = School.objects.filter(is_archived=False, is_active=True)
        
        total_affected = 0
        for school in schools:
            db_path = MAIN_BACKEND_DIR / f"{school.school_id}.sqlite3"
            if not db_path.exists():
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                cursor.execute("""
                    UPDATE users_user 
                    SET is_online = 0, last_activity = CURRENT_TIMESTAMP
                    WHERE is_online = 1
                """)
                affected = cursor.rowcount
                total_affected += affected
                
                conn.commit()
                conn.close()
                
            except Exception as e:
                print(f"Error force logout in {school.name}: {e}")
        
        return Response({
            'success': True,
            'message': f'Successfully logged out {total_affected} users across all schools',
            'users_affected': total_affected
        })


class OwnerForceLogoutUserView(APIView):
    """Force logout a specific user across ALL school databases"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        registration_number = request.data.get('registration_number')
        
        if not registration_number:
            return Response({'error': 'registration_number required'}, status=400)
        
        from schools.models import School
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        schools = School.objects.filter(is_archived=False, is_active=True)
        
        logged_out_schools = []
        for school in schools:
            db_path = MAIN_BACKEND_DIR / f"{school.school_id}.sqlite3"
            if not db_path.exists():
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                cursor.execute("""
                    UPDATE users_user 
                    SET is_online = 0, last_activity = CURRENT_TIMESTAMP
                    WHERE registration_number = ? AND is_online = 1
                """, (registration_number,))
                
                if cursor.rowcount > 0:
                    logged_out_schools.append(school.name)
                
                conn.commit()
                conn.close()
                
            except Exception as e:
                print(f"Error force logout user in {school.name}: {e}")
        
        return Response({
            'success': True,
            'message': f'User {registration_number} logged out from {len(logged_out_schools)} schools',
            'logged_out_schools': logged_out_schools
        })
        
        
class OwnerSyncActivityView(APIView):
    """Receive activity data from school backends"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Verify secret
        secret = request.data.get('secret')
        expected_secret = getattr(settings, 'OWNER_API_SECRET', '')
        
        if secret != expected_secret:
            return Response({'error': 'Invalid secret'}, status=403)
        
        school_id = request.data.get('school_id')
        school_name = request.data.get('school_name')
        activity = request.data.get('activity', {})
        
        from schools.models import School, ActivityLog, LoginAttempt, UserSession
        
        # Find or create school
        school = School.objects.filter(school_id=school_id).first()
        
        # Store activity in owner panel's ActivityLog
        ActivityLog.objects.create(
            school=school,
            action=activity.get('action', 'unknown'),
            description=activity.get('description', ''),
            user=activity.get('user_name', 'System'),
            user_registration_number=activity.get('registration_number', ''),
            user_role=activity.get('user_role', ''),
            ip_address=activity.get('ip_address', ''),
            created_at=activity.get('created_at', timezone.now()),
            metadata=activity.get('metadata', {})
        )
        
        return Response({'success': True})
    
    
class OwnerSyncAllActivitiesView(APIView):
    """Sync all activities from all school databases to owner panel"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from schools.models import School, ActivityLog
        from django.utils import timezone
        
        MAIN_BACKEND_DIR = Path("C:/Users/hp/Desktop/EDUFLOW BASIC/Eduflow Backend")
        synced_count = 0
        
        for db_path in MAIN_BACKEND_DIR.glob("*.sqlite3"):
            db_name = db_path.stem
            school = School.objects.filter(school_id=db_name.replace('_db', '')).first()
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Check if activity table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users_activity'")
                if not cursor.fetchone():
                    conn.close()
                    continue
                
                # Get all activities not yet synced
                cursor.execute("""
                    SELECT id, activity_type, action, description, user_name, 
                           user_registration_number, ip_address, created_at
                    FROM users_activity
                    ORDER BY created_at DESC
                """)
                
                for row in cursor.fetchall():
                    # Check if already exists
                    exists = ActivityLog.objects.filter(
                        school=school,
                        action=row[2],
                        description=row[3],
                        created_at=row[7]
                    ).exists()
                    
                    if not exists:
                        ActivityLog.objects.create(
                            school=school,
                            action=row[2] or 'unknown',
                            description=row[3] or '',
                            user=row[4] or 'System',
                            user_registration_number=row[5] or '',
                            ip_address=row[6] or '',
                            created_at=datetime.fromisoformat(row[7]) if row[7] else timezone.now(),
                            metadata={'original_id': row[0], 'activity_type': row[1]}
                        )
                        synced_count += 1
                
                conn.close()
                print(f"Synced {synced_count} activities from {db_name}")
                
            except Exception as e:
                print(f"Error syncing {db_name}: {e}")
        
        return Response({
            'success': True,
            'message': f'Successfully synced {synced_count} activities',
            'synced_count': synced_count
        })
class OwnerSyncActivityWebhookView(APIView):
    """Webhook endpoint to receive activities from school backends"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        secret = request.data.get('secret')
        expected_secret = getattr(settings, 'OWNER_API_SECRET', '')
        
        if secret != expected_secret:
            return Response({'error': 'Invalid secret'}, status=403)
        
        school_id = request.data.get('school_id')
        activity = request.data.get('activity', {})
        
        from schools.models import School, ActivityLog
        
        school = School.objects.filter(school_id=school_id).first()
        
        ActivityLog.objects.create(
            school=school,
            action=activity.get('action', 'unknown'),
            description=activity.get('description', ''),
            user=activity.get('user_name', 'System'),
            user_registration_number=activity.get('registration_number', ''),
            ip_address=activity.get('ip_address', ''),
            created_at=activity.get('created_at'),
            metadata=activity.get('metadata', {})
        )
        
        return Response({'success': True})