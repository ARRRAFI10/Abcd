from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OrderCreateView, ProductViewSet, StoreSettingsView

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("", include(router.urls)),
    path("store-settings/", StoreSettingsView.as_view(), name="store-settings"),
    path("orders/", OrderCreateView.as_view(), name="order-create"),
]
