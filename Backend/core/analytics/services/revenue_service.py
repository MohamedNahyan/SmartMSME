from django.db.models import Sum
from django.db.models.functions import TruncMonth
from core.models import Sale, Income


def total_revenue(user, branch_id=None, date_from=None, date_to=None):
    sale_qs = Sale.objects.filter(branch__user=user)
    income_qs = Income.objects.filter(branch__user=user)
    if branch_id:
        sale_qs = sale_qs.filter(branch_id=branch_id)
        income_qs = income_qs.filter(branch_id=branch_id)
    if date_from:
        sale_qs = sale_qs.filter(sale_date__gte=date_from)
        income_qs = income_qs.filter(income_date__gte=date_from)
    if date_to:
        sale_qs = sale_qs.filter(sale_date__lte=date_to)
        income_qs = income_qs.filter(income_date__lte=date_to)
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


def monthly_revenue(user, branch_id=None, date_from=None, date_to=None):
    qs = Sale.objects.filter(branch__user=user)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    if date_from:
        qs = qs.filter(sale_date__gte=date_from)
    if date_to:
        qs = qs.filter(sale_date__lte=date_to)
    data = (
        qs.annotate(month=TruncMonth("sale_date"))
        .values("month")
        .annotate(revenue=Sum("total_amount"))
        .order_by("month")
    )
    return list(data)
