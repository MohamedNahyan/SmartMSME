from django.db.models import Sum
from core.models import Sale, Expense, Income


def branch_performance(user):
    branches = user.branches.all()
    results = []

    for branch in branches:
        sale_revenue = (
            Sale.objects.filter(branch=branch)
            .aggregate(total=Sum("total_amount"))["total"] or 0
        )
        income_revenue = (
            Income.objects.filter(branch=branch)
            .aggregate(total=Sum("amount"))["total"] or 0
        )
        revenue = sale_revenue + income_revenue

        expenses = (
            Expense.objects.filter(branch=branch)
            .aggregate(total=Sum("amount"))["total"] or 0
        )

        results.append({
            "name": branch.name,
            "revenue": revenue,
            "expenses": expenses,
            "profit": revenue - expenses
        })

    return results
