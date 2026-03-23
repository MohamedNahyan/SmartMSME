from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError, DatabaseError
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.decorators import api_view, permission_classes
import tempfile
import os

from .serializers import RegisterSerializer, UserProfileSerializer
from .models import (
    Branch,
    Product,
    Sale,
    Income,
    Expense,
    Reminder,
    IncomeCategory,
    ExpenseCategory,
    UserProfile
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


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response({
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email
            },
            **serializer.data
        })

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({"error": "Both old and new passwords are required"}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(old_password):
            return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)



class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from django.contrib.auth.models import User
        
        email = request.data.get('email')
        
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            reset_link = f"/reset-password/{uid}/{token}/"
            
            return Response({
                "message": "Password reset link sent to email",
                "uid": uid,
                "token": token
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                "message": "If email exists, password reset link has been sent"
            }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str
        from django.contrib.auth.models import User
        
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not all([uid, token, new_password]):
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_sales(request):
    from .services import process_sales_file
    
    file = request.FILES.get('file')
    branch_id = request.data.get('branch_id')
    
    if not file or not branch_id:
        return Response({"error": "File and branch_id required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        Branch.objects.get(id=branch_id, user=request.user)
    except Branch.DoesNotExist:
        return Response({"error": "Branch not found"}, status=status.HTTP_404_NOT_FOUND)
    
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        process_sales_file(temp_file_path, branch_id)
        return Response({"message": "Sales imported successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    finally:
        if temp_file and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_income(request):
    from .services import process_income_file
    
    file = request.FILES.get('file')
    branch_id = request.data.get('branch_id')
    
    if not file or not branch_id:
        return Response({"error": "File and branch_id required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        Branch.objects.get(id=branch_id, user=request.user)
    except Branch.DoesNotExist:
        return Response({"error": "Branch not found"}, status=status.HTTP_404_NOT_FOUND)
    
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        process_income_file(temp_file_path, branch_id)
        return Response({"message": "Income imported successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    finally:
        if temp_file and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_expenses(request):
    from .services import process_expense_file
    
    file = request.FILES.get('file')
    branch_id = request.data.get('branch_id')
    
    if not file or not branch_id:
        return Response({"error": "File and branch_id required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        Branch.objects.get(id=branch_id, user=request.user)
    except Branch.DoesNotExist:
        return Response({"error": "Branch not found"}, status=status.HTTP_404_NOT_FOUND)
    
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        process_expense_file(temp_file_path, branch_id)
        return Response({"message": "Expenses imported successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    finally:
        if temp_file and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
