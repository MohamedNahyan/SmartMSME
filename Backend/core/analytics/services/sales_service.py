from django.db.models import Sum, Avg
from django.db.models.functions import TruncMonth
from core.models import SaleItem, Sale
from decimal import Decimal


def top_products(user, branch_id=None, date_from=None, date_to=None):
    qs = SaleItem.objects.filter(sale__branch__user=user)
    if branch_id:
        qs = qs.filter(sale__branch_id=branch_id)
    if date_from:
        qs = qs.filter(sale__sale_date__gte=date_from)
    if date_to:
        qs = qs.filter(sale__sale_date__lte=date_to)
    data = (
        qs.values("product__name")
        .annotate(quantity=Sum("quantity"))
        .order_by("-quantity")[:5]
    )
    return list(data)


def top_products_by_revenue(user, branch_id=None, date_from=None, date_to=None):
    qs = SaleItem.objects.filter(sale__branch__user=user)
    if branch_id:
        qs = qs.filter(sale__branch_id=branch_id)
    if date_from:
        qs = qs.filter(sale__sale_date__gte=date_from)
    if date_to:
        qs = qs.filter(sale__sale_date__lte=date_to)
    data = (
        qs.values("product__name")
        .annotate(revenue=Sum("line_total"))
        .order_by("-revenue")[:5]
    )
    return list(data)


def average_order_value(user, branch_id=None, date_from=None, date_to=None):
    qs = Sale.objects.filter(branch__user=user)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    if date_from:
        qs = qs.filter(sale_date__gte=date_from)
    if date_to:
        qs = qs.filter(sale_date__lte=date_to)
    return qs.aggregate(avg=Avg("total_amount"))["avg"] or 0


def total_sales_count(user, branch_id=None, date_from=None, date_to=None):
    qs = Sale.objects.filter(branch__user=user)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    if date_from:
        qs = qs.filter(sale_date__gte=date_from)
    if date_to:
        qs = qs.filter(sale_date__lte=date_to)
    return qs.count()


def monthly_sales_growth(user, branch_id=None):
    qs = Sale.objects.filter(branch__user=user)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    monthly_data = list(
        qs.annotate(month=TruncMonth("sale_date"))
        .values("month")
        .annotate(revenue=Sum("total_amount"))
        .order_by("month")
    )
    if len(monthly_data) < 2:
        return []
    growth_data = []
    for i in range(1, len(monthly_data)):
        prev = monthly_data[i-1]["revenue"] or Decimal(0)
        curr = monthly_data[i]["revenue"] or Decimal(0)
        growth = ((curr - prev) / prev) * 100 if prev > 0 else 0
        growth_data.append({
            "month": monthly_data[i]["month"],
            "revenue": curr,
            "growth_rate": round(float(growth), 2)
        })
    return growth_data
