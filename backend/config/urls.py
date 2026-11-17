from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as serve_media

admin.site.site_header = "Moon Shop BD admin"
admin.site.site_title = "Moon Shop BD admin"
admin.site.index_title = "Store settings, products and orders"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("shop.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif settings.SERVE_MEDIA:
    urlpatterns += [re_path(r"^media/(?P<path>.*)$", serve_media, {"document_root": settings.MEDIA_ROOT})]
