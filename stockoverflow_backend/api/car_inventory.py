from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.core.mail import send_mail
from .models import Car, InventoryItem, Log
import pandas as pd
from rest_framework.parsers import MultiPartParser, FormParser


@api_view(['POST'])
def scan_vin(request):
    vin = request.data.get('vin')
    car = Car.objects.filter(vin=vin).first()

    if car:
        if car.status in [None, '']:
            car.status = 'from_upcoming'
        elif car.status == 'from_upcoming':
            car.status = 'allocated'
        car.save()
        return Response({'status': car.status, 'message': 'Car status updated.'})
    else:
        # Add unknown cars with minimal details
        car = Car.objects.create(vin=vin, status='unknown', model='Unknown')
        return Response({'status': car.status, 'message': 'Unknown car added to the system.'})

class UploadCarsView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Read the Excel file
            df = pd.read_excel(file)
        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Define expected columns
        expected_columns = {
            "Frame": "vin",
            "Type description": "model",
            "Adaptation description": "adaptation",
            "Estim Arrival": "scheduled_date",
            "Order date": "order_date",
            "Name": "client_name",
            "Dealer's comment": "dealers_comments",
            "Location": "location",
        }

        # Check for missing columns
        missing_columns = [col for col in expected_columns if col not in df.columns]
        if missing_columns:
            return Response({"error": f"Missing required columns: {', '.join(missing_columns)}"}, status=400)

        errors = []
        success_count = 0

        for index, row in df.iterrows():
            try:
                # Map row data to model fields
                car_data = {db_field: row.get(excel_col, "").strip() for excel_col, db_field in expected_columns.items()}

                # Default status if not provided
                car_data['status'] = 'from_upcoming'

                # Convert dates
                for date_field in ["scheduled_date", "order_date"]:
                    if car_data.get(date_field):
                        try:
                            car_data[date_field] = pd.to_datetime(car_data[date_field]).date()
                        except Exception:
                            car_data[date_field] = None  # Handle invalid date format

                # Save or update car
                Car.objects.update_or_create(vin=car_data["vin"], defaults=car_data)
                success_count += 1

            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")

        return Response(
            {
                "message": f"Upload complete. {success_count} cars added/updated.",
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )

def adjust_thresholds():
    """
    Adjust thresholds for inventory items based on upcoming cars.
    """
    upcoming_cars = Car.objects.filter(status='from_upcoming')
    for car in upcoming_cars:
        for part in car.required_parts.all():
            inventory_item = InventoryItem.objects.get(id=part.id)
            inventory_item.quantity -= part.quantity_needed
            if inventory_item.quantity < inventory_item.threshold:
                inventory_item.threshold_breached = True
                send_email_notification(inventory_item)
            inventory_item.save()


def send_email_notification(inventory_item):
    """
    Send an email when inventory thresholds are breached.
    """
    send_mail(
        subject='Threshold Breach Alert',
        message=f'Item {inventory_item.name} is below the threshold.',
        from_email='admin@company.com',
        recipient_list=['office@company.com']
    )
