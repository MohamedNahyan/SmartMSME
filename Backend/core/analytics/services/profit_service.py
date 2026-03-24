from .revenue_service import total_revenue
from .expense_service import total_expenses


def net_profit(user, branch_id=None):
    revenue = total_revenue(user, branch_id)
    expenses = total_expenses(user, branch_id)
    return revenue - expenses


def profit_margin(user, branch_id=None):
    revenue = total_revenue(user, branch_id)
    if revenue == 0:
        return 0
    profit = net_profit(user, branch_id)
    return (profit / revenue) * 100
