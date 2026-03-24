from core.models import Sale, Expense, Income, Branch, Product, Reminder, SaleItem
from django.db.models import Sum, Avg
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from .date_parser import DateParser

class BusinessTools:
    def __init__(self, user):
        self.user = user
    
    def get_total_revenue(self, branch_name=None, time_period=None):
        sales = Sale.objects.filter(branch__user=self.user)
        if branch_name:
            sales = sales.filter(branch__name__icontains=branch_name)
        
        start_date, end_date = DateParser.parse_time_period(time_period)
        if start_date and end_date:
            sales = sales.filter(sale_date__range=[start_date, end_date])
        
        total = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        return f"Total revenue{period_str}: ₹{total}"
    
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
        return f"Profit{period_str}: ₹{profit} | Total Revenue: ₹{total_revenue} (Sales: ₹{sales_revenue}, Other Income: ₹{other_income}) | Expenses: ₹{expense} | Margin: {margin:.1f}%"
    
    def get_top_products(self, limit=5, time_period=None):
        sale_items = SaleItem.objects.filter(sale__branch__user=self.user)
        
        start_date, end_date = DateParser.parse_time_period(time_period)
        if start_date and end_date:
            sale_items = sale_items.filter(sale__sale_date__range=[start_date, end_date])
        
        products = (
            sale_items
            .values('product__name')
            .annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('line_total')
            )
            .order_by('-total_revenue')[:limit]
        )
        
        if not products:
            return "No product sales data available"
        
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        result = f"Top Products{period_str}:\n"
        for i, p in enumerate(products, 1):
            result += f"{i}. {p['product__name']}: {p['total_quantity']} units, ₹{p['total_revenue']}\n"
        return result
    
    def get_branch_performance(self, time_period=None):
        branches = Branch.objects.filter(user=self.user)
        
        if not branches:
            return "No branches found"
        
        start_date, end_date = DateParser.parse_time_period(time_period)
        period_str = f" ({start_date.strftime('%b %Y')} - {end_date.strftime('%b %Y')})" if start_date else ""
        result = f"Branch Performance{period_str}:\n"
        
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
            
            result += f"\n{branch.name}: Total Revenue ₹{total_revenue} (Sales: ₹{sales_revenue}, Income: ₹{other_income}), Expenses ₹{expense_total}, Profit ₹{profit}\n"
        return result
    
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
        result = f"Expense Breakdown{period_str}:\n"
        for exp in expenses:
            result += f"- {exp['category__name']}: ₹{exp['total']}\n"
        return result
    
    def get_monthly_trend(self, months=6, time_period=None):
        start_date, end_date = DateParser.parse_time_period(time_period)
        
        if not start_date:
            cutoff_date = datetime.now() - timedelta(days=months*30)
        else:
            cutoff_date = start_date
        
        monthly = (
            Sale.objects
            .filter(branch__user=self.user, sale_date__gte=cutoff_date)
            .annotate(month=TruncMonth('sale_date'))
            .values('month')
            .annotate(revenue=Sum('total_amount'))
            .order_by('month')
        )
        
        if not monthly:
            return f"No sales data in specified period"
        
        result = f"Monthly Revenue Trend:\n"
        for m in monthly:
            result += f"{m['month'].strftime('%B %Y')}: ₹{m['revenue']}\n"
        return result
    
    def get_pending_reminders(self):
        reminders = Reminder.objects.filter(
            user=self.user,
            is_completed=False
        ).order_by('due_date')[:10]
        
        if not reminders:
            return "No pending reminders"
        
        result = "Pending Reminders:\n"
        for r in reminders:
            result += f"- {r.title} (Due: {r.due_date.strftime('%Y-%m-%d')})\n"
        return result
