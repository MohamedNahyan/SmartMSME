from django.db.models import Sum
from core.models import Expense


def total_expenses(user, branch_id=None):
    qs = Expense.objects.filter(branch__user=user)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    return qs.aggregate(total=Sum("amount"))["total"] or 0


def expense_by_category(user, branch_id=None):
    qs = Expense.objects.filter(branch__user=user)
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    data = (
        qs.values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    return list(data)
