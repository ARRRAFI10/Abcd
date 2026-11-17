from io import BytesIO
from tempfile import TemporaryDirectory
from unittest.mock import patch

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Order, Product, StoreSettings


def valid_payload(**overrides):
    data = {
        "product": "charcoal-herringbone",
        "size": "28",
        "quantity": 2,
        "customer_name": "Arr Rafi",
        "phone": "+8801712345678",
        "email": "rafi@example.com",
        "address": "House 1, Road 2, Mirpur 12",
        "city": "Dhaka",
        "delivery_area": "inside_dhaka",
        "note": "Call before delivery",
    }
    data.update(overrides)
    return data


class ShopAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_products", verbosity=0)

    def setUp(self):
        self.client = APIClient()

    def test_seed_creates_exactly_four_products_and_is_idempotent(self):
        call_command("seed_products", verbosity=0)
        self.assertEqual(Product.objects.count(), 4)

    def test_product_list_returns_four_with_sizes(self):
        res = self.client.get("/api/products/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 4)
        self.assertEqual(res.json()[0]["sizes"], ["24", "26", "28", "30"])

    def test_store_settings_returns_admin_managed_helpline(self):
        StoreSettings.objects.update_or_create(pk=1, defaults={"helpline_number": "+8801812345678", "delivery_inside_dhaka": "90.00"})
        res = self.client.get("/api/store-settings/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["helpline_number"], "+8801812345678")
        self.assertEqual(res.json()["delivery_inside_dhaka"], "90.00")
        self.assertEqual(res.json()["delivery_outside_dhaka"], "150.00")
        self.assertIsNone(res.json()["size_chart_url"])

    def test_store_settings_returns_uploaded_size_chart_url(self):
        image = BytesIO()
        Image.new("RGB", (1, 1), "white").save(image, format="PNG")
        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            settings = StoreSettings.objects.create()
            settings.size_chart.save("chart.png", ContentFile(image.getvalue()))
            res = self.client.get("/api/store-settings/")
            self.assertEqual(res.status_code, 200)
            self.assertIn("/media/settings/chart.png", res.json()["size_chart_url"])

    def test_product_detail_by_slug(self):
        res = self.client.get("/api/products/charcoal-herringbone/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["name"], "Charcoal Kids' Blazer")
        self.assertIn("images", res.json())
        self.assertEqual(res.json()["material"], "Textured suiting fabric")

    def test_inactive_product_is_hidden(self):
        Product.objects.filter(slug="charcoal-herringbone").update(is_active=False)
        self.assertEqual(len(self.client.get("/api/products/").json()), 3)
        self.assertEqual(self.client.get("/api/products/charcoal-herringbone/").status_code, 404)

    def test_create_order_saves_customer_info_and_price_snapshot(self):
        res = self.client.post("/api/orders/", valid_payload(), format="json")
        self.assertEqual(res.status_code, 201, res.content)
        order = Order.objects.get()
        self.assertEqual(order.customer_name, "Arr Rafi")
        self.assertEqual(order.size, "28")
        self.assertEqual(order.quantity, 2)
        self.assertEqual(order.product_name, "Charcoal Kids' Blazer")
        self.assertEqual(str(order.unit_price), "1550.00")
        self.assertEqual(order.delivery_area, Order.DeliveryArea.INSIDE_DHAKA)
        self.assertEqual(str(order.delivery_fee), "80.00")
        self.assertEqual(res.json()["total"], "3180.00")
        self.assertEqual(order.status, Order.Status.NEW)

    def test_delivery_fee_comes_from_settings_and_is_saved_on_order(self):
        settings = StoreSettings.objects.create(delivery_inside_dhaka="85.00", delivery_outside_dhaka="175.00")
        res = self.client.post("/api/orders/", valid_payload(delivery_area="outside_dhaka", delivery_fee="0.00"), format="json")
        self.assertEqual(res.status_code, 201, res.content)
        order = Order.objects.get()
        self.assertEqual(str(order.delivery_fee), "175.00")
        self.assertEqual(res.json()["total"], "3275.00")
        settings.delivery_outside_dhaka = "200.00"
        settings.save()
        order.refresh_from_db()
        self.assertEqual(str(order.total), "3275.00")

    def test_price_cannot_be_set_by_client(self):
        res = self.client.post("/api/orders/", valid_payload(unit_price="1.00", status="delivered"), format="json")
        self.assertEqual(res.status_code, 201)
        order = Order.objects.get()
        self.assertEqual(str(order.unit_price), "1550.00")
        self.assertEqual(order.status, Order.Status.NEW)

    def test_rejects_size_not_offered(self):
        res = self.client.post("/api/orders/", valid_payload(size="XXXL"), format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("size", res.json())
        self.assertEqual(Order.objects.count(), 0)

    def test_rejects_unknown_or_inactive_product(self):
        self.assertEqual(self.client.post("/api/orders/", valid_payload(product="nope"), format="json").status_code, 400)
        Product.objects.filter(slug="charcoal-herringbone").update(is_active=False)
        self.assertEqual(self.client.post("/api/orders/", valid_payload(), format="json").status_code, 400)

    def test_rejects_bad_quantity_phone_and_missing_fields(self):
        for bad in ({"quantity": 0}, {"quantity": 11}, {"phone": "abc"}, {"customer_name": ""}, {"address": ""}, {"city": ""}, {"delivery_area": ""}, {"delivery_area": "other"}):
            res = self.client.post("/api/orders/", valid_payload(**bad), format="json")
            self.assertEqual(res.status_code, 400, bad)
        self.assertEqual(Order.objects.count(), 0)

    def test_rejects_missing_delivery_area(self):
        payload = valid_payload()
        del payload["delivery_area"]
        res = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("delivery_area", res.json())

    def test_email_is_optional(self):
        res = self.client.post("/api/orders/", valid_payload(email="", note=""), format="json")
        self.assertEqual(res.status_code, 201, res.content)

    def test_orders_cannot_be_listed_publicly(self):
        self.client.post("/api/orders/", valid_payload(), format="json")
        self.assertEqual(self.client.get("/api/orders/").status_code, 405)


class AdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_products", verbosity=0)

    def test_admin_requires_login_and_shows_customer_info(self):
        APIClient().post("/api/orders/", valid_payload(), format="json")
        url = reverse("admin:shop_order_changelist")

        anon = self.client.get(url)
        self.assertEqual(anon.status_code, 302)  # redirected to login

        get_user_model().objects.create_superuser("boss", "boss@example.com", "pw-123456-xyz")
        self.client.login(username="boss", password="pw-123456-xyz")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        for text in ("Arr Rafi", "+8801712345678", "Charcoal Kids", "Dhaka"):
            self.assertContains(res, text)

        order = Order.objects.get()
        detail = self.client.get(reverse("admin:shop_order_change", args=[order.pk]))
        self.assertContains(detail, "House 1, Road 2, Mirpur 12")
        self.assertContains(detail, "Call before delivery")

    def test_store_settings_admin_exposes_chart_and_delivery_charges(self):
        settings = StoreSettings.objects.create()
        get_user_model().objects.create_superuser("boss", "boss@example.com", "pw-123456-xyz")
        self.client.login(username="boss", password="pw-123456-xyz")
        response = self.client.get(reverse("admin:shop_storesettings_change", args=[settings.pk]))
        self.assertContains(response, 'name="size_chart"')
        self.assertContains(response, 'name="delivery_inside_dhaka"')
        self.assertContains(response, 'name="delivery_outside_dhaka"')


class CatalogBootstrapTests(TestCase):
    def test_initial_products_have_photos_without_overwriting_admin_edits(self):
        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            call_command("bootstrap_catalog", verbosity=0)
            self.assertEqual(Product.objects.count(), 4)
            for product in Product.objects.all():
                self.assertTrue(product.image.storage.exists(product.image.name))

            Product.objects.filter(slug="charcoal-herringbone").update(price="1775.00")
            call_command("bootstrap_catalog", verbosity=0)
            self.assertEqual(str(Product.objects.get(slug="charcoal-herringbone").price), "1775.00")

    def test_initial_admin_password_is_not_reset_on_restart(self):
        with patch.dict("os.environ", {"DJANGO_INITIAL_ADMIN_PASSWORD": "first-secret-password"}):
            call_command("bootstrap_admin")
            user = get_user_model().objects.get(username="admin")
            self.assertTrue(user.check_password("first-secret-password"))
            user.set_password("new-secret-password")
            user.save()
            call_command("bootstrap_admin")
            user.refresh_from_db()
            self.assertTrue(user.check_password("new-secret-password"))
