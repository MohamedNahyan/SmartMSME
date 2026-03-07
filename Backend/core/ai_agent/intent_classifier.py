import re
from typing import Dict
from .date_parser import DateParser

class IntentClassifier:
    def __init__(self):
        self.intent_patterns = {
            'revenue': ['revenue', 'sales', 'income', 'earning', 'made', 'generated', 'turnover'],
            'expense': ['expense', 'cost', 'spending', 'spent', 'paid', 'expenditure'],
            'profit': ['profit', 'margin', 'net income', 'earnings', 'profitability'],
            'product': ['product', 'item', 'selling', 'popular', 'top', 'best seller'],
            'branch': ['branch', 'location', 'store', 'outlet'],
            'reminder': ['reminder', 'task', 'pending', 'due', 'todo', 'upcoming'],
            'trend': ['trend', 'monthly', 'growth', 'over time', 'history', 'pattern'],
            'compare': ['compare', 'versus', 'vs', 'best', 'worst', 'performance', 'which'],
            'breakdown': ['breakdown', 'category', 'biggest', 'largest', 'distribution']
        }
    
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
            'branch_name': self._extract_branch_name(query)
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
            r'at\s+([A-Za-z0-9\s]+?)(?:\s+branch|\s+location|$)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
