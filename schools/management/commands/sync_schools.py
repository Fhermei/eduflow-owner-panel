# owner_panel/schools/management/commands/sync_schools.py
from django.core.management.base import BaseCommand
from decouple import config
from schools.models import School


class Command(BaseCommand):
    help = 'Sync schools from .env to database (no hardcoding)'

    def handle(self, *args, **options):
        self.stdout.write("=" * 50)
        self.stdout.write("Syncing schools from .env...")
        self.stdout.write("=" * 50)
        
        # Get school IDs from .env
        school_ids = config('SCHOOL_IDS', default='').split(',')
        
        self.stdout.write(f"SCHOOL_IDS from .env: {school_ids}")
        
        if not school_ids or school_ids == ['']:
            self.stdout.write(self.style.ERROR("No SCHOOL_IDS found in .env"))
            self.stdout.write("Please add SCHOOL_IDS=school_a,school_b to your .env")
            return
        
        # Clear existing schools
        deleted_count = School.objects.all().delete()[0]
        self.stdout.write(f"Deleted {deleted_count} existing schools")
        
        # Create or update schools from .env
        created_count = 0
        for idx, school_id in enumerate(school_ids):
            school_id = school_id.strip()
            if not school_id:
                continue
            
            upper_id = school_id.upper()
            
            # Read all school settings from .env
            school_name = config(f'{upper_id}_NAME', default=school_id.title())
            db_name = config(f'{upper_id}_DB_NAME', default=f'{school_id}_db')
            api_url = config(f'{upper_id}_API_URL', default=f'http://localhost:{8000 + idx}')
            registration_prefix = config(f'{upper_id}_REGISTRATION_PREFIX', default=school_id.upper()[:4])
            paystack_public_key = config(f'{upper_id}_PAYSTACK_PUBLIC_KEY', default='')
            paystack_secret_key = config(f'{upper_id}_PAYSTACK_SECRET_KEY', default='')
            contact_email = config(f'{upper_id}_EMAIL', default='')
            contact_phone = config(f'{upper_id}_PHONE', default='')
            address = config(f'{upper_id}_ADDRESS', default='')
            
            # Check if school already exists
            school, created = School.objects.get_or_create(
                school_id=school_id,
                defaults={
                    'name': school_name,
                    'db_name': db_name,
                    'api_url': api_url,
                    'registration_prefix': registration_prefix,
                    'paystack_public_key': paystack_public_key,
                    'paystack_secret_key': paystack_secret_key,
                    'contact_email': contact_email,
                    'contact_phone': contact_phone,
                    'address': address,
                    'is_active': True,
                    'is_archived': False,
                }
            )
            
            if not created:
                # Update existing school
                school.name = school_name
                school.db_name = db_name
                school.api_url = api_url
                school.registration_prefix = registration_prefix
                school.paystack_public_key = paystack_public_key
                school.paystack_secret_key = paystack_secret_key
                school.contact_email = contact_email
                school.contact_phone = contact_phone
                school.address = address
                school.is_active = True
                school.is_archived = False
                school.save()
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created: {school_id} - {school_name}"))
            else:
                self.stdout.write(f"Updated: {school_id} - {school_name}")
            
            self.stdout.write(f"  API URL: {api_url}")
            self.stdout.write(f"  Prefix: {registration_prefix}")
        
        self.stdout.write("=" * 50)
        self.stdout.write(self.style.SUCCESS(f"Success! Synced schools from .env"))
        self.stdout.write("=" * 50)
        
        # List all schools
        self.stdout.write("")
        self.stdout.write("Current schools in database:")
        for school in School.objects.all():
            self.stdout.write(f"  - {school.school_id}: {school.name} ({school.api_url})")