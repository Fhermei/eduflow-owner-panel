# owner_panel/portal_fee/management/commands/init_portal_fee_settings.py
from django.core.management.base import BaseCommand
from portal_fee.models import PortalFeeOwnerSettings, PortalFeeSchoolConfig
from schools.models import School


class Command(BaseCommand):
    help = 'Initialize portal fee settings for all schools'

    def handle(self, *args, **options):
        self.stdout.write("Initializing portal fee settings...")
        
        # Create global settings if not exists
        settings, created = PortalFeeOwnerSettings.objects.get_or_create(
            defaults={
                'default_fee_amount': 1000,
                'is_enabled': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS("✓ Created global portal fee settings"))
        else:
            self.stdout.write("ℹ Global portal fee settings already exist")
        
        # Create config for each school if not exists
        schools = School.objects.all()
        created_count = 0
        
        for school in schools:
            config, created = PortalFeeSchoolConfig.objects.get_or_create(
                school=school,
                defaults={
                    'fee_amount': settings.default_fee_amount,
                    'is_active': settings.is_enabled
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"✓ Created config for {school.name}")
        
        self.stdout.write(self.style.SUCCESS(f"✅ Initialized {created_count} school configurations"))