from rest_framework import serializers

from .models import Order, Product, ProductImage, StoreSettings, phone_validator


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text"]

    def get_url(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class StoreSettingsSerializer(serializers.ModelSerializer):
    size_chart_url = serializers.SerializerMethodField()

    class Meta:
        model = StoreSettings
        fields = ["helpline_number", "support_email", "size_chart_url", "delivery_inside_dhaka", "delivery_outside_dhaka"]

    def get_size_chart_url(self, obj):
        if not obj.size_chart:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.size_chart.url) if request else obj.size_chart.url


class ProductSerializer(serializers.ModelSerializer):
    sizes = serializers.ListField(child=serializers.CharField(), source="size_list", read_only=True)
    image_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "description", "material", "fit", "details", "care",
            "price", "sizes", "image_url", "images", "color_hex", "pattern",
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

    def get_images(self, obj):
        images = []
        primary_url = self.get_image_url(obj)
        if primary_url:
            images.append({"id": "primary", "url": primary_url, "alt_text": obj.name})
        images.extend(ProductImageSerializer(obj.gallery_images.all(), many=True, context=self.context).data)
        return images


class OrderCreateSerializer(serializers.ModelSerializer):
    # The client sends the product slug, e.g. "charcoal-herringbone".
    product = serializers.SlugRelatedField(slug_field="slug", queryset=Product.objects.filter(is_active=True))
    phone = serializers.CharField(max_length=20, validators=[phone_validator])
    quantity = serializers.IntegerField(min_value=1, max_value=10, default=1)
    delivery_area = serializers.ChoiceField(choices=Order.DeliveryArea.choices)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "product", "size", "quantity",
            "customer_name", "phone", "email", "address", "city", "note", "delivery_area",
            "unit_price", "delivery_fee", "total", "status", "created_at",
        ]
        read_only_fields = ["id", "unit_price", "delivery_fee", "total", "status", "created_at"]

    def validate(self, attrs):
        product = attrs["product"]
        if attrs["size"] not in product.size_list:
            raise serializers.ValidationError(
                {"size": f"Size '{attrs['size']}' is not available. Choose from: {', '.join(product.size_list)}."}
            )
        return attrs

    def create(self, validated_data):
        product = validated_data["product"]
        settings, _ = StoreSettings.objects.get_or_create(pk=1)
        delivery_fee = (
            settings.delivery_inside_dhaka
            if validated_data["delivery_area"] == Order.DeliveryArea.INSIDE_DHAKA
            else settings.delivery_outside_dhaka
        )
        return Order.objects.create(
            product_name=product.name,
            unit_price=product.price,
            delivery_fee=delivery_fee,
            **validated_data,
        )
