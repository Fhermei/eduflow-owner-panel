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
    Uses the correct endpoints that exist in EduFlow Backend.
    """
    try:
        api_url = school.api_url.rstrip('/')
        
        if not api_url:
            print(f"No API URL for {school.name}")
            return False
        
        owner_secret = getattr(settings, 'OWNER_API_SECRET', '')
        
        print(f"Syncing {school.name} from API: {api_url}")
        
        # Try the correct endpoints that exist in EduFlow Backend
        # These are from the EduFlow Backend urls.py
        endpoints_to_try = [
            '/api/owner-stats/',      # This exists in EduFlow Backend
            '/api/owner-health/',     # This exists in EduFlow Backend
            '/api/simple-stats/',     # This exists in EduFlow Backend
            '/api/owner-stats/all/',  # Alternative
        ]
        
        data = None
        success = False
        
        for endpoint in endpoints_to_try:
            try:
                print(f"  Trying: {api_url}{endpoint}")
                response = requests.get(
                    f"{api_url}{endpoint}",
                    headers={
                        'Content-Type': 'application/json',
                        'X-Owner-Secret': owner_secret,
                        'X-School-ID': school.school_id,
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    success = True
                    print(f"  ✅ Success with {endpoint}")
                    break
                else:
                    print(f"  ❌ {endpoint} returned {response.status_code}")
            except Exception as e:
                print(f"  ❌ {endpoint} error: {e}")
                continue
        
        if not success or not data:
            print(f"❌ Could not get stats for {school.name} from any endpoint")
            # Set school as down but keep existing metrics
            update_metric_down(school, "No API endpoint available")
            return False
        
        print(f"✅ Response data: {data}")
        
        # Extract metrics - handle different response formats
        # Check if data is wrapped in a 'success' key or directly has the data
        if isinstance(data, dict):
            # Try to find the data in the response
            if 'stats' in data:
                stats_data = data['stats']
            elif 'data' in data:
                stats_data = data['data']
            elif 'summary' in data:
                stats_data = data['summary']
            else:
                stats_data = data
        
        # Extract metrics with fallbacks
        metrics_data = {
            'total_users': stats_data.get('total_users', 0) if isinstance(stats_data, dict) else 0,
            'active_users': stats_data.get('active_users', 0) if isinstance(stats_data, dict) else 0,
            'total_students': stats_data.get('total_students', 0) if isinstance(stats_data, dict) else 0,
            'active_students': stats_data.get('active_students', 0) if isinstance(stats_data, dict) else 0,
            'total_staff': stats_data.get('total_staff', 0) if isinstance(stats_data, dict) else 0,
            'active_staff': stats_data.get('active_staff', 0) if isinstance(stats_data, dict) else 0,
            'total_parents': stats_data.get('total_parents', 0) if isinstance(stats_data, dict) else 0,
            'total_admins': stats_data.get('total_admins', 0) if isinstance(stats_data, dict) else 0,
            'role_breakdown': stats_data.get('role_breakdown', {}) if isinstance(stats_data, dict) else {},
            'total_revenue': stats_data.get('total_revenue', 0) if isinstance(stats_data, dict) else 0,
            'school_fee_revenue': stats_data.get('school_fee_revenue', 0) if isinstance(stats_data, dict) else 0,
            'portal_revenue': stats_data.get('portal_revenue', 0) if isinstance(stats_data, dict) else 0,
            'portal_paid_count': stats_data.get('portal_paid_count', 0) if isinstance(stats_data, dict) else 0,
        }
        
        print(f"📊 Extracted: {metrics_data['total_users']} users, {metrics_data['total_students']} students for {school.name}")
        
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
        metric.health_status = 'healthy' if metrics_data['total_users'] > 0 else 'unknown'
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