import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
import random
import string
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model






class Category(models.Model):
    CATEGORY_CHOICES = [
        ('Production', 'Production'),
        ('Office', 'Office'),
        ('Car Wash', 'Car Wash'),
        ('Paint/Damage', 'Paint/Damage'),
    ]
    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)

    def __str__(self):
        return self.name

ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('supervisor', 'Supervisor'),
        ('worker', 'Worker'),
        ('temp', 'Temporary'),
    ]
class User(AbstractUser):

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    unique_id = models.CharField(max_length=6, unique=True, blank=True)
    temp_expiry = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.unique_id:
            self.unique_id = self.generate_unique_code()
        super().save(*args, **kwargs)

    def generate_unique_code(self):
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not User.objects.filter(unique_id=code).exists():
                return code
            
    groups = models.ManyToManyField(
        Group,
        related_name="api_user_groups",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="api_user_permissions",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

class Checkout(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    vin = models.CharField(max_length=100)
    order_number = models.CharField(max_length=100)
    parts = models.ManyToManyField('InventoryItem', through='CheckoutPart')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.order_number}"



class CheckoutPart(models.Model):
    checkout = models.ForeignKey('Checkout', on_delete=models.CASCADE)
    part = models.ForeignKey('InventoryItem', on_delete=models.CASCADE)
    damaged = models.BooleanField(default=False)
    edit_reason = models.TextField(blank=True, null=True)
    edited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='edited_checkouts')

    def __str__(self):
        return f"{self.part.name} in Order {self.checkout.order_number}"
    
class Transaction(models.Model):
    ACTION_CHOICES = [
        ('add', 'Add'),
        ('remove', 'Remove'),
        ('update', 'Update'),
        ('confirm', 'Confirm'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)  # Add, Remove, etc.
    car = models.CharField(max_length=50, null=True, blank=True)
    parts = models.JSONField()  # Stores details of the parts involved
    timestamp = models.DateTimeField(auto_now_add=True)


class ScannedItem(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    car_label = models.CharField(max_length=100)
    parts = models.JSONField()  # Temporary storage for scanned items
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Log(models.Model):
    action = models.CharField(max_length=255)
    item_name = models.CharField(max_length=255, null=True, blank=True)
    user = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(null=True, blank=True)  # Ensure details are included

    def __str__(self):
        return f"{self.timestamp} - {self.action}: {self.item_name or 'No Item'} ({self.details or 'No Details'})"


class InventoryItem(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    threshold = models.PositiveIntegerField()
    barcode = models.CharField(max_length=100, unique=True, blank=True)
    category = models.CharField(max_length=50)
    threshold_breached = models.BooleanField(default=False)
    
    # ✅ NEW FIELD FOR CHILD-PARENT RELATION
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')

    def save(self, *args, **kwargs):
        if not self.barcode:
            self.barcode = str(uuid.uuid4()).replace("-", "")[:12]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name



class Car(models.Model):
    vin = models.CharField(max_length=17)  # No unique constraint here
    model = models.CharField(max_length=255)
    adaptation = models.CharField(max_length=255, null=True, blank=True) 
    scheduled_date = models.DateField(null=True, blank=True)
    order_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    client_name = models.CharField(max_length=255, null=True, blank=True)
    dealers_comments = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=50, default='from_upcoming')

    def __str__(self):
        return f"{self.vin} - {self.model}"




class CarPart(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    quantity_needed = models.IntegerField(default=1)
    scanned = models.BooleanField(default=False)

# Define the CarInstallation model
class CarInstallation(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="installations")
    task_description = models.TextField()  # Task or installation description
    adaptation = models.CharField(max_length=255, blank=True, null=True)  # Adaptation description
    scheduled_date = models.DateField(blank=True, null=True)
    order_date = models.DateField(blank=True, null=True)
    dealers_comments = models.TextField(blank=True, null=True)  # Comments from the dealer

    def __str__(self):
        return f"Installation for {self.car.vin}: {self.task_description}"