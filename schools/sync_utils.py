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


# owner_panel/schools/sync_utils.py

def sync_school_metrics_from_api(school):
    try:
        api_url = school.api_url.rstrip('/')
        
        if not api_url:
            print(f"No API URL for {school.name}")
            return False
        
        owner_secret = getattr(settings, 'OWNER_API_SECRET', '')
        
        print(f"Syncing {school.name} from API: {api_url}")
        
        endpoint = '/api/owner-stats/'
        
        try:
            print(f"  Calling: {api_url}{endpoint}")
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
                print(f"  Success! Got data")
            else:
                print(f"  {endpoint} returned {response.status_code}")
                print(f"     Response: {response.text[:200]}")
                update_metric_down(school, f"API returned {response.status_code}")
                return False
                
        except Exception as e:
            print(f"  Error: {e}")
            update_metric_down(school, str(e))
            return False
        
        # Extract metrics from the response
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
        
        print(f"Extracted: {metrics_data['total_users']} users, {metrics_data['total_students']} students for {school.name}")
        
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
        
        print(f"Synced {school.name} successfully!")
        return True
        
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