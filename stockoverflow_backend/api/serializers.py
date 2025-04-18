from rest_framework import serializers
from .models import Car, InventoryItem, Category, CarPart, Log, User, Checkout, CheckoutPart

from rest_framework import serializers
from .models import User, InventoryItem, Checkout, CheckoutPart

class CheckoutPartWriteSerializer(serializers.Serializer):
    part = serializers.CharField()  # barcode
    damaged = serializers.BooleanField(default=False)
    edit_reason = serializers.CharField(required=False, allow_blank=True)

class CheckoutCreateSerializer(serializers.Serializer):
    user = serializers.CharField()  # unique_id
    vin = serializers.CharField()
    order_number = serializers.CharField()
    parts = CheckoutPartWriteSerializer(many=True)

    def create(self, validated_data):
        # ✅ Get user by unique_id
        unique_id = validated_data['user']
        try:
            user = User.objects.get(unique_id=unique_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({'user': f"No user with unique_id '{unique_id}' found"})

        # ✅ Create checkout
        checkout = Checkout.objects.create(
            user=user,
            vin=validated_data["vin"],
            order_number=validated_data["order_number"]
        )

        # ✅ Add parts by barcode
        for part_data in validated_data["parts"]:
            barcode = part_data["part"]
            try:
                inventory_part = InventoryItem.objects.get(barcode=barcode)
            except InventoryItem.DoesNotExist:
                raise serializers.ValidationError({'parts': f"No inventory item with barcode '{barcode}' found"})

            CheckoutPart.objects.create(
                checkout=checkout,
                part=inventory_part,
                damaged=part_data.get("damaged", False),
                edit_reason=part_data.get("edit_reason", ""),
                edited_by=None
            )

            inventory_part.quantity -= 2 if part_data.get("damaged") else 1
            inventory_part.save()

        return checkout

class CheckoutPartSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_barcode = serializers.CharField(source='part.barcode', read_only=True)

    class Meta:
        model = CheckoutPart
        fields = ['id', 'part', 'part_name', 'part_barcode', 'damaged', 'edit_reason', 'edited_by']

class CheckoutSerializer(serializers.ModelSerializer):
    user_unique_id = serializers.CharField(source='user.unique_id', read_only=True)
    parts = CheckoutPartSerializer(source='checkoutpart_set', many=True, read_only=True)

    class Meta:
        model = Checkout
        fields = ['id', 'user', 'user_unique_id', 'vin', 'order_number', 'created_at', 'parts']


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role', 'is_active', 'unique_id', 'password']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        if instance.is_superuser and validated_data.get("is_active") is False:
            raise serializers.ValidationError("Cannot deactivate the superuser.")
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

    def validate_name(self, value):
        if not value or value.strip() == "":
            raise serializers.ValidationError("Category name cannot be empty.")
        return value

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = ['action', 'item_name', 'user', 'timestamp', 'details']


class InventoryItemSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = '__all__'

    def get_children(self, obj):
        children = obj.children.all()
        return InventoryItemSerializer(children, many=True).data

    def validate_category(self, value):
        if value not in ['Production', 'Office', 'Car Wash', 'Paint/Damage']:
            raise serializers.ValidationError("Invalid category selected.")
        return value



class CarPartSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarPart
        fields = '__all__'


class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = [
            'vin', 'model', 'adaptation', 'scheduled_date', 'order_date',
            'location', 'client_name', 'dealers_comments', 'status'
        ]

    def validate(self, data):
        if not data.get("vin"):
            raise serializers.ValidationError({"vin": "VIN is required."})
        if not data.get("model"):
            raise serializers.ValidationError({"model": "Model is required."})
        return data
