from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Car, InventoryItem, Category, Log, ScannedItem, User
from .serializers import CarSerializer, InventoryItemSerializer, CategorySerializer, LogSerializer, UserSerializer
from django.http import JsonResponse
from rest_framework.generics import ListAPIView
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import uuid
import json
import pandas as pd
from .models import Checkout, CheckoutPart, InventoryItem
from .serializers import CheckoutSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .serializers import CheckoutCreateSerializer

class CheckoutViewSet(viewsets.ModelViewSet):
    queryset = Checkout.objects.all().order_by("-created_at")
    serializer_class = CheckoutSerializer  # For read/view

    def create(self, request, *args, **kwargs):
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        checkout = serializer.save()
        return Response(CheckoutSerializer(checkout).data, status=status.HTTP_201_CREATED)





class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_superuser:
            return Response({"error": "Superuser cannot be deleted."}, status=400)
        return super().destroy(request, *args, **kwargs)


# ViewSets for CRUD operations
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

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

        # Process rows
        errors = []
        success_count = 0
        for index, row in df.iterrows():
            try:
                # Map row data to model fields
                car_data = {db_field: row[excel_col] for excel_col, db_field in expected_columns.items()}
                
                # Convert dates
                for date_field in ["scheduled_date", "order_date"]:
                    if car_data.get(date_field):
                        try:
                            car_data[date_field] = pd.to_datetime(car_data[date_field]).date()
                        except ValueError:
                            car_data[date_field] = None  # Handle invalid date format
                
                # Always create a new Car instance
                Car.objects.create(**car_data)
                success_count += 1

            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")

        return Response({
            "message": f"Upload complete. {success_count} cars added.",
            "errors": errors,
        }, status=status.HTTP_201_CREATED)

