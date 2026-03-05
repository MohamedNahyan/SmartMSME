import pandas as pd
from decimal import Decimal
from django.db import transaction
from django.utils.dateparse import parse_datetime

from .models import (
    Sale, SaleItem, Product, Branch,
    IncomeCategory, Income,
    ExpenseCategory, Expense
)


# ------------------------------------------------
# SALES IMPORT
# ------------------------------------------------

def process_sales_file(file_path, branch_id):

    df = pd.read_excel(file_path) if file_path.endswith(".xlsx") else pd.read_csv(file_path)

    branch = Branch.objects.get(id=branch_id)

    required_columns = {"invoice_number", "sale_date", "product_name", "quantity", "unit_price"}

    if not required_columns.issubset(df.columns):
        raise ValueError(f"Missing required columns: {required_columns - set(df.columns)}")

    errors = []
    product_cache = {}

    with transaction.atomic():

        for index, row in df.iterrows():

            try:

                product_name = str(row["product_name"]).strip()

                if not product_name:
                    raise ValueError("Product name is missing")

                product_key = product_name.lower()

                sale_date = parse_datetime(str(row["sale_date"]))

                if not sale_date:
                    raise ValueError("Invalid sale_date")

                quantity = row["quantity"]
                unit_price = row["unit_price"]

                if pd.isna(quantity):
                    raise ValueError("Quantity is missing")

                if pd.isna(unit_price):
                    raise ValueError("Unit price is missing")

                quantity = int(quantity)
                unit_price = Decimal(unit_price)

                sale, created = Sale.objects.get_or_create(
                    invoice_number=row["invoice_number"],
                    defaults={
                        "sale_date": sale_date,
                        "branch": branch
                    }
                )

                # PRODUCT LOOKUP

                if product_key in product_cache:
                    product = product_cache[product_key]

                else:

                    product = Product.objects.filter(
                        branch=branch,
                        name__iexact=product_name
                    ).first()

                    if not product:
                        product = Product.objects.create(
                            name=product_name,
                            default_price=unit_price,
                            branch=branch
                        )

                    product_cache[product_key] = product

                # SALE ITEM

                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )

            except Exception as e:

                errors.append({
                    "row": index + 2,
                    "error": str(e)
                })

        if errors:
            error_messages = "\n".join(
                [f"Row {e['row']} → {e['error']}" for e in errors]
            )
            raise Exception(f"Sales import failed:\n\n{error_messages}")


# ------------------------------------------------
# INCOME IMPORT
# ------------------------------------------------

def process_income_file(file_path, branch_id):

    df = pd.read_excel(file_path) if file_path.endswith(".xlsx") else pd.read_csv(file_path)

    branch = Branch.objects.get(id=branch_id)

    required_columns = {"category", "amount", "income_date"}

    if not required_columns.issubset(df.columns):
        raise ValueError(f"Missing columns: {required_columns - set(df.columns)}")

    errors = []
    category_cache = {}

    with transaction.atomic():

        for index, row in df.iterrows():

            try:

                category_name = str(row["category"]).strip()

                if not category_name:
                    raise ValueError("Category is missing")

                category_key = category_name.lower()

                income_date = parse_datetime(str(row["income_date"]))

                if not income_date:
                    raise ValueError("Invalid income_date")

                amount = row["amount"]

                if pd.isna(amount):
                    raise ValueError("Amount is missing")

                amount = Decimal(amount)

                if category_key in category_cache:
                    category = category_cache[category_key]

                else:

                    category = IncomeCategory.objects.filter(
                        user=branch.user,
                        name__iexact=category_name
                    ).first()

                    if not category:
                        category = IncomeCategory.objects.create(
                            name=category_name,
                            user=branch.user
                        )

                    category_cache[category_key] = category

                Income.objects.create(
                    branch=branch,
                    category=category,
                    amount=amount,
                    description=row.get("description", ""),
                    income_date=income_date
                )

            except Exception as e:

                errors.append({
                    "row": index + 2,
                    "error": str(e)
                })

        if errors:
            error_messages = "\n".join(
                [f"Row {e['row']} → {e['error']}" for e in errors]
            )
            raise Exception(f"Income import failed:\n\n{error_messages}")


# ------------------------------------------------
# EXPENSE IMPORT
# ------------------------------------------------

def process_expense_file(file_path, branch_id):

    df = pd.read_excel(file_path) if file_path.endswith(".xlsx") else pd.read_csv(file_path)

    branch = Branch.objects.get(id=branch_id)

    required_columns = {"category", "amount", "expense_date"}

    if not required_columns.issubset(df.columns):
        raise ValueError(f"Missing columns: {required_columns - set(df.columns)}")

    errors = []
    category_cache = {}

    with transaction.atomic():

        for index, row in df.iterrows():

            try:

                category_name = str(row["category"]).strip()

                if not category_name:
                    raise ValueError("Category is missing")

                category_key = category_name.lower()

                expense_date = parse_datetime(str(row["expense_date"]))

                if not expense_date:
                    raise ValueError("Invalid expense_date")

                amount = row["amount"]

                if pd.isna(amount):
                    raise ValueError("Amount is missing")

                amount = Decimal(amount)

                if category_key in category_cache:
                    category = category_cache[category_key]

                else:

                    category = ExpenseCategory.objects.filter(
                        user=branch.user,
                        name__iexact=category_name
                    ).first()

                    if not category:
                        category = ExpenseCategory.objects.create(
                            name=category_name,
                            user=branch.user
                        )

                    category_cache[category_key] = category

                Expense.objects.create(
                    branch=branch,
                    category=category,
                    amount=amount,
                    description=row.get("description", ""),
                    expense_date=expense_date
                )

            except Exception as e:

                errors.append({
                    "row": index + 2,
                    "error": str(e)
                })

        if errors:
            error_messages = "\n".join(
                [f"Row {e['row']} → {e['error']}" for e in errors]
            )
            raise Exception(f"Expense import failed:\n\n{error_messages}")