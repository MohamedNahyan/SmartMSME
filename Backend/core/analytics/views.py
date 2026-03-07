from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services.revenue_service import total_revenue, monthly_revenue
from .services.expense_service import total_expenses, expense_by_category
from .services.profit_service import net_profit, profit_margin
from .services.sales_service import (
    top_products, 
    top_products_by_revenue, 
    average_order_value, 
    monthly_sales_growth
)
from .services.branch_service import branch_performance
from .services.reminder_service import (
    pending_reminders, 
    overdue_reminders, 
    upcoming_reminders
)


class DashboardOverview(APIView):
    """Get overall business metrics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        data = {
            "revenue": total_revenue(user),
            "expenses": total_expenses(user),
            "profit": net_profit(user),
            "profit_margin": profit_margin(user),
            "average_order_value": average_order_value(user),
            "pending_reminders": pending_reminders(user),
            "overdue_reminders": overdue_reminders(user)
        }
        
        return Response(data)


class RevenueTrend(APIView):
    """Get monthly revenue trend"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = monthly_revenue(request.user)
        return Response(data)


class ExpenseBreakdown(APIView):
    """Get expense breakdown by category"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = expense_by_category(request.user)
        return Response(data)


class TopProducts(APIView):
    """Get top 5 best-selling products by quantity"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = top_products(request.user)
        return Response(data)


class TopProductsByRevenue(APIView):
    """Get top 5 best-selling products by revenue"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = top_products_by_revenue(request.user)
        return Response(data)


class SalesGrowth(APIView):
    """Get monthly sales growth percentage"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = monthly_sales_growth(request.user)
        return Response(data)


class BranchPerformance(APIView):
    """Get performance metrics for all branches"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = branch_performance(request.user)
        return Response(data)


class ReminderStats(APIView):
    """Get reminder statistics and upcoming reminders"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        days = int(request.query_params.get('days', 7))
        
        data = {
            "pending": pending_reminders(user),
            "overdue": overdue_reminders(user),
            "upcoming": upcoming_reminders(user, days)
        }
        
        return Response(data)
