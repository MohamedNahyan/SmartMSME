from .revenue_service import total_revenue
from .expense_service import total_expenses


def net_profit(user, branch_id=None, date_from=None, date_to=None):
    revenue = total_revenue(user, branch_id, date_from, date_to)
    expenses = total_expenses(user, branch_id, date_from, date_to)
    return revenue - expenses


def profit_margin(user, branch_id=None, date_from=None, date_to=None):
    revenue = total_revenue(user, branch_id, date_from, date_to)
    if revenue == 0:
        return 0
    profit = net_profit(user, branch_id, date_from, date_to)
    return (profit / revenue) * 100
