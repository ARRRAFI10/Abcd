from django.contrib import admin
from django.utils.html import format_html

from .models import Order, Product, ProductImage, StoreSettings


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text", "display_order")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("thumb", "name", "price", "sizes", "is_active", "display_order")
    list_editable = ("price", "is_active", "display_order")
    list_display_links = ("thumb", "name")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    inlines = (ProductImageInline,)
    fieldsets = (
        ("Product", {"fields": ("name", "slug", "description", "price", "image")}),
        ("Tailoring details", {"fields": ("material", "fit", "details", "care", "sizes")}),
        ("Display", {"fields": ("color_hex", "pattern", "is_active", "display_order")}),
    )

    @admin.display(description="Photo")
    def thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:48px;border-radius:4px">', obj.image.url)
        return "-"


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Contact", {"fields": ("helpline_number", "support_email")}),
        ("Size guide", {"fields": ("size_chart",)}),
        ("Delivery charges (BDT)", {"fields": ("delivery_inside_dhaka", "delivery_outside_dhaka")}),
    )

    def has_add_permission(self, request):
        return not StoreSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id", "created_at", "customer_name", "phone", "city", "delivery_area",
        "product_name", "size", "quantity", "total_display", "status",
    )
    list_editable = ("status",)
    list_filter = ("status", "size", "product", "created_at")
    search_fields = ("customer_name", "phone", "email", "address", "product_name")
    date_hierarchy = "created_at"
    list_per_page = 50

    # Customer-submitted data is read-only; the admin only moves the order along.
    readonly_fields = (
        "product", "product_name", "unit_price", "delivery_area", "delivery_fee", "total_display", "size", "quantity",
        "customer_name", "phone", "email", "address", "city", "note", "created_at",
    )
    fieldsets = (
        ("Order", {"fields": ("status", "created_at", "product", "product_name", "size", "quantity", "unit_price", "delivery_area", "delivery_fee", "total_display")}),
        ("Customer", {"fields": ("customer_name", "phone", "email", "address", "city", "note")}),
    )

    def has_add_permission(self, request):
        return False

    @admin.display(description="Total")
    def total_display(self, obj):
        return f"{obj.total:,.2f}"
