from django.contrib import admin
from django.contrib import messages
from .services import process_sales_file, process_income_file, process_expense_file
from .models import (
    Branch, Product, Sale, SaleItem,
    IncomeCategory, Income,
    ExpenseCategory, Expense,
    Reminder, UploadedFile
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


@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):

    list_display = ("file", "file_type", "branch", "uploaded_at")

    def save_model(self, request, obj, form, change):

        if not obj.user:
            obj.user = request.user

        super().save_model(request, obj, form, change)

        try:

            if not obj.branch:
                raise Exception("Please select a branch.")

            if obj.file_type == "sales":
                process_sales_file(obj.file.path, branch_id=obj.branch.id)

            elif obj.file_type == "income":
                process_income_file(obj.file.path, branch_id=obj.branch.id)

            elif obj.file_type == "expense":
                process_expense_file(obj.file.path, branch_id=obj.branch.id)

            # delete file after successful processing
            obj.file.delete(save=False)
            obj.delete()

            messages.success(request, "File processed successfully.")

        except Exception as e:

            # delete uploaded file if processing fails
            if obj.file:
                obj.file.delete(save=False)

            # delete database record
            obj.delete()

            messages.error(request, f"Error processing file: {e}")


admin.site.register(Branch)
admin.site.register(Product)
admin.site.register(IncomeCategory)
admin.site.register(Income)
admin.site.register(ExpenseCategory)
admin.site.register(Expense)
admin.site.register(Reminder)
