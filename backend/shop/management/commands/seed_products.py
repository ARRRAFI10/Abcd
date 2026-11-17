from django.core.management.base import BaseCommand

from shop.models import Product

BLAZERS = [
    {
        "name": "Royal Navy Kids' Blazer",
        "slug": "midnight-navy-single-breasted",
        "description": "A classic navy blazer for weddings, birthdays, school events and family occasions. Smart on the outside and comfortable for children to wear.",
        "material": "Soft suiting fabric", "fit": "Comfortable kids' fit", "details": "Two-button front · Notch collar · Two front pockets · Smooth lining", "care": "Dry clean recommended",
        "price": "1450.00", "sizes": "24,26,28,30", "color_hex": "#1F2A44", "pattern": "plain", "display_order": 1,
    },
    {
        "name": "Charcoal Kids' Blazer",
        "slug": "charcoal-herringbone",
        "description": "A simple charcoal blazer that works well with shirts, trousers and jeans. A useful choice for school programs and formal family events.",
        "material": "Textured suiting fabric", "fit": "Comfortable kids' fit", "details": "Two-button front · Notch collar · Front pockets · Smooth lining", "care": "Dry clean recommended",
        "price": "1550.00", "sizes": "24,26,28,30", "color_hex": "#3B3F46", "pattern": "herringbone", "display_order": 2,
    },
    {
        "name": "Bottle Green Kids' Blazer",
        "slug": "bottle-green-pinstripe",
        "description": "A deep green kids' blazer for festive events and celebrations. The colour looks smart while the fit stays easy to wear.",
        "material": "Soft suiting fabric", "fit": "Neat kids' fit", "details": "Two-button front · Notch collar · Front pockets · Smooth lining", "care": "Dry clean recommended",
        "price": "1650.00", "sizes": "24,26,28,30", "color_hex": "#1E4D3F", "pattern": "pinstripe", "display_order": 3,
    },
    {
        "name": "Beige Check Kids' Blazer",
        "slug": "stone-check-linen",
        "description": "A light beige check blazer for daytime events and warm weather. Easy to match with white shirts and dark trousers.",
        "material": "Lightweight fabric blend", "fit": "Relaxed kids' fit", "details": "Two-button front · Check pattern · Front pockets · Light lining", "care": "Dry clean recommended",
        "price": "1450.00", "sizes": "24,26,28,30", "color_hex": "#B9B3A3", "pattern": "check", "display_order": 4,
    },
]


class Command(BaseCommand):
    help = "Create or update the four demo blazers (safe to run repeatedly)."

    def handle(self, *args, **options):
        for data in BLAZERS:
            obj, created = Product.objects.update_or_create(slug=data["slug"], defaults=data)
            self.stdout.write(f"{'Created' if created else 'Updated'}: {obj.name}")
