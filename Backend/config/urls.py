from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from core.views import (
    RegisterView,
    LoginView,
    BranchViewSet,
    ProductViewSet,
    SaleViewSet,
    IncomeViewSet,
    ExpenseViewSet,
    ReminderViewSet,
    IncomeCategoryViewSet,
    ExpenseCategoryViewSet,
    UserProfileView,
    ChangePasswordView,
    ForgotPasswordView,
    ResetPasswordView,
    import_sales,
    import_income,
    import_expenses
)

router = DefaultRouter()

router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'income', IncomeViewSet, basename='income')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'reminders', ReminderViewSet, basename='reminder')
router.register(r'income-categories', IncomeCategoryViewSet, basename='income-category')
router.register(r'expense-categories', ExpenseCategoryViewSet, basename='expense-category')

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/register/', RegisterView.as_view()),
    path('api/login/', LoginView.as_view()),
    path('api/profile/', UserProfileView.as_view()),
    path('api/profile/change-password/', ChangePasswordView.as_view()),
    path('api/forgot-password/', ForgotPasswordView.as_view()),
    path('api/reset-password/', ResetPasswordView.as_view()),

    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/', include(router.urls)),
    
    # Bulk Import
    path('api/sales/import/', import_sales),
    path('api/income/import/', import_income),
    path('api/expenses/import/', import_expenses),
    
    # Analytics Dashboard
    path('api/dashboard/', include('core.analytics.urls')),
    
    # AI Agent
    path('api/ai/', include('core.ai_agent.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
