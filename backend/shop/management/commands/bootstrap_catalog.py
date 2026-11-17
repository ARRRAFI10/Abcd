from pathlib import Path

from django.core.files import File
from django.core.management import call_command
from django.core.management.base import BaseCommand

from shop.models import Product


SEED_IMAGES = {
    "midnight-navy-single-breasted": "navy.jpg",
    "charcoal-herringbone": "charcoal.jpg",
    "bottle-green-pinstripe": "green.jpg",
    "stone-check-linen": "beige.jpg",
}
IMAGE_DIR = Path(__file__).resolve().parents[2] / "seed_images"


class Command(BaseCommand):
    help = "Create the initial catalogue and restore its bundled photos when needed."

    def handle(self, *args, **options):
        if not Product.objects.exists():
            call_command("seed_products", stdout=self.stdout)

        for slug, filename in SEED_IMAGES.items():
            product = Product.objects.filter(slug=slug).first()
            if not product:
                continue
            bundled_name = f"products/{filename}"
            if product.image.name and product.image.name != bundled_name:
                continue
            if product.image.name and product.image.storage.exists(product.image.name):
                continue
            with (IMAGE_DIR / filename).open("rb") as source:
                product.image.save(filename, File(source), save=True)
            self.stdout.write(f"Photo ready: {product.name}")
