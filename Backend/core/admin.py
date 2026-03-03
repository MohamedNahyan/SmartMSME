from django.contrib import admin
from .models import (
    Branch, Product, Sale, SaleItem,
    IncomeCategory, Income,
    ExpenseCategory, Expense,
    Reminder
)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'branch', 'sale_date', 'total_amount')
    readonly_fields = ('total_amount',)
    search_fields = ('invoice_number', 'branch__name')
    list_filter = ('branch', 'sale_date')


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ('sale', 'product', 'quantity', 'unit_price', 'line_total')
    readonly_fields = ('line_total',)
    list_filter = ('sale',)


admin.site.register(Branch)
admin.site.register(Product)
admin.site.register(IncomeCategory)
admin.site.register(Income)
admin.site.register(ExpenseCategory)
admin.site.register(Expense)
admin.site.register(Reminder)