import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create the initial admin account from Render environment variables, once."

    def handle(self, *args, **options):
        password = os.environ.get("DJANGO_INITIAL_ADMIN_PASSWORD")
        if not password:
            return
        username = os.environ.get("DJANGO_INITIAL_ADMIN_USERNAME", "admin")
        email = os.environ.get("DJANGO_INITIAL_ADMIN_EMAIL", "")
        user_model = get_user_model()
        if not user_model.objects.filter(username=username).exists():
            user_model.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write("Initial admin account created.")
