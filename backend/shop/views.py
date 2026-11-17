from rest_framework import generics, viewsets
from rest_framework.throttling import ScopedRateThrottle

from .models import Product, StoreSettings
from .serializers import OrderCreateSerializer, ProductSerializer, StoreSettingsSerializer


class StoreSettingsView(generics.RetrieveAPIView):
    serializer_class = StoreSettingsSerializer

    def get_object(self):
        settings, _ = StoreSettings.objects.get_or_create(pk=1)
        return settings


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).prefetch_related("gallery_images")
    serializer_class = ProductSerializer
    lookup_field = "slug"
    pagination_class = None


class OrderCreateView(generics.CreateAPIView):
    """Public endpoint: customers place an order. Reading orders is admin-only (Django admin)."""

    serializer_class = OrderCreateSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "orders"
