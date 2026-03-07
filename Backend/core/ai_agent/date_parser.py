from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import re

class DateParser:
    @staticmethod
    def parse_time_period(time_period):
        if not time_period or time_period.get('type') == 'all':
            return None, None
        
        now = datetime.now()
        period_type = time_period.get('type')
        value = time_period.get('value')
        
        if period_type == 'month':
            if value == 'current':
                start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end = now
            elif value == 'last':
                start = (now.replace(day=1) - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end = now.replace(day=1) - timedelta(seconds=1)
            else:
                start = value.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end = (start + relativedelta(months=1)) - timedelta(seconds=1)
        
        elif period_type == 'quarter':
            quarter_month = ((now.month - 1) // 3) * 3 + 1
            if value == 'current':
                start = now.replace(month=quarter_month, day=1, hour=0, minute=0, second=0, microsecond=0)
                end = now
            else:
                start = (now.replace(month=quarter_month, day=1) - relativedelta(months=3)).replace(hour=0, minute=0, second=0, microsecond=0)
                end = now.replace(month=quarter_month, day=1) - timedelta(seconds=1)
        
        elif period_type == 'year':
            if value == 'current':
                start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                end = now
            else:
                start = now.replace(year=now.year-1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                end = now.replace(month=1, day=1) - timedelta(seconds=1)
        
        elif period_type == 'specific':
            start = value.get('start')
            end = value.get('end', now)
        
        else:
            return None, None
        
        return start, end
    
    @staticmethod
    def extract_specific_dates(query):
        query_lower = query.lower()
        
        quarter_match = re.search(r'q([1-4])\s*(\d{4})', query_lower)
        if quarter_match:
            quarter = int(quarter_match.group(1))
            year = int(quarter_match.group(2))
            start_month = (quarter - 1) * 3 + 1
            start = datetime(year, start_month, 1)
            end = (start + relativedelta(months=3)) - timedelta(seconds=1)
            return {'type': 'specific', 'value': {'start': start, 'end': end}}
        
        months = ['january', 'february', 'march', 'april', 'may', 'june', 
                  'july', 'august', 'september', 'october', 'november', 'december']
        for i, month in enumerate(months, 1):
            pattern = rf'{month}\s*(\d{{4}})'
            match = re.search(pattern, query_lower)
            if match:
                year = int(match.group(1))
                start = datetime(year, i, 1)
                end = (start + relativedelta(months=1)) - timedelta(seconds=1)
                return {'type': 'specific', 'value': {'start': start, 'end': end}}
        
        return None
