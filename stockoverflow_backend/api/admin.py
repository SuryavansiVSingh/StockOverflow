from django.contrib import admin
from .models import InventoryItem,Car, User, Checkout, CheckoutPart

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'quantity', 'threshold', 'category', 'barcode', 'parent')
    search_fields = ('name', 'sku', 'barcode', 'category')
    list_filter = ('category', 'parent')

@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ('vin', 'model', 'location', 'client_name', 'status')
    search_fields = ('vin', 'model', 'client_name')
    list_filter = ('status',)

    
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'unique_id')
    search_fields = ('username', 'email', 'unique_id')
    list_filter = ('role', 'is_active')

@admin.register(Checkout)
class CheckoutAdmin(admin.ModelAdmin):
    list_display = ('user', 'vin', 'order_number', 'created_at')
    search_fields = ('vin', 'order_number', 'user__username')

@admin.register(CheckoutPart)
class CheckoutPartAdmin(admin.ModelAdmin):
    list_display = ('checkout', 'part', 'damaged', 'edited_by')
    list_filter = ('damaged', 'edited_by')