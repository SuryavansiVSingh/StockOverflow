from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CarViewSet, InventoryItemViewSet, CategoryViewSet, LogListView, UploadCarsView, UserViewSet, CheckoutViewSet
from django.http import JsonResponse
from django.urls import get_resolver
from .car_inventory import scan_vin

# Debugging view to list all URLs
def show_urls(request):
    resolver = get_resolver()
    patterns = [str(pattern.pattern) for pattern in resolver.url_patterns]
    return JsonResponse({"urls": patterns})

# Initialize the DefaultRouter and register viewsets
router = DefaultRouter()
router.register('cars', CarViewSet)
router.register('inventory', InventoryItemViewSet, basename='inventory')
router.register('categories', CategoryViewSet)
router.register('users', UserViewSet)
router.register(r'checkout', CheckoutViewSet, basename='checkout')


# Define urlpatterns
urlpatterns = [
    path('', include(router.urls)),         # Register API endpoints
    path('debug/urls/', show_urls),         # Debug endpoint
    path('logs/', LogListView.as_view(), name='logs-list'),
    path('api/scan_vin/', scan_vin, name='scan_vin'),
        path("api/cars/bulk_upload/", UploadCarsView.as_view(), name="bulk_upload"),

]
