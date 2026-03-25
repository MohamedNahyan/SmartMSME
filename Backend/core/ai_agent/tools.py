from core.models import Sale, Expense, Income, Branch, Product, Reminder, SaleItem
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from .date_parser import DateParser


def _parse_date_str(date_str: str):
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%d %B %Y', '%d %b %Y',
                '%B %d %Y', '%b %d %Y', '%d %B, %Y', '%d %b, %Y'):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None


class BusinessTools:
    def __init__(self, user):
        self.user = user

    def get_total_revenue(self, branch_name=None, time_period=None):
        sales = Sale.objects.filter(branch__user=self.user)
        income = Income.objects.filter(branch__user=self.user)
        if branch_name:
            sales = sales.filter(branch__name__icontains=branch_name)
            income = income.filter(branch__name__icontains=branch_name)
        start_date, end_date = DateParser.parse_time_period(time_period)
        if start_date and end_date:
            sales = sales.filter(sale_date__range=[start_date, end_date])
            income = income.filter(income_date__range=[start_date, end_date])
        sales_total = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        income_total = income.aggregate(total=Sum('amount'))['total'] or 0
        total = sales_total + income_total
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        return f"Total revenue{period_str}: ₹{total} (Sales: ₹{sales_total}, Other Income: ₹{income_total})"

    def get_total_expenses(self, branch_name=None, time_period=None):
        expenses = Expense.objects.filter(branch__user=self.user)
        if branch_name:
            expenses = expenses.filter(branch__name__icontains=branch_name)
        start_date, end_date = DateParser.parse_time_period(time_period)
        if start_date and end_date:
            expenses = expenses.filter(expense_date__range=[start_date, end_date])
        total = expenses.aggregate(total=Sum('amount'))['total'] or 0
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        return f"Total expenses{period_str}: ₹{total}"

    def get_profit(self, branch_name=None, time_period=None):
        sales = Sale.objects.filter(branch__user=self.user)
        income = Income.objects.filter(branch__user=self.user)
        expenses = Expense.objects.filter(branch__user=self.user)
        if branch_name:
            sales = sales.filter(branch__name__icontains=branch_name)
            income = income.filter(branch__name__icontains=branch_name)
            expenses = expenses.filter(branch__name__icontains=branch_name)
        start_date, end_date = DateParser.parse_time_period(time_period)
        if start_date and end_date:
            sales = sales.filter(sale_date__range=[start_date, end_date])
            income = income.filter(income_date__range=[start_date, end_date])
            expenses = expenses.filter(expense_date__range=[start_date, end_date])
        sales_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        other_income = income.aggregate(total=Sum('amount'))['total'] or 0
        total_revenue = sales_revenue + other_income
        expense = expenses.aggregate(total=Sum('amount'))['total'] or 0
        profit = total_revenue - expense
        margin = (profit / total_revenue * 100) if total_revenue > 0 else 0
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        return (
            f"Profit{period_str}: ₹{profit} | "
            f"Total Revenue: ₹{total_revenue} (Sales: ₹{sales_revenue}, Other Income: ₹{other_income}) | "
            f"Expenses: ₹{expense} | Margin: {margin:.1f}%"
        )

    def get_top_products(self, limit=5, time_period=None):
        sale_items = SaleItem.objects.filter(sale__branch__user=self.user)
        start_date, end_date = DateParser.parse_time_period(time_period)
        if start_date and end_date:
            sale_items = sale_items.filter(sale__sale_date__range=[start_date, end_date])
        products = (
            sale_items
            .values('product__name', 'product__branch__name')
            .annotate(total_quantity=Sum('quantity'), total_revenue=Sum('line_total'))
            .order_by('-total_revenue')[:limit]
        )
        if not products:
            return "No product sales data available"
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        lines = [f"Top Products{period_str}:"]
        for i, p in enumerate(products, 1):
            lines.append(f"{i}. {p['product__name']} ({p['product__branch__name']}): {p['total_quantity']} units, ₹{p['total_revenue']}")
        return "\n".join(lines)

    def get_branch_performance(self, time_period=None):
        branches = Branch.objects.filter(user=self.user)
        if not branches:
            return "No branches found"
        start_date, end_date = DateParser.parse_time_period(time_period)
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        lines = [f"Branch Performance{period_str}:"]
        for branch in branches:
            sales = Sale.objects.filter(branch=branch)
            income = Income.objects.filter(branch=branch)
            expenses = Expense.objects.filter(branch=branch)
            if start_date and end_date:
                sales = sales.filter(sale_date__range=[start_date, end_date])
                income = income.filter(income_date__range=[start_date, end_date])
                expenses = expenses.filter(expense_date__range=[start_date, end_date])
            sales_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
            other_income = income.aggregate(total=Sum('amount'))['total'] or 0
            total_revenue = sales_revenue + other_income
            expense_total = expenses.aggregate(total=Sum('amount'))['total'] or 0
            profit = total_revenue - expense_total
            lines.append(f"\n{branch.name}: Revenue ₹{total_revenue}, Expenses ₹{expense_total}, Profit ₹{profit}")
        return "\n".join(lines)

    def get_expense_breakdown(self, time_period=None):
        expense_query = Expense.objects.filter(branch__user=self.user)
        start_date, end_date = DateParser.parse_time_period(time_period)
        if start_date and end_date:
            expense_query = expense_query.filter(expense_date__range=[start_date, end_date])
        expenses = (
            expense_query
            .values('category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        if not expenses:
            return "No expense data available"
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        lines = [f"Expense Breakdown{period_str}:"]
        lines += [f"- {exp['category__name']}: ₹{exp['total']}" for exp in expenses]
        return "\n".join(lines)

    def get_monthly_trend(self, months=6, time_period=None):
        start_date, end_date = DateParser.parse_time_period(time_period)
        cutoff_date = start_date if start_date else datetime.now() - timedelta(days=months * 30)
        monthly = (
            Sale.objects
            .filter(branch__user=self.user, sale_date__gte=cutoff_date)
            .annotate(month=TruncMonth('sale_date'))
            .values('month')
            .annotate(revenue=Sum('total_amount'))
            .order_by('month')
        )
        if not monthly:
            return "No sales data in specified period"
        lines = ["Monthly Revenue Trend:"]
        lines += [f"{m['month'].strftime('%B %Y')}: ₹{m['revenue']}" for m in monthly]
        return "\n".join(lines)

    def get_pending_reminders(self):
        reminders = Reminder.objects.filter(user=self.user, is_completed=False).order_by('due_date')[:10]
        if not reminders:
            return "No pending reminders"
        lines = ["Pending Reminders:"]
        lines += [f"- {r.title} (Due: {r.due_date.strftime('%d %b %Y')})" for r in reminders]
        return "\n".join(lines)

    def get_all_reminders(self):
        reminders = Reminder.objects.filter(user=self.user).order_by('is_completed', 'due_date')[:20]
        if not reminders:
            return "You have no reminders."
        lines = ["Your Reminders:"]
        for r in reminders:
            status = "✅ Done" if r.is_completed else "⏳ Pending"
            lines.append(f"- {r.title} | Due: {r.due_date.strftime('%d %b %Y')} | {status}")
        return "\n".join(lines)

    # ── Date-specific record queries ───────────────────────────────

    def get_records_by_date(self, record_type: str, date_str: str, branch_name: str = None):
        """Show income / expense / sales for a specific date."""
        now = datetime.now()
        date_str_lower = date_str.strip().lower()

        if date_str_lower == 'today':
            target = now.date()
        elif date_str_lower == 'yesterday':
            target = (now - timedelta(days=1)).date()
        else:
            parsed = _parse_date_str(date_str)
            if not parsed:
                return f"❌ Couldn't understand the date '{date_str}'. Try '15 Jan 2024', 'today', or 'yesterday'."
            target = parsed.date()

        date_label = target.strftime('%d %b %Y')
        start = datetime(target.year, target.month, target.day, 0, 0, 0)
        end = datetime(target.year, target.month, target.day, 23, 59, 59)

        if record_type == 'income':
            qs = Income.objects.filter(branch__user=self.user, income_date__range=[start, end])
            if branch_name:
                qs = qs.filter(branch__name__icontains=branch_name)
            if not qs.exists():
                return f"No income records found for {date_label}."
            total = qs.aggregate(t=Sum('amount'))['t'] or 0
            lines = [f"Income on {date_label}:"]
            for r in qs.order_by('income_date'):
                desc = f" | {r.description}" if r.description else ""
                lines.append(f"- ₹{r.amount} | {r.category.name} | {r.branch.name}{desc}")
            lines.append(f"Total: ₹{total}")
            return "\n".join(lines)

        elif record_type == 'expense':
            qs = Expense.objects.filter(branch__user=self.user, expense_date__range=[start, end])
            if branch_name:
                qs = qs.filter(branch__name__icontains=branch_name)
            if not qs.exists():
                return f"No expense records found for {date_label}."
            total = qs.aggregate(t=Sum('amount'))['t'] or 0
            lines = [f"Expenses on {date_label}:"]
            for r in qs.order_by('expense_date'):
                desc = f" | {r.description}" if r.description else ""
                lines.append(f"- ₹{r.amount} | {r.category.name} | {r.branch.name}{desc}")
            lines.append(f"Total: ₹{total}")
            return "\n".join(lines)

        elif record_type == 'sales':
            qs = Sale.objects.filter(branch__user=self.user, sale_date__range=[start, end])
            if branch_name:
                qs = qs.filter(branch__name__icontains=branch_name)
            if not qs.exists():
                return f"No sales found for {date_label}."
            total = qs.aggregate(t=Sum('total_amount'))['t'] or 0
            lines = [f"Sales on {date_label}:"]
            for s in qs.order_by('sale_date'):
                items = ', '.join(f"{i.quantity}x {i.product.name}" for i in s.items.all())
                lines.append(f"- Invoice {s.invoice_number} | {s.branch.name} | {items} | ₹{s.total_amount}")
            lines.append(f"Total: ₹{total}")
            return "\n".join(lines)

        return "Unknown record type."

    # ── Month-specific record queries ──────────────────────────────

    def get_records_by_month(self, record_type: str, month: int, year: int, branch_name: str = None):
        """Show income / expense / sales for a full month."""
        start = datetime(year, month, 1, 0, 0, 0)
        end = (start + relativedelta(months=1)) - timedelta(seconds=1)
        month_label = start.strftime('%B %Y')

        if record_type == 'income':
            qs = Income.objects.filter(branch__user=self.user, income_date__range=[start, end])
            if branch_name:
                qs = qs.filter(branch__name__icontains=branch_name)
            if not qs.exists():
                return f"No income records found for {month_label}."
            total = qs.aggregate(t=Sum('amount'))['t'] or 0
            lines = [f"Income in {month_label}:"]
            for r in qs.order_by('income_date'):
                desc = f" | {r.description}" if r.description else ""
                lines.append(f"- {r.income_date.strftime('%d')} | ₹{r.amount} | {r.category.name} | {r.branch.name}{desc}")
            lines.append(f"Total: ₹{total}")
            return "\n".join(lines)

        elif record_type == 'expense':
            qs = Expense.objects.filter(branch__user=self.user, expense_date__range=[start, end])
            if branch_name:
                qs = qs.filter(branch__name__icontains=branch_name)
            if not qs.exists():
                return f"No expense records found for {month_label}."
            total = qs.aggregate(t=Sum('amount'))['t'] or 0
            lines = [f"Expenses in {month_label}:"]
            for r in qs.order_by('expense_date'):
                desc = f" | {r.description}" if r.description else ""
                lines.append(f"- {r.expense_date.strftime('%d')} | ₹{r.amount} | {r.category.name} | {r.branch.name}{desc}")
            lines.append(f"Total: ₹{total}")
            return "\n".join(lines)

        elif record_type == 'sales':
            qs = Sale.objects.filter(branch__user=self.user, sale_date__range=[start, end])
            if branch_name:
                qs = qs.filter(branch__name__icontains=branch_name)
            if not qs.exists():
                return f"No sales found for {month_label}."
            total = qs.aggregate(t=Sum('total_amount'))['t'] or 0
            lines = [f"Sales in {month_label}:"]
            for s in qs.order_by('sale_date'):
                items = ', '.join(f"{i.quantity}x {i.product.name}" for i in s.items.all())
                lines.append(f"- {s.sale_date.strftime('%d')} | Invoice {s.invoice_number} | {s.branch.name} | {items} | ₹{s.total_amount}")
            lines.append(f"Total: ₹{total}")
            return "\n".join(lines)

        return "Unknown record type."

    # ── Write Actions ──────────────────────────────────────────────

    def get_branches_list(self):
        return list(Branch.objects.filter(user=self.user).values('id', 'name'))

    def _resolve_branch(self, branch_name: str):
        if not branch_name:
            return None
        return Branch.objects.filter(user=self.user, name__iexact=branch_name).first()

    def complete_reminder(self, title_keyword: str):
        reminders = Reminder.objects.filter(
            user=self.user, is_completed=False, title__icontains=title_keyword
        )
        if not reminders.exists():
            if Reminder.objects.filter(user=self.user, title__icontains=title_keyword).exists():
                return f"⚠️ '{title_keyword}' is already marked as complete."
            return f"❌ No reminder found matching '{title_keyword}'."
        if reminders.count() > 1:
            names = ', '.join(f"'{r.title}'" for r in reminders)
            return f"Found multiple reminders matching '{title_keyword}': {names}. Please be more specific."
        reminder = reminders.first()
        reminder.is_completed = True
        reminder.save()
        return f"✅ Reminder '{reminder.title}' marked as complete."

    def uncomplete_reminder(self, title_keyword: str):
        reminders = Reminder.objects.filter(
            user=self.user, is_completed=True, title__icontains=title_keyword
        )
        if not reminders.exists():
            if Reminder.objects.filter(user=self.user, title__icontains=title_keyword).exists():
                return f"⚠️ '{title_keyword}' is already pending (not completed)."
            return f"❌ No reminder found matching '{title_keyword}'."
        if reminders.count() > 1:
            names = ', '.join(f"'{r.title}'" for r in reminders)
            return f"Found multiple reminders matching '{title_keyword}': {names}. Please be more specific."
        reminder = reminders.first()
        reminder.is_completed = False
        reminder.save()
        return f"↩️ Reminder '{reminder.title}' marked as pending again."

    def delete_reminder(self, title_keyword: str):
        reminders = Reminder.objects.filter(user=self.user, title__icontains=title_keyword)
        if not reminders.exists():
            return f"❌ No reminder found matching '{title_keyword}'."
        if reminders.count() > 1:
            names = ', '.join(f"'{r.title}'" for r in reminders)
            return f"Found multiple reminders matching '{title_keyword}': {names}. Please be more specific."
        reminder = reminders.first()
        title = reminder.title
        reminder.delete()
        return f"🗑️ Reminder '{title}' has been deleted."

    def create_reminder(self, title: str, due_date, branch_name: str = None, description: str = ''):
        branch = self._resolve_branch(branch_name)
        if not branch:
            return None
        if isinstance(due_date, str):
            due_date = _parse_date_str(due_date) or datetime.now()
        reminder = Reminder.objects.create(
            user=self.user, branch=branch, title=title,
            description=description, due_date=due_date or datetime.now(),
        )
        return f"✅ Reminder created: '{reminder.title}' due on {reminder.due_date.strftime('%d %b %Y')} for branch '{branch.name}'"

    def add_expense(self, amount, category_name: str, branch_name: str = None, description: str = '', date=None):
        from core.models import ExpenseCategory
        branch = self._resolve_branch(branch_name)
        if not branch:
            return None
        category = ExpenseCategory.objects.filter(user=self.user, name__iexact=category_name).first()
        if not category:
            category = ExpenseCategory.objects.create(user=self.user, name=category_name)
        expense_date = (_parse_date_str(date) if isinstance(date, str) else date) or datetime.now()
        Expense.objects.create(
            branch=branch, category=category, amount=amount,
            description=description, expense_date=expense_date,
        )
        return f"✅ Expense recorded: ₹{amount} under '{category.name}' for branch '{branch.name}'"

    def add_income(self, amount, category_name: str, branch_name: str = None, description: str = '', date=None):
        from core.models import IncomeCategory
        branch = self._resolve_branch(branch_name)
        if not branch:
            return None
        category = IncomeCategory.objects.filter(user=self.user, name__iexact=category_name).first()
        if not category:
            category = IncomeCategory.objects.create(user=self.user, name=category_name)
        income_date = (_parse_date_str(date) if isinstance(date, str) else date) or datetime.now()
        Income.objects.create(
            branch=branch, category=category, amount=amount,
            description=description, income_date=income_date,
        )
        return f"✅ Income recorded: ₹{amount} under '{category.name}' for branch '{branch.name}'"

    def add_sale(self, product_name: str, quantity: int, branch_name: str = None, unit_price=None, date=None):
        branch = self._resolve_branch(branch_name)
        if not branch:
            return None
        product = Product.objects.filter(branch=branch, name__iexact=product_name).first()
        if not product:
            product = Product.objects.filter(branch=branch, name__icontains=product_name).first()
        if not product:
            available = ', '.join(Product.objects.filter(branch=branch).values_list('name', flat=True)[:10])
            return f"❌ Product '{product_name}' not found in branch '{branch.name}'. Available products: {available or 'none'}"
        sale_date = (_parse_date_str(date) if isinstance(date, str) else date) or datetime.now()
        sale = Sale.objects.create(branch=branch, sale_date=sale_date)
        SaleItem.objects.create(sale=sale, product=product, quantity=quantity, unit_price=unit_price)
        sale.refresh_from_db()
        return f"✅ Sale recorded: {quantity}x '{product.name}' = ₹{sale.total_amount} for branch '{branch.name}' (Invoice: {sale.invoice_number})"
