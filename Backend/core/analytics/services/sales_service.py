from django.db.models import Sum, Avg, F
from django.db.models.functions import TruncMonth
from core.models import SaleItem, Sale
from decimal import Decimal


def top_products(user):
    """Get top 5 best-selling products by quantity"""
    items = SaleItem.objects.filter(sale__branch__user=user)
    
    data = (
        items.values("product__name")
        .annotate(quantity=Sum("quantity"))
        .order_by("-quantity")[:5]
    )
    
    return list(data)


def top_products_by_revenue(user):
    """Get top 5 best-selling products by revenue"""
    items = SaleItem.objects.filter(sale__branch__user=user)
    
    data = (
        items.values("product__name")
        .annotate(revenue=Sum("line_total"))
        .order_by("-revenue")[:5]
    )
    
    return list(data)


def average_order_value(user):
    """Calculate average order value"""
    sales = Sale.objects.filter(branch__user=user)
    result = sales.aggregate(avg=Avg("total_amount"))
    return result["avg"] or 0


def monthly_sales_growth(user):
    """Calculate month-over-month sales growth percentage"""
    sales = Sale.objects.filter(branch__user=user)
    
    monthly_data = list(
        sales.annotate(month=TruncMonth("sale_date"))
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
        
        if prev > 0:
            growth = ((curr - prev) / prev) * 100
        else:
            growth = 0
        
        growth_data.append({
            "month": monthly_data[i]["month"],
            "revenue": curr,
            "growth_percentage": round(float(growth), 2)
        })
    
    return growth_data
