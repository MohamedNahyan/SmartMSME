import re
from datetime import datetime
from typing import Dict, Optional, Tuple
from .date_parser import DateParser

MONTH_NAMES = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
    'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
}


class IntentClassifier:
    def __init__(self):
        self.intent_patterns = {
            'revenue': ['revenue', 'sales', 'income', 'earning', 'made', 'generated', 'turnover'],
            'expense': ['expense', 'cost', 'spending', 'spent', 'paid', 'expenditure'],
            'profit': ['profit', 'margin', 'net income', 'earnings', 'profitability'],
            'product': ['product', 'item', 'selling', 'popular', 'top', 'best seller'],
            'branch': ['branch', 'location', 'store', 'outlet'],
            'reminder': ['reminder', 'reminders', 'task', 'pending', 'due', 'todo', 'upcoming'],
            'trend': ['trend', 'monthly', 'growth', 'over time', 'history', 'pattern'],
            'compare': ['compare', 'versus', 'vs', 'best', 'worst', 'performance', 'which'],
            'breakdown': ['breakdown', 'category', 'biggest', 'largest', 'distribution'],
        }

        self.action_verbs = [
            'add', 'create', 'record', 'set', 'make', 'new', 'log', 'save',
            'register', 'schedule', 'want to', 'need to', 'can i', 'could i',
            'please', 'put', 'enter', 'insert', 'i need', 'i want', 'i have',
            'note', 'track', 'book', 'post',
        ]

        self.action_patterns = {
            'uncomplete_reminder': ['un-mark', 'unmark', 'undo', 'revert', 'not completed', 'not done', 'incomplete', 'pending again'],
            'delete_reminder':     ['delete reminder', 'remove reminder', 'delete the reminder', 'remove the reminder'],
            'complete_reminder':   ['mark', 'complete', 'done', 'finished', 'paid', 'close'],
            'create_reminder':     ['reminder', 'remind me', 'remind', 'alert', 'notify'],
            'add_expense':         ['expense', 'expence', 'expens', 'cost', 'bill', 'purchase', 'spending', 'spent', 'pay', 'payment'],
            'add_income':          ['income', 'earning', 'received', 'revenue', 'got paid', 'collected'],
            'add_sale':            ['sale', 'sold', 'sell', 'order', 'invoice'],
        }

        self._date_keywords = [
            'today', 'yesterday', 'on ', 'for ', 'date',
            'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
            'january', 'february', 'march', 'april', 'june', 'july', 'august',
            'september', 'october', 'november', 'december',
        ]

        self.query_patterns = {
            'show_reminders': [
                'show reminder', 'show reminders', 'list reminder', 'list reminders',
                'my reminder', 'my reminders', 'current reminder', 'current reminders',
                'what are my reminder', 'see reminder', 'view reminder',
                'check reminder', 'get reminder', 'need to see reminder',
                'see my reminder', 'view my reminder', 'pending reminder',
                'upcoming reminder', 'all reminder',
            ],
            'show_expenses': [
                'show expense', 'show expence', 'show my expense', 'show my expence',
                'list expense', 'my expense', 'view expense',
                'check expense', 'get expense', 'all expense', 'expense list',
                'what expense', 'how much expense', 'expense breakdown',
            ],
            'show_income': [
                'show income', 'show my income', 'list income', 'my income',
                'view income', 'all income', 'income list',
                'what income', 'how much income', 'total income',
            ],
            'show_sales': [
                'show sale', 'show my sale', 'list sale', 'my sale',
                'view sale', 'all sale', 'sale list', 'show orders',
                'what sale', 'how much sale', 'total sale', 'show invoices',
            ],
        }

    def _has_date_reference(self, query_lower: str) -> bool:
        return (
            any(kw in query_lower for kw in self._date_keywords)
            or bool(re.search(r'\d{1,2}[\/\-]\d{1,2}', query_lower))
        )

    def _is_show_query(self, q: str) -> bool:
        show_signals = ['show', 'list', 'what', 'how much', 'how many', 'tell me',
                        'give me', 'display', 'view', 'get', 'check', 'see']
        return any(s in q for s in show_signals)

    def _get_record_type(self, q: str) -> Optional[str]:
        if any(w in q for w in ['expense', 'expence', 'expens', 'cost', 'spending']):
            return 'expense'
        if any(w in q for w in ['income', 'earning']):
            return 'income'
        if any(w in q for w in ['sale', 'sales', 'invoice', 'order']):
            return 'sales'
        return None

    def get_month_query_intent(self, query: str) -> Optional[Tuple[str, int, int]]:
        """
        Returns (record_type, month_int, year_int) for month-level queries.
        e.g. "show expenses in january 2024" -> ('expense', 1, 2024)
        e.g. "show sales this month" -> ('sales', current_month, current_year)
        e.g. "show income last month" -> ('income', last_month, last_year)
        """
        q = query.lower()
        if not self._is_show_query(q):
            return None

        record_type = self._get_record_type(q)
        if not record_type:
            return None

        now = datetime.now()

        # "this month"
        if 'this month' in q:
            return (record_type, now.month, now.year)

        # "last month"
        if 'last month' in q:
            first_of_this = now.replace(day=1)
            from dateutil.relativedelta import relativedelta
            last = first_of_this - relativedelta(months=1)
            return (record_type, last.month, last.year)

        # "in january 2024" / "of march 2024" / "for feb 2025"
        m = re.search(
            r'(?:in|of|for|during)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s*(\d{4})?',
            q
        )
        if m:
            month_name = m.group(1)
            year_str = m.group(2)
            month_num = MONTH_NAMES.get(month_name)
            year_num = int(year_str) if year_str else now.year
            if month_num:
                return (record_type, month_num, year_num)

        # bare "january 2024" / "march 2025"
        m = re.search(
            r'\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\b',
            q
        )
        if m:
            month_num = MONTH_NAMES.get(m.group(1))
            year_num = int(m.group(2))
            if month_num:
                return (record_type, month_num, year_num)

        # bare month name without year — use current year
        m = re.search(
            r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\b',
            q
        )
        if m:
            month_num = MONTH_NAMES.get(m.group(1))
            if month_num:
                return (record_type, month_num, now.year)

        return None

    def get_date_query_intent(self, query: str) -> Optional[tuple]:
        """
        Returns (record_type, date_str) for specific-date queries.
        e.g. "show expenses on 15 jan 2024" -> ('expense', '15 jan 2024')
        """
        q = query.lower()
        if not self._has_date_reference(q):
            return None
        if not self._is_show_query(q):
            return None

        record_type = self._get_record_type(q)
        if not record_type:
            return None

        date_str = self._extract_date_from_query(query)
        if date_str:
            return (record_type, date_str)
        return None

    def _extract_date_from_query(self, query: str) -> Optional[str]:
        q = query.lower().strip()

        if 'today' in q:
            return 'today'
        if 'yesterday' in q:
            return 'yesterday'

        # "on 15 jan 2024" / "for 15/01/2024"
        m = re.search(
            r'(?:on|for|date|of)\s+'
            r'(\d{1,2}[\s\/\-]\w+[\s\/\-]?\d{0,4}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)',
            q
        )
        if m:
            return m.group(1).strip()

        # bare "15 january 2024"
        m = re.search(r'(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{0,4})', q)
        if m:
            return m.group(1).strip()

        # bare "january 15 2024"
        m = re.search(r'((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}\s*,?\s*\d{0,4})', q)
        if m:
            return m.group(1).strip()

        return None

    def get_action_intent(self, query: str) -> Optional[str]:
        query_lower = query.lower()

        for intent, patterns in self.query_patterns.items():
            if any(p in query_lower for p in patterns):
                return intent

        if any(kw in query_lower for kw in self.action_patterns['uncomplete_reminder']):
            return 'uncomplete_reminder'

        complete_keywords = self.action_patterns['complete_reminder']
        reminder_keywords = self.action_patterns['create_reminder']
        has_complete = any(kw in query_lower for kw in complete_keywords)

        if has_complete and any(kw in query_lower for kw in reminder_keywords):
            return 'complete_reminder'

        if re.search(r'\bi\s+(have\s+)?(completed?|done|finished|paid|payed)\b', query_lower):
            return 'complete_reminder'

        if re.search(r'\bmark\b.+\bas\s+(complete|done|finished)\b', query_lower):
            return 'complete_reminder'

        has_action_verb = any(verb in query_lower for verb in self.action_verbs)

        if has_complete and has_action_verb:
            return 'complete_reminder'

        if not has_action_verb:
            return None

        best_action = None
        best_pos = -1
        for action, keywords in self.action_patterns.items():
            if action == 'complete_reminder':
                continue
            for kw in keywords:
                pos = query_lower.rfind(kw)
                if pos > best_pos:
                    best_pos = pos
                    best_action = action

        return best_action

    def classify(self, query: str) -> Dict[str, float]:
        query_lower = query.lower()
        scores = {}
        for intent, keywords in self.intent_patterns.items():
            score = sum(1 for kw in keywords if kw in query_lower)
            if score > 0:
                scores[intent] = score
        return scores

    def extract_entities(self, query: str) -> Dict:
        return {
            'time_period': self._extract_time_period(query),
            'branch_name': self._extract_branch_name(query),
        }

    def _extract_time_period(self, query: str) -> Dict:
        specific = DateParser.extract_specific_dates(query)
        if specific:
            return specific
        query_lower = query.lower()
        if 'this month' in query_lower:
            return {'type': 'month', 'value': 'current'}
        elif 'last month' in query_lower:
            return {'type': 'month', 'value': 'last'}
        elif 'this quarter' in query_lower:
            return {'type': 'quarter', 'value': 'current'}
        elif 'last quarter' in query_lower:
            return {'type': 'quarter', 'value': 'last'}
        elif 'this year' in query_lower:
            return {'type': 'year', 'value': 'current'}
        elif 'last year' in query_lower:
            return {'type': 'year', 'value': 'last'}
        return {'type': 'all', 'value': None}

    def _extract_branch_name(self, query: str) -> str:
        patterns = [
            r'branch\s+([A-Za-z0-9\s]+?)(?:\s+branch|\s+location|$)',
            r'at\s+([A-Za-z0-9\s]+?)(?:\s+branch|\s+location|$)',
        ]
        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
