from django.db import models
from django.db.models import Sum
from django.db.models.functions import Lower
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import uuid


class Branch(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="branches")

    class Meta:
        db_table = 'branches'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                Lower('name'), 'user',
                name='unique_branch_per_user_ci'
            )
        ]

    def clean(self):
        if Branch.objects.filter(
            user=self.user,
            name__iexact=self.name
        ).exclude(pk=self.pk).exists():
            raise ValidationError({
                "name": "You already have a branch with this name."
            })

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    default_price = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="products"
    )

    class Meta:
        db_table = 'products'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                Lower('name'), 'branch',
                name='unique_product_per_branch_ci'
            )
        ]

    def clean(self):
        if Product.objects.filter(
            branch=self.branch,
            name__iexact=self.name
        ).exclude(pk=self.pk).exists():
            raise ValidationError({
                "name": "A product with this name already exists in this branch."
            })

    def __str__(self):
        return self.name


class Sale(models.Model):

    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,   # allows empty in admin form
        null=True     # allows NULL in database
    )

    sale_date = models.DateTimeField(db_index=True)

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        editable=False
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="sales"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales'
        ordering = ['-sale_date']

    def save(self, *args, **kwargs):
        # If invoice left blank → auto generate
        if not self.invoice_number:
            self.invoice_number = uuid.uuid4().hex[:10].upper()

        super().save(*args, **kwargs)

    def update_total_amount(self):
        total = self.items.aggregate(
            total=Sum('line_total')
        )['total'] or 0

        self.total_amount = total
        self.save(update_fields=['total_amount'])

    def __str__(self):
        return f"{self.invoice_number} - {self.branch.name}"


class SaleItem(models.Model):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="sale_items"
    )

    quantity = models.PositiveIntegerField()

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True
    )

    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        editable=False
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sale_items'
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        # If unit_price is empty → use product default price
        if self.unit_price is None:
            self.unit_price = self.product.default_price

        # Calculate line total
        self.line_total = self.quantity * self.unit_price

        super().save(*args, **kwargs)

        # Update sale total
        self.sale.update_total_amount()

    def delete(self, *args, **kwargs):
        sale = self.sale
        super().delete(*args, **kwargs)
        sale.update_total_amount()

    def __str__(self):
        return f"{self.product.name} ({self.quantity})"


class IncomeCategory(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="income_categories"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'income_categories'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                Lower('name'), 'user',
                name='unique_income_category_per_user_ci'
            )
        ]

    def clean(self):
        if IncomeCategory.objects.filter(
            user=self.user,
            name__iexact=self.name
        ).exclude(pk=self.pk).exists():
            raise ValidationError({
                "name": "You already have an income category with this name."
            })

    def __str__(self):
        return self.name


class Income(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="incomes"
    )

    category = models.ForeignKey(
        IncomeCategory,
        on_delete=models.CASCADE,
        related_name="incomes"
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    income_date = models.DateTimeField(db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'income'
        ordering = ['-income_date']

    def __str__(self):
        return f"{self.category.name} - {self.amount}"


class ExpenseCategory(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="expense_categories"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expense_categories'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                Lower('name'), 'user',
                name='unique_expense_category_per_user_ci'
            )
        ]

    def clean(self):
        if ExpenseCategory.objects.filter(
            user=self.user,
            name__iexact=self.name
        ).exclude(pk=self.pk).exists():
            raise ValidationError({
                "name": "You already have an expense category with this name."
            })

    def __str__(self):
        return self.name

class Expense(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="expenses"
    )

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.CASCADE,
        related_name="expenses"
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    expense_date = models.DateTimeField(db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.category.name} - {self.amount}"


class Reminder(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="reminders"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reminders"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(db_index=True)
    is_completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reminders'
        ordering = ['-due_date']

    def __str__(self):
        return self.title


# CSV File Store

FILE_TYPES = (
    ("sales", "Sales"),
    ("income", "Income"),
    ("expense", "Expense"),
)

class UploadedFile(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="uploaded_files",
        null=True,
        blank=True
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="uploaded_files"
    )

    file = models.FileField(upload_to='uploads/')
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "uploaded_files"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    business_name = models.CharField(max_length=255, blank=True)
    timezone = models.CharField(max_length=50, default="UTC")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.user.username} Profile"


class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_messages")
    role = models.CharField(max_length=10)  # 'user' or 'assistant'
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username} [{self.role}]: {self.content[:50]}"