# owner_panel/schools/management/commands/sync_schools.py
from django.core.management.base import BaseCommand
from decouple import config
from schools.models import School

class Command(BaseCommand):
    help = 'Sync schools from .env to database'

    def handle(self, *args, **options):
        self.stdout.write("Syncing schools from .env...")
        
        # Get school IDs from .env
        school_ids = config('SCHOOL_IDS', default='').split(',')
        
        self.stdout.write(f"SCHOOL_IDS from .env: {school_ids}")
        
        # Delete all existing schools
        School.objects.all().delete()
        self.stdout.write("Cleared existing schools")
        
        # Create schools
        created_count = 0
        for idx, school_id in enumerate(school_ids):
            school_id = school_id.strip()
            if not school_id:
                continue
            
            upper_id = school_id.upper()
            school_name = config(f'{upper_id}_NAME', default=school_id.title())
            db_name = config(f'{upper_id}_DB_NAME', default=f'{school_id}_db')
            api_url = config(f'{upper_id}_API_URL', default=f'http://localhost:{8000 + idx}')
            registration_prefix = config(f'{upper_id}_REGISTRATION_PREFIX', default=school_id.upper()[:4])
            
            school = School.objects.create(
                school_id=school_id,
                name=school_name,
                db_name=db_name,
                api_url=api_url,
                registration_prefix=registration_prefix,
                is_active=True,
                is_archived=False
            )
            created_count += 1
            self.stdout.write(f"✓ Created: {school_id} - {school_name}")
        
        self.stdout.write(self.style.SUCCESS(f"Successfully synced {created_count} schools"))