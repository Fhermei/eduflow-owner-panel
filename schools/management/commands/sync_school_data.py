# owner_panel/schools/management/commands/sync_school_data.py
from django.core.management.base import BaseCommand
from schools.sync_utils import sync_all_schools

class Command(BaseCommand):
    help = 'Sync all school data using API calls'

    def handle(self, *args, **options):
        self.stdout.write("=" * 50)
        self.stdout.write("Syncing school data via API...")
        self.stdout.write("=" * 50)
        
        results = sync_all_schools()
        
        self.stdout.write("")
        self.stdout.write("Results:")
        for result in results:
            if result['success']:
                status = "SUCCESS"
            else:
                status = "FAILED"
            self.stdout.write(f"  {status}: {result['school']}")
            self.stdout.write(f"       API: {result['api_url']}")
        
        self.stdout.write("=" * 50)
        self.stdout.write(self.style.SUCCESS("Sync complete!"))