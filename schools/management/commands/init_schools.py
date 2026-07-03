# owner_panel/schools/management/commands/init_schools.py
from django.core.management.base import BaseCommand
from decouple import config
from schools.models import School


class Command(BaseCommand):
    help = 'Initialize schools from .env file (supports 1000+ schools)'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("Initializing Schools from .env...")
        self.stdout.write("=" * 60)
        
        # Get ALL school IDs from .env
        school_ids = config('SCHOOL_IDS', default='').split(',')
        school_ids = [s.strip() for s in school_ids if s.strip()]
        
        self.stdout.write(f"Found {len(school_ids)} schools in .env: {school_ids}")
        
        if not school_ids:
            self.stdout.write(self.style.ERROR("No SCHOOL_IDS found in .env"))
            self.stdout.write("Please add SCHOOL_IDS=school_a,school_b to your .env")
            return
        
        # Clear existing schools
        deleted_count = School.objects.all().delete()[0]
        self.stdout.write(f"Deleted {deleted_count} existing schools")
        
        # Create schools from .env
        created_count = 0
        for school_id in school_ids:
            upper_id = school_id.upper()
            
            # Read ALL settings for this school from .env
            school_name = config(f'{upper_id}_NAME', default=school_id.title())
            db_name = config(f'{upper_id}_DB_NAME', default=f'{school_id}_db')
            api_url = config(f'{upper_id}_API_URL', default='')
            registration_prefix = config(f'{upper_id}_REGISTRATION_PREFIX', default=school_id.upper()[:4])
            paystack_public_key = config(f'{upper_id}_PAYSTACK_PUBLIC_KEY', default='')
            paystack_secret_key = config(f'{upper_id}_PAYSTACK_SECRET_KEY', default='')
            contact_email = config(f'{upper_id}_EMAIL', default='')
            contact_phone = config(f'{upper_id}_PHONE', default='')
            address = config(f'{upper_id}_ADDRESS', default='')
            website = config(f'{upper_id}_WEBSITE', default='')
            motto = config(f'{upper_id}_MOTTO', default='')
            
            # Create school
            school = School.objects.create(
                school_id=school_id,
                name=school_name,
                db_name=db_name,
                api_url=api_url,
                registration_prefix=registration_prefix,
                paystack_public_key=paystack_public_key,
                paystack_secret_key=paystack_secret_key,
                contact_email=contact_email,
                contact_phone=contact_phone,
                address=address,
                is_active=True,
                is_archived=False
            )
            created_count += 1
            self.stdout.write(self.style.SUCCESS(f"Created: {school_id} - {school_name}"))
            self.stdout.write(f"  API URL: {api_url}")
            self.stdout.write(f"  Prefix: {registration_prefix}")
        
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS(f"Success! {created_count} schools created from .env"))
        self.stdout.write("=" * 60)
        
        # List all schools
        self.stdout.write("")
        self.stdout.write("Current schools in database:")
        for school in School.objects.all():
            self.stdout.write(f"  - {school.school_id}: {school.name} ({school.api_url})")