@csrf_exempt
def bulk_upload(request):
    """
    Bulk upload cars via JSON data.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # Parse JSON data
            if not isinstance(data, list):
                return JsonResponse({'error': 'Invalid format. Expected a list of car objects.'}, status=400)

            cars = []
            for car_data in data:
                serializer = CarSerializer(data=car_data)
                if serializer.is_valid():
                    serializer.save()
                    cars.append(serializer.data)
                else:
                    return JsonResponse({'error': serializer.errors}, status=400)

            return JsonResponse({'message': 'Bulk upload successful!', 'cars': cars}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


class InventoryItemViewSet(ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

    def create(self, request, *args, **kwargs):
        print("=== Incoming Inventory POST Data ===")
        data = request.data.copy()
        print("Parsed data:", data)

        child_parts = data.get("childParts", [])
        if isinstance(child_parts, str):
            try:
                child_parts = json.loads(child_parts)
            except Exception as e:
                print("Error decoding childParts JSON string:", e)
                child_parts = []
        elif not isinstance(child_parts, list):
            child_parts = []

        data.pop("childParts", None)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        parent_item = serializer.save()

        for child_data in child_parts:
            child_data["parent"] = parent_item.id
            child_data["category"] = parent_item.category  # ✅ Fix: inherit category from parent
            child_serializer = self.get_serializer(data=child_data)
            if not child_serializer.is_valid():
                print("Child validation error:", child_serializer.errors)
                continue
            child_serializer.save()

        return Response(self.get_serializer(parent_item).data, status=status.HTTP_201_CREATED)

def update(self, request, *args, **kwargs):
    item_instance = self.get_object()
    old_data = {
        "name": item_instance.name,
        "sku": item_instance.sku,
        "barcode": item_instance.barcode,
        "quantity": item_instance.quantity,
        "threshold": item_instance.threshold,
        "category": item_instance.category,  # ✅ FIXED HERE
    }
    response = super().update(request, *args, **kwargs)
    if response.status_code == status.HTTP_200_OK:
        new_data = response.data
        changes = [
            f"{field}: {old_data[field]} -> {new_data[field]}"
            for field in old_data if old_data[field] != new_data[field]
        ]
        Log.objects.create(
            action="Updated Item",
            item_name=new_data["name"],
            user=request.user.username if request.user.is_authenticated else "Anonymous",
            details="Updated Fields:\n" + "\n".join(changes)
        )
    return response


    def destroy(self, request, *args, **kwargs):
        item_instance = self.get_object()
        Log.objects.create(
            action="Deleted Item",
            item_name=item_instance.name,
            user=request.user.username if request.user.is_authenticated else "Anonymous",
            details=(
                f"Deleted Item Details:\n"
                f"Name: {item_instance.name}, SKU: {item_instance.sku}, Barcode: {item_instance.barcode}"
            )
        )
        return super().destroy(request, *args, **kwargs)

class CarViewSet(ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    parser_classes = (MultiPartParser, FormParser)  # Add support for file uploads

    def create(self, request, *args, **kwargs):
        # Check if a file is being uploaded
        
        if "file" in request.FILES:
            file = request.FILES["file"]
            try:
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

            # Process rows
            errors = []
            success_count = 0
            for index, row in df.iterrows():
                try:
                    # Map row data to model fields
                    car_data = {db_field: row.get(excel_col, "").strip() for excel_col, db_field in expected_columns.items()}
                    car_data["status"] = "from_upcoming"  # Default status
                    
                    # Convert dates
                    for date_field in ["scheduled_date", "order_date"]:
                        if car_data.get(date_field):
                            try:
                                car_data[date_field] = pd.to_datetime(car_data[date_field]).date()
                            except ValueError:
                                car_data[date_field] = None  # Handle invalid date format
                    
                    # Save or update car
                    Car.objects.update_or_create(vin=car_data["vin"], defaults=car_data)
                    success_count += 1
                except Exception as e:
                    errors.append(f"Row {index + 1}: {str(e)}")

            return Response({
                "message": f"Upload complete. {success_count} cars added/updated.",
                "errors": errors,
            }, status=status.HTTP_200_OK)
        else:
            # Handle regular single-car creation
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


def badge_login(request):
    badge_id = request.POST.get("badge_id")
    user = authenticate(badge_id=badge_id)
    if user:
        return JsonResponse({"message": "Login successful", "role": user.role})
    return JsonResponse({"error": "Invalid badge"}, status=401)


@csrf_exempt
def scan_item(request):
    session_id = request.POST.get("session_id") or str(uuid.uuid4())
    car_label = request.POST.get("car_label")
    part_barcode = request.POST.get("part_barcode")
    
    try:
        scanned_item, created = ScannedItem.objects.get_or_create(
            session_id=session_id,
            defaults={"car_label": car_label, "parts": [], "user": request.user}
        )
        if part_barcode:
            part = InventoryItem.objects.get(barcode=part_barcode)
            scanned_item.parts.append({
                "name": part.name,
                "sku": part.sku,
                "barcode": part.barcode,
                "quantity": part.quantity
            })
            scanned_item.save()
        return JsonResponse({"session_id": scanned_item.session_id, "parts": scanned_item.parts})
    except InventoryItem.DoesNotExist:
        return JsonResponse({"error": "Part not found"}, status=404)


@csrf_exempt
def confirm_session(request):
    session_id = request.POST.get("session_id")
    try:
        scanned_item = ScannedItem.objects.get(session_id=session_id)
        for part in scanned_item.parts:
            inventory_item = InventoryItem.objects.get(barcode=part["barcode"])
            inventory_item.quantity -= 1  # Deduct quantity
            inventory_item.save()
        scanned_item.delete()  # Clear session
        return JsonResponse({"message": "Session confirmed and inventory updated"})
    except ScannedItem.DoesNotExist:
        return JsonResponse({"error": "Session not found"}, status=404)


# Log endpoints
def get_logs(request):
    logs = Log.objects.all().order_by('-timestamp')
    log_list = [
        {
            "action": log.action,
            "item_name": log.item_name,
            "user": log.user,
            "timestamp": log.timestamp.strftime("%d/%m/%Y, %H:%M:%S"),
            "details": log.details
        }
        for log in logs
    ]
    return JsonResponse(log_list, safe=False)


def reset_logs(request):
    if request.method == "POST":
        Log.objects.all().delete()
        return JsonResponse({"message": "Logs reset successfully."})


class LogListView(ListAPIView):
    queryset = Log.objects.all().order_by('-timestamp')
    serializer_class = LogSerializer
