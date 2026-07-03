from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from decouple import config


class Command(BaseCommand):
    help = "Create the single owner superuser from .env values (idempotent, never overwrites)."

    def handle(self, *args, **options):
        User = get_user_model()

        username = config('DJANGO_SUPERUSER_USERNAME', default='')
        email = config('DJANGO_SUPERUSER_EMAIL', default='')
        password = config('DJANGO_SUPERUSER_PASSWORD', default='')

        if not username or not email or not password:
            self.stdout.write(self.style.WARNING(
                "DJANGO_SUPERUSER_USERNAME / _EMAIL / _PASSWORD not set in "
                "the environment — skipping superuser creation."
            ))
            return

        existing_superusers = User.objects.filter(is_superuser=True)

        # Already have exactly this superuser -> do nothing, don't touch password
        if existing_superusers.filter(username=username).exists():
            self.stdout.write(self.style.SUCCESS(
                f"Superuser '{username}' already exists — leaving untouched "
                f"(password is never changed by this command)."
            ))
            return

        # A different superuser already exists -> refuse (only ONE allowed)
        other = existing_superusers.exclude(username=username).first()
        if other:
            raise CommandError(
                f"Refusing to create '{username}': a different superuser "
                f"('{other.username}') already exists and only one superuser "
                f"is allowed. Delete it first if you really want to replace it."
            )

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(
            f"Created superuser '{username}' from environment variables."
        ))