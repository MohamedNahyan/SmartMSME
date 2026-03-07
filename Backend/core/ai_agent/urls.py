from django.urls import path
from .views import (
    AIAgentChatView, AIAgentClearContextView,
    KPIRevenueView, KPIExpensesView, KPIProfitView,
    KPITopProductsView, KPIBranchPerformanceView,
    KPIExpenseBreakdownView, KPIMonthlyTrendView,
    KPIPendingRemindersView
)

urlpatterns = [
    path('chat/', AIAgentChatView.as_view(), name='ai-chat'),
    path('clear-context/', AIAgentClearContextView.as_view(), name='ai-clear-context'),
    path('kpi/revenue/', KPIRevenueView.as_view(), name='kpi-revenue'),
    path('kpi/expenses/', KPIExpensesView.as_view(), name='kpi-expenses'),
    path('kpi/profit/', KPIProfitView.as_view(), name='kpi-profit'),
    path('kpi/top-products/', KPITopProductsView.as_view(), name='kpi-top-products'),
    path('kpi/branch-performance/', KPIBranchPerformanceView.as_view(), name='kpi-branch-performance'),
    path('kpi/expense-breakdown/', KPIExpenseBreakdownView.as_view(), name='kpi-expense-breakdown'),
    path('kpi/monthly-trend/', KPIMonthlyTrendView.as_view(), name='kpi-monthly-trend'),
    path('kpi/pending-reminders/', KPIPendingRemindersView.as_view(), name='kpi-pending-reminders'),
]
