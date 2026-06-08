# owner_panel/schools/management/commands/init_schools.py
from django.core.management.base import BaseCommand
from django.conf import settings
from schools.models import School
import os

class Command(BaseCommand):
    help = 'Initialize schools from settings'

    def handle(self, *args, **options):
        self.stdout.write("=" * 50)
        self.stdout.write("Initializing Schools...")
        self.stdout.write("=" * 50)
        
        # Define schools manually (hardcoded for now)
        schools_data = [
            {
                'school_id': 'school_a',
                'name': 'Concord Tutors School',
                'db_name': 'school_a_db',
                'api_url': 'http://localhost:8000',
                'registration_prefix': 'CTS',
                'is_active': True,
                'is_archived': False,
            },
            {
                'school_id': 'school_b',
                'name': 'Bright Future Academy',
                'db_name': 'school_b_db',
                'api_url': 'http://localhost:8001',
                'registration_prefix': 'BRIGHT',
                'is_active': True,
                'is_archived': False,
            },
            {
                'school_id': 'school_c',
                'name': 'Kings College Lagos',
                'db_name': 'school_c_db',
                'api_url': 'http://localhost:8002',
                'registration_prefix': 'PRIME',
                'is_active': True,
                'is_archived': False,
            },
            {
                'school_id': 'floor',
                'name': 'Floor Academy',
                'db_name': 'floor_db',
                'api_url': 'http://localhost:8003',
                'registration_prefix': 'FLOOR',
                'is_active': True,
                'is_archived': False,
            },
        ]
        
        # Clear existing schools
        deleted_count = School.objects.all().delete()[0]
        self.stdout.write(f"Deleted {deleted_count} existing schools")
        
        # Create new schools
        created_count = 0
        for school_data in schools_data:
            school, created = School.objects.get_or_create(
                school_id=school_data['school_id'],
                defaults=school_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"✓ Created: {school.school_id} - {school.name}"))
            else:
                # Update existing
                for key, value in school_data.items():
                    setattr(school, key, value)
                school.save()
                self.stdout.write(f"✓ Updated: {school.school_id} - {school.name}")
        
        self.stdout.write("=" * 50)
        self.stdout.write(self.style.SUCCESS(f"Success! {created_count} schools created"))
        self.stdout.write("=" * 50)
        
        # List all schools
        self.stdout.write("\nCurrent schools in database:")
        for school in School.objects.all():
            self.stdout.write(f"  - {school.school_id}: {school.name} ({school.api_url})")