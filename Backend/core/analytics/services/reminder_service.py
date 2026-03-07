from django.utils import timezone
from core.models import Reminder


def pending_reminders(user):
    """Get count of pending (incomplete) reminders"""
    count = Reminder.objects.filter(
        user=user,
        is_completed=False
    ).count()
    return count


def overdue_reminders(user):
    """Get count of overdue reminders"""
    now = timezone.now()
    count = Reminder.objects.filter(
        user=user,
        is_completed=False,
        due_date__lt=now
    ).count()
    return count


def upcoming_reminders(user, days=7):
    """Get reminders due in next N days"""
    now = timezone.now()
    future = now + timezone.timedelta(days=days)
    
    reminders = Reminder.objects.filter(
        user=user,
        is_completed=False,
        due_date__gte=now,
        due_date__lte=future
    ).values("title", "due_date", "branch__name").order_by("due_date")
    
    return list(reminders)
