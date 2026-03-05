import pandas as pd
from django.db import transaction
from django.utils.dateparse import parse_datetime

from .models import (
    Sale, SaleItem, Product, Branch,
    IncomeCategory, Income,
    ExpenseCategory, Expense
)


def process_sales_file(file_path, branch_id):
    df = pd.read_excel(file_path) if file_path.endswith(".xlsx") else pd.read_csv(file_path)

    branch = Branch.objects.get(id=branch_id)

    required_columns = {"invoice_number", "sale_date", "product_name", "quantity", "unit_price"}

    if not required_columns.issubset(df.columns):
        raise ValueError(f"Missing required columns: {required_columns - set(df.columns)}")

    with transaction.atomic():

        for _, row in df.iterrows():

            sale, created = Sale.objects.get_or_create(
                invoice_number=row["invoice_number"],
                defaults={
                    "sale_date": parse_datetime(str(row["sale_date"])),
                    "branch": branch
                }
            )

            product = Product.objects.filter(
                name=row["product_name"],
                branch=branch
            ).first()

            if not product:
                product = Product.objects.create(
                    name=row["product_name"],
                    default_price=row["unit_price"],
                    branch=branch
                )

            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=int(row["quantity"]),
                unit_price=float(row["unit_price"])
            )

#Income Import Function
def process_income_file(file_path, branch_id):

    df = pd.read_excel(file_path) if file_path.endswith(".xlsx") else pd.read_csv(file_path)

    branch = Branch.objects.get(id=branch_id)

    required_columns = {"category", "amount", "income_date"}

    if not required_columns.issubset(df.columns):
        raise ValueError(f"Missing columns: {required_columns - set(df.columns)}")

    with transaction.atomic():

        for _, row in df.iterrows():

            category = IncomeCategory.objects.filter(
                name=row["category"],
                user=branch.user
            ).first()

            if not category:
                category = IncomeCategory.objects.create(
                    name=row["category"],
                    user=branch.user
                )

            Income.objects.create(
                branch=branch,
                category=category,
                amount=float(row["amount"]),
                description=row.get("description", ""),
                income_date=parse_datetime(str(row["income_date"]))
            )

#Expense Import Function
def process_expense_file(file_path, branch_id):

    df = pd.read_excel(file_path) if file_path.endswith(".xlsx") else pd.read_csv(file_path)

    branch = Branch.objects.get(id=branch_id)

    required_columns = {"category", "amount", "expense_date"}

    if not required_columns.issubset(df.columns):
        raise ValueError(f"Missing columns: {required_columns - set(df.columns)}")

    with transaction.atomic():

        for _, row in df.iterrows():

            category = ExpenseCategory.objects.filter(
                name=row["category"],
                user=branch.user
            ).first()

            if not category:
                category = ExpenseCategory.objects.create(
                    name=row["category"],
                    user=branch.user
                )

            Expense.objects.create(
                branch=branch,
                category=category,
                amount=float(row["amount"]),
                description=row.get("description", ""),
                expense_date=parse_datetime(str(row["expense_date"]))
            )