from .revenue_service import total_revenue
from .expense_service import total_expenses


def net_profit(user):
    """Calculate net profit (revenue - expenses)"""
    revenue = total_revenue(user)
    expenses = total_expenses(user)
    return revenue - expenses


def profit_margin(user):
    """Calculate profit margin percentage"""
    revenue = total_revenue(user)
    
    if revenue == 0:
        return 0
    
    profit = net_profit(user)
    return (profit / revenue) * 100
