from django.core.management.base import BaseCommand
from api.models import InventoryItem

DEFAULT_ITEMS = [
    {"name": "Front Sensors", "sku": "FRONT_SENSORS", "quantity": 10, "threshold": 5},
    {"name": "Rear Sensors", "sku": "REAR_SENSORS", "quantity": 15, "threshold": 5},
    {"name": "Cargo Pack L1H1", "sku": "CARGO_L1H1", "quantity": 20, "threshold": 10},
    {"name": "Cargo Pack L1H2", "sku": "CARGO_L1H2", "quantity": 10, "threshold": 5},
    {"name": "Cargo Pack L2H2", "sku": "CARGO_L2H2", "quantity": 12, "threshold": 5},
    {"name": "Cargo Pack L2H3", "sku": "CARGO_L2H3", "quantity": 12, "threshold": 5},
    {"name": "Cargo Pack L2DC", "sku": "CARGO_L2DC", "quantity": 12, "threshold": 5},
    {"name": "Cargo Pack L2DS", "sku": "CARGO_L2DS", "quantity": 12, "threshold": 5},
    {"name": "Towbar", "sku": "TOWBAR", "quantity": 8, "threshold": 3},
]

class Command(BaseCommand):
    help = "Create default inventory items"

    def handle(self, *args, **kwargs):
        for item in DEFAULT_ITEMS:
            InventoryItem.objects.get_or_create(
                name=item["name"],
                sku=item["sku"],
                defaults={
                    "quantity": item["quantity"],
                    "threshold": item["threshold"],
                },
            )
        self.stdout.write(self.style.SUCCESS("Default inventory items created!"))
