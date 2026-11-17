from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models


class Product(models.Model):
    class Pattern(models.TextChoices):
        PLAIN = "plain", "Plain"
        PINSTRIPE = "pinstripe", "Pinstripe"
        HERRINGBONE = "herringbone", "Herringbone"
        CHECK = "check", "Check"

    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    material = models.CharField(max_length=160, blank=True)
    fit = models.CharField(max_length=160, blank=True)
    details = models.TextField(blank=True)
    care = models.CharField(max_length=200, blank=True, default="Dry clean only")
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    image = models.ImageField(upload_to="products/", blank=True)
    sizes = models.CharField(
        max_length=100,
        default="S,M,L,XL,XXL",
        help_text="Comma-separated list of sizes offered, e.g. S,M,L,XL",
    )
    # Used only for the placeholder shown until a real photo is uploaded.
    color_hex = models.CharField(max_length=7, default="#1F2A44")
    pattern = models.CharField(max_length=20, choices=Pattern.choices, default=Pattern.PLAIN)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.name

    @property
    def size_list(self):
        return [s.strip() for s in self.sizes.split(",") if s.strip()]


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="gallery_images")
    image = models.ImageField(upload_to="products/gallery/")
    alt_text = models.CharField(max_length=160, blank=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.alt_text or f"{self.product.name} image"


class StoreSettings(models.Model):
    helpline_number = models.CharField(
        max_length=20,
        default="+8801700000000",
        validators=[RegexValidator(r"^\+?[0-9][0-9\s\-]{6,18}$", "Enter a valid phone number.")],
        help_text="Public customer support number shown on the website.",
    )
    support_email = models.EmailField(default="support@moonshopbd.com", blank=True)
    size_chart = models.ImageField(upload_to="settings/", blank=True, help_text="Optional replacement for the default size chart shown on the website.")
    delivery_inside_dhaka = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("80.00"), validators=[MinValueValidator(Decimal("0"))])
    delivery_outside_dhaka = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("150.00"), validators=[MinValueValidator(Decimal("0"))])

    class Meta:
        verbose_name_plural = "Store settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return "Moon Shop BD store settings"


phone_validator = RegexValidator(
    r"^\+?[0-9][0-9\s\-]{6,18}$",
    "Enter a valid phone number (digits, optional leading +).",
)


class Order(models.Model):
    class DeliveryArea(models.TextChoices):
        INSIDE_DHAKA = "inside_dhaka", "Inside Dhaka"
        OUTSIDE_DHAKA = "outside_dhaka", "Outside Dhaka"

    class Status(models.TextChoices):
        NEW = "new", "New"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="orders")
    # Snapshots, so old orders stay correct if a product is renamed or repriced.
    product_name = models.CharField(max_length=120)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_area = models.CharField(max_length=20, choices=DeliveryArea.choices, blank=True, default="")
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))

    size = models.CharField(max_length=10)
    quantity = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(10)])

    customer_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, validators=[phone_validator])
    email = models.EmailField(blank=True)
    address = models.TextField()
    city = models.CharField(max_length=80)
    note = models.TextField(blank=True)

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} - {self.customer_name} - {self.product_name} ({self.size})"

    @property
    def total(self):
        return self.unit_price * self.quantity + self.delivery_fee
