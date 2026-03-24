from django.db.models import Sum
from django.db.models.functions import TruncMonth
from core.models import Sale, Income


def total_revenue(user, branch_id=None):
    sale_qs = Sale.objects.filter(branch__user=user)
    income_qs = Income.objects.filter(branch__user=user)
    if branch_id:
        sale_qs = sale_qs.filter(branch_id=branch_id)
        income_qs = income_qs.filter(branch_id=branch_id)
    sales = sale_qs.aggregate(total=Sum("total_amount"))["total"] or 0
    income = income_qs.aggregate(total=Sum("amount"))["total"] or 0
    return sales + income


def revenue_per_branch(user):
    data = (
        Sale.objects.filter(branch__user=user)
        .values("branch__name")
        .annotate(revenue=Sum("total_amount"))
        .order_by("-revenue")
    )
    return list(data)


def monthly_revenue(user, branch_id=None):
    qs = Sale.objects.filter(branch__user=user)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    data = (
        qs.annotate(month=TruncMonth("sale_date"))
        .values("month")
        .annotate(revenue=Sum("total_amount"))
        .order_by("month")
    )
    return list(data)
