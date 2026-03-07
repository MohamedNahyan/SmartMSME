from django.db.models import Sum
from core.models import Sale, Expense


def branch_performance(user):
    """Calculate performance metrics for each branch"""
    branches = user.branches.all()
    results = []
    
    for branch in branches:
        revenue = (
            Sale.objects.filter(branch=branch)
            .aggregate(total=Sum("total_amount"))["total"]
            or 0
        )
        
        expenses = (
            Expense.objects.filter(branch=branch)
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )
        
        results.append({
            "branch": branch.name,
            "revenue": revenue,
            "expenses": expenses,
            "profit": revenue - expenses
        })
    
    return results
