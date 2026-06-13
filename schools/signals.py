from django.db.models.signals import post_save
from django.dispatch import receiver
import requests
from django.conf import settings
import json

def send_activity_to_owner_panel(activity_data, school_id, school_name):
    """Send activity data to owner panel for storage"""
    owner_url = getattr(settings, 'OWNER_PANEL_URL', 'http://localhost:8005')
    owner_secret = getattr(settings, 'OWNER_API_SECRET', '')
    
    try:
        response = requests.post(
            f"{owner_url}/api/owner/sync-activity/",
            json={
                'secret': owner_secret,
                'school_id': school_id,
                'school_name': school_name,
                'activity': activity_data
            },
            timeout=10
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to send activity to owner panel: {e}")
        return False