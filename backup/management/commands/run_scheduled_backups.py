from django.core.management.base import BaseCommand
from backup.tasks import run_scheduled_backups


class Command(BaseCommand):
    help = "Check backup schedules and trigger any due today."

    def handle(self, *args, **options):
        self.stdout.write("Checking backup schedules...")
        run_scheduled_backups()
        self.stdout.write(self.style.SUCCESS("Done."))