from django.db.models import Sum
from core.models import Sale, Expense, Income


def branch_performance(user, date_from=None, date_to=None):
    branches = user.branches.all()
    results = []

    for branch in branches:
        sale_qs = Sale.objects.filter(branch=branch)
        income_qs = Income.objects.filter(branch=branch)
        expense_qs = Expense.objects.filter(branch=branch)

        if date_from:
            sale_qs = sale_qs.filter(sale_date__gte=date_from)
            income_qs = income_qs.filter(income_date__gte=date_from)
            expense_qs = expense_qs.filter(expense_date__gte=date_from)
        if date_to:
            sale_qs = sale_qs.filter(sale_date__lte=date_to)
            income_qs = income_qs.filter(income_date__lte=date_to)
            expense_qs = expense_qs.filter(expense_date__lte=date_to)

        sale_revenue = sale_qs.aggregate(total=Sum("total_amount"))["total"] or 0
        income_revenue = income_qs.aggregate(total=Sum("amount"))["total"] or 0
        revenue = sale_revenue + income_revenue
        expenses = expense_qs.aggregate(total=Sum("amount"))["total"] or 0

        results.append({
            "name": branch.name,
            "revenue": revenue,
            "expenses": expenses,
            "profit": revenue - expenses
        })

    return results
