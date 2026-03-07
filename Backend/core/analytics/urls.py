from django.urls import path
from .views import (
    DashboardOverview,
    RevenueTrend,
    ExpenseBreakdown,
    TopProducts,
    TopProductsByRevenue,
    SalesGrowth,
    BranchPerformance,
    ReminderStats
)

urlpatterns = [
    path("overview/", DashboardOverview.as_view(), name="dashboard-overview"),
    path("revenue-trend/", RevenueTrend.as_view(), name="revenue-trend"),
    path("expense-breakdown/", ExpenseBreakdown.as_view(), name="expense-breakdown"),
    path("top-products/", TopProducts.as_view(), name="top-products"),
    path("top-products-revenue/", TopProductsByRevenue.as_view(), name="top-products-revenue"),
    path("sales-growth/", SalesGrowth.as_view(), name="sales-growth"),
    path("branch-performance/", BranchPerformance.as_view(), name="branch-performance"),
    path("reminders/", ReminderStats.as_view(), name="reminder-stats"),
]
