from django.contrib import admin
from django.urls import path, include
from api.views import bulk_upload, UploadCarsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Include URLs from the `api` app
    path('api/cars/bulk_upload/', bulk_upload, name='bulk_upload'),  # JSON upload
    path('api/cars/upload/', UploadCarsView.as_view(), name='upload_cars'),  # Excel file upload
    
]
