import requests
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from schools.models import School, ActivityLog


class Command(BaseCommand):
    help = 'Sync all activities from schools via API'

    def handle(self, *args, **options):
        self.stdout.write("=" * 50)
        self.stdout.write("Syncing activities from schools via API...")
        self.stdout.write("=" * 50)
        
        schools = School.objects.filter(is_archived=False)
        owner_secret = getattr(settings, 'OWNER_API_SECRET', '')
        total_synced = 0
        
        for school in schools:
            try:
                api_url = school.api_url.rstrip('/')
                
                # Get activities from school API
                response = requests.get(
                    f"{api_url}/api/activity-logs/",
                    headers={
                        'Content-Type': 'application/json',
                        'X-Owner-Secret': owner_secret,
                        'X-School-ID': school.school_id,
                    },
                    timeout=30
                )
                
                if response.status_code != 200:
                    self.stdout.write(f"Failed to get activities from {school.name}")
                    continue
                
                data = response.json()
                activities = data.get('activities', [])
                
                synced_count = 0
                for activity in activities:
                    # Check if already exists
                    exists = ActivityLog.objects.filter(
                        school=school,
                        action=activity.get('action', ''),
                        description=activity.get('description', ''),
                        created_at=datetime.fromisoformat(activity.get('created_at')) if activity.get('created_at') else None
                    ).exists()
                    
                    if not exists:
                        ActivityLog.objects.create(
                            school=school,
                            action=activity.get('action', ''),
                            description=activity.get('description', ''),
                            user=activity.get('user_name', 'System'),
                            user_registration_number=activity.get('user_registration_number', ''),
                            ip_address=activity.get('ip_address', ''),
                            created_at=datetime.fromisoformat(activity.get('created_at')) if activity.get('created_at') else timezone.now(),
                            metadata=activity.get('metadata', {})
                        )
                        synced_count += 1
                
                total_synced += synced_count
                self.stdout.write(f"Synced {synced_count} activities from {school.name}")
                
            except Exception as e:
                self.stdout.write(f"Error syncing {school.name}: {e}")
        
        self.stdout.write("=" * 50)
        self.stdout.write(self.style.SUCCESS(f"Total activities synced: {total_synced}"))
        self.stdout.write("=" * 50)