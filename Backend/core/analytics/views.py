from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum
from core.models import Income

from .services.revenue_service import total_revenue, monthly_revenue
from .services.expense_service import total_expenses, expense_by_category
from .services.profit_service import net_profit, profit_margin
from .services.sales_service import (
    top_products, top_products_by_revenue,
    average_order_value, monthly_sales_growth, total_sales_count
)
from .services.branch_service import branch_performance
from .services.reminder_service import pending_reminders, overdue_reminders, upcoming_reminders


def _get_date_range(request):
    preset = request.query_params.get('range')
    now = timezone.now()
    if preset == 'this_month':
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0), now
    if preset == 'last_month':
        first_this = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = first_this - timedelta(seconds=1)
        last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return last_month_start, last_month_end
    if preset == 'this_year':
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0), now
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    df = timezone.make_aware(datetime.strptime(date_from, '%Y-%m-%d')) if date_from else None
    dt = timezone.make_aware(datetime.strptime(date_to, '%Y-%m-%d').replace(hour=23, minute=59, second=59)) if date_to else None
    return df, dt


def _total_income_only(user, branch_id=None, date_from=None, date_to=None):
    qs = Income.objects.filter(branch__user=user)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    if date_from:
        qs = qs.filter(income_date__gte=date_from)
    if date_to:
        qs = qs.filter(income_date__lte=date_to)
    return float(qs.aggregate(total=Sum('amount'))['total'] or 0)


class DashboardOverview(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        branch_id = request.query_params.get('branch_id') or None
        date_from, date_to = _get_date_range(request)

        revenue = total_revenue(user, branch_id, date_from, date_to)
        expenses = total_expenses(user, branch_id, date_from, date_to)
        profit = net_profit(user, branch_id, date_from, date_to)
        margin = profit_margin(user, branch_id, date_from, date_to)
        expense_ratio = round((float(expenses) / float(revenue)) * 100, 1) if revenue else 0

        data = {
            "revenue": revenue,
            "expenses": expenses,
            "profit": profit,
            "profit_margin": margin,
            "expense_ratio": expense_ratio,
            "total_income": _total_income_only(user, branch_id, date_from, date_to),
            "average_order_value": average_order_value(user, branch_id, date_from, date_to),
            "total_sales": total_sales_count(user, branch_id, date_from, date_to),
            "pending_reminders": pending_reminders(user),
            "overdue_reminders": overdue_reminders(user),
            "upcoming_reminders": upcoming_reminders(user, days=7),
        }
        return Response(data)


class RevenueTrend(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        date_from, date_to = _get_date_range(request)
        data = monthly_revenue(request.user, branch_id, date_from, date_to)
        return Response(data)


class ExpenseBreakdown(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        date_from, date_to = _get_date_range(request)
        data = expense_by_category(request.user, branch_id, date_from, date_to)
        return Response(data)


class TopProducts(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        date_from, date_to = _get_date_range(request)
        data = top_products(request.user, branch_id, date_from, date_to)
        return Response(data)


class TopProductsByRevenue(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get('branch_id') or None
        date_from, date_to = _get_date_range(request)
        data = top_products_by_revenue(request.user, branch_id, date_from, date_to)
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
        date_from, date_to = _get_date_range(request)
        data = branch_performance(request.user, date_from, date_to)
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
