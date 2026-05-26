"""
Sync utilities for school metrics
"""

import requests
import time
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def sync_school_metrics(school):
    """Sync metrics from school API to local cache"""
    secret = getattr(settings, 'OWNER_API_SECRET', '')
    
    # Use the simple stats endpoint with query parameters
    stats_url = f"{school.api_url}/api/simple-stats/?school_id={school.school_id}&secret={secret}"
    
    start_time = time.time()
    
    # Get or create metric
    from .models import SchoolMetric
    metric, created = SchoolMetric.objects.get_or_create(school=school)
    
    try:
        response = requests.get(stats_url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            stats = data.get('stats', {})
            
            # Update metric with stats
            metric.total_users = stats.get('total_users', 0)
            metric.active_users = stats.get('active_users', 0)
            metric.total_students = stats.get('total_students', 0)
            metric.active_students = stats.get('active_students', 0)
            metric.total_staff = stats.get('total_staff', 0)
            metric.active_staff = stats.get('active_staff', 0)
            metric.total_parents = stats.get('total_parents', 0)
            
            metric.total_revenue = Decimal(str(stats.get('total_revenue', 0)))
            metric.portal_revenue = Decimal(str(stats.get('portal_revenue', 0)))
            
            metric.health_status = 'healthy'
            metric.response_time_ms = (time.time() - start_time) * 1000
            metric.error_message = ""
            
        else:
            metric.error_message = f"API error: HTTP {response.status_code}"
            metric.health_status = 'down'
        
        metric.last_health_check = timezone.now()
        metric.save()
        
        school.last_sync_at = timezone.now()
        school.save(update_fields=['last_sync_at'])
        
        return True
        
    except requests.RequestException as e:
        metric.health_status = 'down'
        metric.error_message = str(e)
        metric.last_health_check = timezone.now()
        metric.save()
        return False
    except Exception as e:
        metric.health_status = 'down'
        metric.error_message = str(e)
        metric.last_health_check = timezone.now()
        metric.save()
        return False