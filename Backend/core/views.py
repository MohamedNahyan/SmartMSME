from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError, DatabaseError
from rest_framework.exceptions import ValidationError, NotFound

from .serializers import RegisterSerializer
from .models import (
    Branch,
    Product,
    Sale,
    Income,
    Expense,
    Reminder,
    IncomeCategory,
    ExpenseCategory
)

from .serializers import (
    BranchSerializer,
    ProductSerializer,
    SaleSerializer,
    IncomeSerializer,
    ExpenseSerializer,
    ReminderSerializer,
    IncomeCategorySerializer,
    ExpenseCategorySerializer
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"error": "User already exists"}, status=status.HTTP_409_CONFLICT)
        except Exception as e:
            return Response({"error": "Registration failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            username = request.data.get("username")
            password = request.data.get("password")

            if not username or not password:
                return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

            user = authenticate(username=username, password=password)

            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                })
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"error": "Login failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Branch.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError({"error": "Branch with this name already exists"})
        except DatabaseError:
            raise ValidationError({"error": "Database error occurred"})

    def handle_exception(self, exc):
        if isinstance(exc, NotFound):
            return Response({"error": "Branch not found"}, status=status.HTTP_404_NOT_FOUND)
        return super().handle_exception(exc)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(branch__user=self.request.user)

    def handle_exception(self, exc):
        if isinstance(exc, NotFound):
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        return super().handle_exception(exc)


class SaleViewSet(viewsets.ModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Sale.objects.filter(branch__user=self.request.user)

    def handle_exception(self, exc):
        if isinstance(exc, NotFound):
            return Response({"error": "Sale not found"}, status=status.HTTP_404_NOT_FOUND)
        return super().handle_exception(exc)


class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Income.objects.filter(branch__user=self.request.user)

    def handle_exception(self, exc):
        if isinstance(exc, NotFound):
            return Response({"error": "Income record not found"}, status=status.HTTP_404_NOT_FOUND)
        return super().handle_exception(exc)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(branch__user=self.request.user)

    def handle_exception(self, exc):
        if isinstance(exc, NotFound):
            return Response({"error": "Expense record not found"}, status=status.HTTP_404_NOT_FOUND)
        return super().handle_exception(exc)


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(branch__user=self.request.user)

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except DatabaseError:
            raise ValidationError({"error": "Failed to create reminder"})

    def handle_exception(self, exc):
        if isinstance(exc, NotFound):
            return Response({"error": "Reminder not found"}, status=status.HTTP_404_NOT_FOUND)
        return super().handle_exception(exc)


class IncomeCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return IncomeCategory.objects.filter(user=self.request.user)

    def handle_exception(self, exc):
        if isinstance(exc, NotFound):
            return Response({"error": "Income category not found"}, status=status.HTTP_404_NOT_FOUND)
        return super().handle_exception(exc)


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExpenseCategory.objects.filter(user=self.request.user)

    def handle_exception(self, exc):
        if isinstance(exc, NotFound):
            return Response({"error": "Expense category not found"}, status=status.HTTP_404_NOT_FOUND)
        return super().handle_exception(exc)