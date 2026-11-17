from django.conf import settings
from django.http import HttpResponse
from django.utils.cache import patch_vary_headers


class PublicApiCorsMiddleware:
    """Allow the configured storefront origin to call the public API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")
        allowed = request.path.startswith("/api/") and origin in settings.STOREFRONT_ORIGINS

        if allowed and request.method == "OPTIONS":
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        if allowed:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type"
            response["Access-Control-Max-Age"] = "600"
            patch_vary_headers(response, ["Origin"])
        return response
