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
    monthly_sales_growth,
    total_sales_count
)
from .services.branch_service import branch_performance
from .services.reminder_service import (
    pending_reminders,
    overdue_reminders,
    upcoming_reminders
)


class DashboardOverview(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        branch_id = request.query_params.get('branch_id') or None

        data = {
            "revenue": total_revenue(user, branch_id),
            "expenses": total_expenses(user, branch_id),
            "profit": net_profit(user, branch_id),
            "profit_margin": profit_margin(user, branch_id),
            "average_order_value": average_order_value(user, branch_id),
            "total_sales": total_sales_count(user, branch_id),
            "pending_reminders": pending_reminders(user),
            "overdue_reminders": overdue_reminders(user)
        }

        return Response(data)


class RevenueTrend(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        data = monthly_revenue(request.user, branch_id)
        return Response(data)


class ExpenseBreakdown(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        data = expense_by_category(request.user, branch_id)
        return Response(data)


class TopProducts(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        data = top_products(request.user, branch_id)
        return Response(data)


class TopProductsByRevenue(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        data = top_products_by_revenue(request.user, branch_id)
        return Response(data)


class SalesGrowth(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        data = monthly_sales_growth(request.user, branch_id)
        return Response(data)


class BranchPerformance(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = branch_performance(request.user)
        return Response(data)


class ReminderStats(APIView):
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
