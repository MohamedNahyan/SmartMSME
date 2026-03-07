from django.db.models import Sum
from core.models import Expense


def total_expenses(user):
    """Calculate total expenses across all branches"""
    expenses = Expense.objects.filter(branch__user=user)
    result = expenses.aggregate(total=Sum("amount"))
    return result["total"] or 0


def expense_by_category(user):
    """Calculate expense breakdown by category"""
    expenses = Expense.objects.filter(branch__user=user)
    
    data = (
        expenses.values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    
    return list(data)
