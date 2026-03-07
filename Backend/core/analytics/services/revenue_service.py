from django.db.models import Sum
from django.db.models.functions import TruncMonth
from core.models import Sale, Income


def total_revenue(user):
    """Calculate total revenue from sales and income"""
    sales = Sale.objects.filter(branch__user=user).aggregate(total=Sum("total_amount"))["total"] or 0
    income = Income.objects.filter(branch__user=user).aggregate(total=Sum("amount"))["total"] or 0
    return sales + income


def revenue_per_branch(user):
    """Calculate revenue breakdown by branch"""
    sales = Sale.objects.filter(branch__user=user)
    
    data = (
        sales.values("branch__name")
        .annotate(revenue=Sum("total_amount"))
        .order_by("-revenue")
    )
    
    return list(data)


def monthly_revenue(user):
    """Calculate monthly revenue trend"""
    sales = Sale.objects.filter(branch__user=user)
    
    data = (
        sales.annotate(month=TruncMonth("sale_date"))
        .values("month")
        .annotate(revenue=Sum("total_amount"))
        .order_by("month")
    )
    
    return list(data)
