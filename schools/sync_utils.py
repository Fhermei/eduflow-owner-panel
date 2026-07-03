# owner_panel/schools/sync_utils.py
import requests
import logging
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
from .models import School, SchoolMetric

logger = logging.getLogger(__name__)


def sync_all_schools():
    """Sync metrics for all schools by calling their APIs"""
    schools = School.objects.filter(is_archived=False)
    results = []
    
    for school in schools:
        result = sync_school_metrics_from_api(school)
        results.append({
            'school': school.name,
            'success': result,
            'api_url': school.api_url
        })
    
    return results


def sync_school_metrics_from_api(school):
    """
    Sync metrics by calling the school's API endpoint.
    Uses endpoints that actually exist in EduFlow Backend.
    """
    try:
        api_url = school.api_url.rstrip('/')
        
        if not api_url:
            print(f"No API URL for {school.name}")
            return False
        
        owner_secret = getattr(settings, 'OWNER_API_SECRET', '')
        
        print(f"Syncing {school.name} from API: {api_url}")
        
        # First, try to get school info
        school_info = None
        stats_data = None
        
        # Try /api/school/info/ - this exists in your EduFlow Backend
        try:
            print(f"  Trying: {api_url}/api/school/info/")
            response = requests.get(
                f"{api_url}/api/school/info/",
                headers={
                    'Content-Type': 'application/json',
                    'X-Owner-Secret': owner_secret,
                    'X-School-ID': school.school_id,
                },
                timeout=10
            )
            if response.status_code == 200:
                school_info = response.json()
                print(f"  ✅ Got school info")
            else:
                print(f"  ❌ /api/school/info/ returned {response.status_code}")
        except Exception as e:
            print(f"  ❌ /api/school/info/ error: {e}")
        
        # Try the owner-stats endpoint (might exist in some versions)
        try:
            print(f"  Trying: {api_url}/api/owner-stats/")
            response = requests.get(
                f"{api_url}/api/owner-stats/",
                headers={
                    'Content-Type': 'application/json',
                    'X-Owner-Secret': owner_secret,
                    'X-School-ID': school.school_id,
                },
                timeout=10
            )
            if response.status_code == 200:
                stats_data = response.json()
                print(f"  ✅ Got owner stats")
            else:
                print(f"  ❌ /api/owner-stats/ returned {response.status_code}")
        except Exception as e:
            print(f"  ❌ /api/owner-stats/ error: {e}")
        
        # If we got school info, extract data from it
        if school_info and school_info.get('success'):
            school_data = school_info.get('school', {})
            metrics_data = {
                'total_users': 0,
                'active_users': 0,
                'total_students': 0,
                'active_students': 0,
                'total_staff': 0,
                'active_staff': 0,
                'total_parents': 0,
                'total_admins': 0,
                'role_breakdown': {},
                'total_revenue': 0,
                'school_fee_revenue': 0,
                'portal_revenue': 0,
                'portal_paid_count': 0,
            }
            
            # Extract what we can from school info
            # If the school info doesn't have metrics, try to get them separately
            if 'metrics' in school_data:
                metrics_data['total_users'] = school_data.get('metrics', {}).get('total_users', 0)
                metrics_data['total_students'] = school_data.get('metrics', {}).get('total_students', 0)
                metrics_data['total_staff'] = school_data.get('metrics', {}).get('total_staff', 0)
                metrics_data['total_revenue'] = school_data.get('metrics', {}).get('total_revenue', 0)
        
        # If we got owner-stats, use that data
        if stats_data and stats_data.get('success'):
            summary = stats_data.get('summary', {})
            metrics_data = {
                'total_users': summary.get('total_users', 0),
                'active_users': summary.get('active_users', 0),
                'total_students': summary.get('total_students', 0),
                'active_students': summary.get('active_students', 0),
                'total_staff': summary.get('total_staff', 0),
                'active_staff': summary.get('active_staff', 0),
                'total_parents': summary.get('total_parents', 0),
                'total_admins': summary.get('total_admins', 0),
                'role_breakdown': summary.get('role_breakdown', {}),
                'total_revenue': summary.get('total_revenue', 0),
                'school_fee_revenue': summary.get('school_fee_revenue', 0),
                'portal_revenue': summary.get('portal_revenue', 0),
                'portal_paid_count': summary.get('portal_paid_count', 0),
            }
        
        # If we got nothing, try to get stats from a direct database query
        if not school_info and not stats_data:
            print(f"  Trying direct stats query...")
            # Try to get user count directly
            try:
                response = requests.get(
                    f"{api_url}/api/users/count/",
                    headers={
                        'Content-Type': 'application/json',
                        'X-Owner-Secret': owner_secret,
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    user_data = response.json()
                    metrics_data = {
                        'total_users': user_data.get('total', 0),
                        'active_users': user_data.get('active', 0),
                        'total_students': user_data.get('students', 0),
                        'active_students': 0,
                        'total_staff': user_data.get('staff', 0),
                        'active_staff': 0,
                        'total_parents': user_data.get('parents', 0),
                        'total_admins': user_data.get('admins', 0),
                        'role_breakdown': user_data.get('role_breakdown', {}),
                        'total_revenue': user_data.get('total_revenue', 0),
                        'school_fee_revenue': 0,
                        'portal_revenue': 0,
                        'portal_paid_count': 0,
                    }
                    print(f"  ✅ Got user counts")
            except Exception as e:
                print(f"  ❌ Direct stats query error: {e}")
        
        # If we still have no data, try the owner-stats-all endpoint
        if not school_info and not stats_data:
            try:
                print(f"  Trying: {api_url}/api/owner-stats-all/")
                response = requests.get(
                    f"{api_url}/api/owner-stats-all/",
                    headers={
                        'Content-Type': 'application/json',
                        'X-Owner-Secret': owner_secret,
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    metrics_data = {
                        'total_users': data.get('total_users', 0),
                        'active_users': data.get('active_users', 0),
                        'total_students': data.get('total_students', 0),
                        'active_students': data.get('active_students', 0),
                        'total_staff': data.get('total_staff', 0),
                        'active_staff': data.get('active_staff', 0),
                        'total_parents': data.get('total_parents', 0),
                        'total_admins': data.get('total_admins', 0),
                        'role_breakdown': data.get('role_breakdown', {}),
                        'total_revenue': data.get('total_revenue', 0),
                        'school_fee_revenue': data.get('school_fee_revenue', 0),
                        'portal_revenue': data.get('portal_revenue', 0),
                        'portal_paid_count': data.get('portal_paid_count', 0),
                    }
                    print(f"  ✅ Got stats from owner-stats-all")
            except Exception as e:
                print(f"  ❌ /api/owner-stats-all/ error: {e}")
        
        # Check if we have any metrics
        if 'metrics_data' not in locals():
            print(f"❌ No data found for {school.name}")
            update_metric_down(school, "No data available from any endpoint")
            return False
        
        print(f"📊 Extracted: {metrics_data.get('total_users', 0)} users, {metrics_data.get('total_students', 0)} students for {school.name}")
        
        # Update or create metrics
        metric, created = SchoolMetric.objects.get_or_create(school=school)
        metric.total_users = metrics_data.get('total_users', 0)
        metric.active_users = metrics_data.get('active_users', 0)
        metric.total_students = metrics_data.get('total_students', 0)
        metric.active_students = metrics_data.get('active_students', 0)
        metric.total_staff = metrics_data.get('total_staff', 0)
        metric.active_staff = metrics_data.get('active_staff', 0)
        metric.total_parents = metrics_data.get('total_parents', 0)
        metric.total_admins = metrics_data.get('total_admins', 0)
        metric.role_breakdown = metrics_data.get('role_breakdown', {})
        metric.school_fee_revenue = Decimal(str(metrics_data.get('school_fee_revenue', 0)))
        metric.portal_revenue = Decimal(str(metrics_data.get('portal_revenue', 0)))
        metric.total_revenue = Decimal(str(metrics_data.get('total_revenue', 0)))
        metric.portal_paid_count = metrics_data.get('portal_paid_count', 0)
        metric.health_status = 'healthy' if metrics_data.get('total_users', 0) > 0 else 'unknown'
        metric.last_health_check = timezone.now()
        metric.error_message = ''
        metric.save()
        
        school.last_sync_at = timezone.now()
        school.save()
        
        print(f"✅ Synced {school.name} successfully!")
        return True
        
    except requests.exceptions.ConnectionError:
        error_msg = f"Cannot connect to {school.api_url}"
        print(f"❌ Connection error for {school.name}: {error_msg}")
        update_metric_down(school, error_msg)
        return False
        
    except requests.exceptions.Timeout:
        error_msg = f"Timeout connecting to {school.api_url}"
        print(f"❌ Timeout error for {school.name}: {error_msg}")
        update_metric_down(school, error_msg)
        return False
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error syncing {school.name}: {error_msg}")
        import traceback
        traceback.print_exc()
        update_metric_down(school, error_msg)
        return False


def update_metric_down(school, error_message):
    """Update metric to show school is down"""
    try:
        metric, created = SchoolMetric.objects.get_or_create(school=school)
        metric.health_status = 'down'
        metric.error_message = error_message[:500]
        metric.last_health_check = timezone.now()
        metric.save()
    except Exception as e:
        logger.error(f"Error updating metric for {school.name}: {e}")