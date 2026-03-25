import json
import re
import requests
from datetime import datetime, timedelta
from django.conf import settings
from core.models import ChatMessage, Reminder
from .tools import BusinessTools
from .intent_classifier import IntentClassifier


ACTION_FIELDS = {
    'create_reminder': [
        ('title',       'What should the reminder be called? (e.g. Pay rent)'),
        ('due_date',    'What is the due date? (e.g. 30 July 2025, tomorrow, in 2 days)'),
        ('description', 'Any description? (or type "skip" to leave blank)'),
        ('branch',      None),
    ],
    'add_expense': [
        ('amount',      'What is the expense amount? (e.g. 5000)'),
        ('category',    'What category? (e.g. Rent, Electricity, Salaries)'),
        ('description', 'Any description? (or type "skip" to leave blank)'),
        ('date',        'What is the expense date? (or type "today")'),
        ('branch',      None),
    ],
    'add_income': [
        ('amount',      'What is the income amount? (e.g. 10000)'),
        ('category',    'What category? (e.g. Sales, Consulting, Rent)'),
        ('description', 'Any description? (or type "skip" to leave blank)'),
        ('date',        'What is the income date? (or type "today")'),
        ('branch',      None),
    ],
    'add_sale': [
        ('product',     'What is the product name?'),
        ('quantity',    'How many units were sold?'),
        ('date',        'What is the sale date? (or type "today")'),
        ('branch',      None),
    ],
    'complete_reminder': [
        ('title_keyword', 'Which reminder should I mark as complete? (type part of the title)'),
    ],
    'uncomplete_reminder': [
        ('title_keyword', 'Which reminder should I un-mark? (type part of the title)'),
    ],
    'delete_reminder': [
        ('title_keyword', 'Which reminder should I delete? (type part of the title)'),
    ],
}

GREETINGS = {
    'hi', 'hello', 'hey', 'hii', 'helo', 'sup', 'yo',
    'good morning', 'good evening', 'good afternoon', 'howdy', 'greetings',
}
CANCEL_WORDS = {
    'cancel', 'stop', 'quit', 'exit', 'nevermind', 'never mind',
    'abort', 'reset', 'start over', 'forget it', 'forget',
}
CONFIRM_YES = {'yes', 'y', 'confirm', 'ok', 'okay', 'sure', 'yep', 'yeah', 'proceed', 'do it', 'go ahead'}
CONFIRM_NO  = {'no', 'n', 'nope', 'nah', 'dont', "don't", 'cancel', 'stop', 'abort'}


class BusinessAIAgent:
    def __init__(self, user, session_id=None):
        self.user = user
        self.tools = BusinessTools(user)
        self.classifier = IntentClassifier()
        self.ollama_url = getattr(settings, 'OLLAMA_URL', 'http://localhost:11434/api/generate')
        self.model = getattr(settings, 'OLLAMA_MODEL', 'llama3.1:8b')

    # ── Pending action state ───────────────────────────────────────

    def _save_pending(self, action: str, params: dict, awaiting: str):
        ChatMessage.objects.filter(user=self.user, role='system').delete()
        ChatMessage.objects.create(
            user=self.user, role='system',
            content=json.dumps({'action': action, 'params': params, 'awaiting': awaiting})
        )

    def _get_pending(self):
        msg = ChatMessage.objects.filter(user=self.user, role='system').first()
        if msg:
            try:
                return json.loads(msg.content)
            except json.JSONDecodeError:
                pass
        return None

    def _clear_pending(self):
        ChatMessage.objects.filter(user=self.user, role='system').delete()

    def _is_greeting(self, message: str) -> bool:
        return message.strip().lower().rstrip('!.,?') in GREETINGS

    def _is_cancel(self, message: str) -> bool:
        return message.strip().lower().rstrip('!.,?') in CANCEL_WORDS

    def _is_new_intent(self, message: str) -> bool:
        if self._is_greeting(message):
            return True
        if self.classifier.get_action_intent(message):
            return True
        if self.classifier.get_date_query_intent(message):
            return True
        if self.classifier.get_month_query_intent(message):
            return True
        msg = message.lower()
        read_signals = ['show', 'what', 'list', 'how much', 'how many', 'tell me', 'give me', 'display', 'view']
        return any(s in msg for s in read_signals)

    def _reply(self, text: str, data=None) -> dict:
        ChatMessage.objects.create(user=self.user, role="assistant", content=text)
        return {'response': text, 'data': data}

    # ── Confirmation summary ───────────────────────────────────────

    def _build_confirmation(self, action: str, params: dict) -> str:
        lines = ['Please confirm the following:']
        if action == 'add_expense':
            lines.append(f"  📌 Action   : Record Expense")
            lines.append(f"  💰 Amount   : ₹{params.get('amount')}")
            lines.append(f"  🏷️  Category : {params.get('category')}")
            lines.append(f"  🏢 Branch   : {params.get('branch')}")
            lines.append(f"  📅 Date     : {params.get('date')}")
            if params.get('description'):
                lines.append(f"  📝 Note     : {params.get('description')}")
        elif action == 'add_income':
            lines.append(f"  📌 Action   : Record Income")
            lines.append(f"  💰 Amount   : ₹{params.get('amount')}")
            lines.append(f"  🏷️  Category : {params.get('category')}")
            lines.append(f"  🏢 Branch   : {params.get('branch')}")
            lines.append(f"  📅 Date     : {params.get('date')}")
            if params.get('description'):
                lines.append(f"  📝 Note     : {params.get('description')}")
        elif action == 'add_sale':
            lines.append(f"  📌 Action   : Record Sale")
            lines.append(f"  📦 Product  : {params.get('product')}")
            lines.append(f"  🔢 Quantity : {params.get('quantity')}")
            lines.append(f"  🏢 Branch   : {params.get('branch')}")
            lines.append(f"  📅 Date     : {params.get('date')}")
        elif action == 'create_reminder':
            lines.append(f"  📌 Action   : Create Reminder")
            lines.append(f"  📋 Title    : {params.get('title')}")
            lines.append(f"  📅 Due Date : {params.get('due_date')}")
            lines.append(f"  🏢 Branch   : {params.get('branch')}")
            if params.get('description'):
                lines.append(f"  📝 Note     : {params.get('description')}")
        elif action == 'complete_reminder':
            lines.append(f"  📌 Action   : Mark Reminder as Complete")
            lines.append(f"  🔍 Keyword  : {params.get('title_keyword')}")
        elif action == 'uncomplete_reminder':
            lines.append(f"  📌 Action   : Mark Reminder as Pending")
            lines.append(f"  🔍 Keyword  : {params.get('title_keyword')}")
        elif action == 'delete_reminder':
            lines.append(f"  📌 Action   : ⚠️ Delete Reminder (cannot be undone)")
            lines.append(f"  🔍 Keyword  : {params.get('title_keyword')}")

        lines.append('\nType "yes" to confirm or "no" to cancel.')
        return '\n'.join(lines)

    # ── Date parsing ───────────────────────────────────────────────

    def _parse_date(self, value: str):
        value_lower = value.strip().lower()
        now = datetime.now()

        if value_lower == 'today':
            return now.strftime('%Y-%m-%d')
        if value_lower == 'yesterday':
            return (now - timedelta(days=1)).strftime('%Y-%m-%d')
        if value_lower in ('next week', 'in a week', 'a week from now'):
            return (now + timedelta(weeks=1)).strftime('%Y-%m-%d')
        if value_lower in ('next month', 'in a month', 'a month from now'):
            from dateutil.relativedelta import relativedelta
            return (now + relativedelta(months=1)).strftime('%Y-%m-%d')

        # "13th next month", "13 next month", "13th of next month"
        m = re.search(r'(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?next\s+month', value_lower)
        if m:
            from dateutil.relativedelta import relativedelta
            day = int(m.group(1))
            next_month = now + relativedelta(months=1)
            try:
                return next_month.replace(day=day).strftime('%Y-%m-%d')
            except ValueError:
                pass

        word_map = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        }
        m = re.search(
            r'(?:in )?(one|two|three|four|five|six|seven|eight|nine|ten|\d+)'
            r'\s+(day|days|week|weeks|month|months)(?:\s+from now)?',
            value_lower
        )
        if m:
            raw = m.group(1)
            n = int(raw) if raw.isdigit() else word_map.get(raw, 1)
            unit = m.group(2)
            if 'day' in unit:
                return (now + timedelta(days=n)).strftime('%Y-%m-%d')
            if 'week' in unit:
                return (now + timedelta(weeks=n)).strftime('%Y-%m-%d')
            if 'month' in unit:
                from dateutil.relativedelta import relativedelta
                return (now + relativedelta(months=n)).strftime('%Y-%m-%d')

        days_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for i, day in enumerate(days_of_week):
            if f'next {day}' in value_lower or value_lower == day:
                days_ahead = (i - now.weekday()) % 7 or 7
                return (now + timedelta(days=days_ahead)).strftime('%Y-%m-%d')

        formats = [
            '%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y',
            '%d %B %Y', '%d %b %Y', '%B %d %Y', '%b %d %Y',
            '%d %B, %Y', '%d %b, %Y',
        ]
        for fmt in formats:
            try:
                return datetime.strptime(value.strip(), fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None

    # ── Inline param extraction ────────────────────────────────────

    def _extract_inline_params(self, action: str, message: str) -> dict:
        params = {}
        msg = message.lower()

        if action in ('complete_reminder', 'uncomplete_reminder', 'delete_reminder'):
            noise = {
                'mark', 'as', 'complete', 'completed', 'done', 'finish', 'finished',
                'i', 'have', 'paid', 'payed', 'the', 'reminder', 'so', 'please',
                'make', 'set', 'a', 'an', 'this', 'that', 'and', 'it',
                'delete', 'remove', 'first', 'second', 'third',
            }
            words = [w for w in re.split(r'\W+', msg) if w and w not in noise]
            if words:
                params['title_keyword'] = ' '.join(words)

        elif action in ('add_expense', 'add_income'):
            amount_m = re.search(r'(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d+)?)', message, re.IGNORECASE)
            if amount_m:
                try:
                    params['amount'] = float(amount_m.group(1).replace(',', ''))
                except ValueError:
                    pass

            cat_m = re.search(
                r'\b(?:expense|expence|income)\s+([a-zA-Z][a-zA-Z\s]{1,20}?)(?:\s+(?:of|for|at)\s+[\d]|\s+[\d]|$)',
                message, re.IGNORECASE
            )
            if not cat_m:
                cat_m = re.search(
                    r'\b(?:as|for|under|category|called)\s+([a-zA-Z][a-zA-Z\s]{1,20}?)(?:\s+(?:expense|expence|income|on|at|in|branch)|$)',
                    message, re.IGNORECASE
                )
            if cat_m:
                params['category'] = cat_m.group(1).strip().title()

            date_str = self.classifier._extract_date_from_query(message)
            if date_str:
                parsed = self._parse_date(date_str)
                if parsed:
                    params['date'] = parsed

        elif action == 'add_sale':
            qty_m = re.search(r'(\d+)\s*(?:units?|pcs?|pieces?|qty|quantity)?', msg)
            if qty_m:
                try:
                    params['quantity'] = int(qty_m.group(1))
                except ValueError:
                    pass

            prod_m = re.search(r'sold\s+\d+\s+([a-zA-Z][a-zA-Z\s]{1,30})', message, re.IGNORECASE)
            if not prod_m:
                prod_m = re.search(r'([a-zA-Z][a-zA-Z\s]{1,30})\s+(?:sold|\d+\s+units?)', message, re.IGNORECASE)
            if prod_m:
                params['product'] = prod_m.group(1).strip()

            date_str = self.classifier._extract_date_from_query(message)
            if date_str:
                parsed = self._parse_date(date_str)
                if parsed:
                    params['date'] = parsed

        elif action == 'create_reminder':
            title_m = re.search(
                r'(?:remind(?:er)?(?:\s+me)?(?:\s+to)?|alert(?:\s+me)?(?:\s+to)?)\s+(.+?)(?:\s+(?:on|by|before|at|due)\s|$)',
                message, re.IGNORECASE
            )
            if title_m:
                params['title'] = title_m.group(1).strip()

            date_str = self.classifier._extract_date_from_query(message)
            if date_str:
                parsed = self._parse_date(date_str)
                if parsed:
                    params['due_date'] = parsed

        return params

    # ── Step-by-step field collection ─────────────────────────────

    def _next_missing_field(self, action: str, params: dict):
        for field, question in ACTION_FIELDS[action]:
            # description is optional — if already set (even as ''), skip it
            if field == 'description' and field in params:
                continue
            if params.get(field) in (None, ''):
                if field == 'branch':
                    branches = self.tools.get_branches_list()
                    if not branches:
                        return None, "You have no branches set up yet. Please create a branch first."
                    branch_list = ', '.join(f"'{b['name']}'" for b in branches)
                    return 'branch', f"Which branch should I record this for? Your branches: {branch_list}"
                return field, question
        return None, None

    def _store_field(self, field: str, value: str, params: dict):
        value = value.strip()

        if field == 'description' and value.lower() == 'skip':
            params[field] = ''
            return None

        # If answering description but input looks like a branch name, treat as skip
        if field == 'description':
            branches = self.tools.get_branches_list()
            branch_names = [b['name'].lower() for b in branches]
            val_lower = value.lower()
            if any(bn in val_lower for bn in branch_names) and len(value.split()) <= 3:
                params[field] = ''
                return None

        if field == 'amount':
            try:
                params[field] = float(value.replace(',', '').replace('₹', '').replace('rs', '').strip())
            except ValueError:
                return f"'{value}' doesn't look like a valid amount. Please enter a number (e.g. 5000)."

        elif field == 'quantity':
            try:
                params[field] = int(value)
            except ValueError:
                return f"'{value}' doesn't look like a valid quantity. Please enter a whole number."

        elif field in ('due_date', 'date'):
            if value.lower() == 'today':
                params[field] = datetime.now().strftime('%Y-%m-%d')
            else:
                parsed = self._parse_date(value)
                if not parsed:
                    return f"Couldn't understand '{value}' as a date. Try '30 July 2025', 'tomorrow', 'in 3 days', or 'next Monday'."
                params[field] = parsed

        else:
            params[field] = value

        return None

    # ── Action executor ────────────────────────────────────────────

    def _execute_action(self, action: str, params: dict):
        if action == 'create_reminder':
            return self.tools.create_reminder(
                title=params.get('title', 'Reminder'),
                due_date=params.get('due_date'),
                branch_name=params.get('branch'),
                description=params.get('description') or '',
            )
        elif action == 'complete_reminder':
            return self.tools.complete_reminder(title_keyword=params.get('title_keyword', ''))
        elif action == 'uncomplete_reminder':
            return self.tools.uncomplete_reminder(title_keyword=params.get('title_keyword', ''))
        elif action == 'delete_reminder':
            return self.tools.delete_reminder(title_keyword=params.get('title_keyword', ''))
        elif action == 'add_expense':
            return self.tools.add_expense(
                amount=params.get('amount', 0),
                category_name=params.get('category', 'General'),
                branch_name=params.get('branch'),
                description=params.get('description') or '',
                date=params.get('date'),
            )
        elif action == 'add_income':
            return self.tools.add_income(
                amount=params.get('amount', 0),
                category_name=params.get('category', 'General'),
                branch_name=params.get('branch'),
                description=params.get('description') or '',
                date=params.get('date'),
            )
        elif action == 'add_sale':
            return self.tools.add_sale(
                product_name=params.get('product', ''),
                quantity=params.get('quantity', 1),
                branch_name=params.get('branch'),
                unit_price=params.get('unit_price'),
                date=params.get('date'),
            )
        return None

    # ── Context builder ────────────────────────────────────────────

    def _get_selective_context(self, intents: dict) -> str:
        parts = []
        fetch_all = not intents
        if fetch_all or any(k in intents for k in ('profit', 'revenue', 'expense')):
            parts.append(self.tools.get_profit())
        if fetch_all or any(k in intents for k in ('branch', 'compare')):
            parts.append(self.tools.get_branch_performance())
        if fetch_all or 'product' in intents:
            parts.append(self.tools.get_top_products())
        if fetch_all or any(k in intents for k in ('expense', 'breakdown')):
            parts.append(self.tools.get_expense_breakdown())
        if fetch_all or 'trend' in intents:
            parts.append(self.tools.get_monthly_trend())
        if fetch_all or 'reminder' in intents:
            parts.append(self.tools.get_all_reminders())
        return "\n\n".join(parts)

    # ── Positional delete detection ──────────────────────────────

    def _parse_positional_delete(self, message: str):
        """
        Detects messages like: delete 1, delete 1 and 2, delete 1,2,3,
        delete first one, delete 1st and 2nd, etc.
        Returns list of 1-based positions or None.
        """
        msg = message.lower().strip()
        delete_triggers = ['delete', 'remove']
        if not any(t in msg for t in delete_triggers):
            return None

        # Normalize word numbers and ordinals
        word_map = {
            'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5',
            '1st': '1', '2nd': '2', '3rd': '3', '4th': '4', '5th': '5',
            'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        }
        normalized = msg
        for word, num in word_map.items():
            normalized = re.sub(rf'\b{word}\b', num, normalized)

        # Extract all numbers
        numbers = re.findall(r'\b([1-9]\d?)\b', normalized)
        if numbers:
            return [int(n) for n in numbers]
        return None

    def _delete_reminders_by_position(self, positions: list) -> str:
        reminders = list(
            Reminder.objects.filter(user=self.user).order_by('is_completed', 'due_date')[:20]
        )
        if not reminders:
            return '❌ You have no reminders to delete.'

        to_delete = []
        invalid = []
        for pos in positions:
            if 1 <= pos <= len(reminders):
                to_delete.append(reminders[pos - 1])
            else:
                invalid.append(pos)

        if invalid:
            return f'❌ Position(s) {invalid} are out of range. You have {len(reminders)} reminders.'

        titles = [r.title for r in to_delete]
        for r in to_delete:
            r.delete()

        deleted_str = ', '.join(f"'{t}'" for t in titles)
        return f'🗑️ Deleted: {deleted_str}'

    def _get_history(self) -> str:
        messages = ChatMessage.objects.filter(user=self.user).exclude(role='system').order_by('-created_at')[:20]
        lines = []
        for m in reversed(list(messages)):
            label = "User" if m.role == "user" else "Assistant"
            lines.append(f"{label}: {m.content}")
        return "\n".join(lines)

    # ── Main chat ──────────────────────────────────────────────────

    def chat(self, user_message: str) -> dict:
        try:
            history = self._get_history()
            ChatMessage.objects.create(user=self.user, role="user", content=user_message)

            # ── Greeting ──
            if self._is_greeting(user_message):
                self._clear_pending()
                name = self.user.first_name or self.user.username
                reply = (
                    f"Hi {name}! How can I help you today?\n\n"
                    "I can help you:\n"
                    "- Add reminders, expenses, income, or sales\n"
                    "- Mark reminders as complete / incomplete\n"
                    "- Delete reminders\n"
                    "- Show income, expenses, or sales for a specific date or month\n"
                    "- Analyze your business performance\n"
                    "- Answer questions about branches, products, or profits"
                )
                return self._reply(reply)

            # ── Cancel ──
            if self._is_cancel(user_message):
                self._clear_pending()
                return self._reply("Cancelled. What else can I help you with?")

            # ── Resume pending multi-step action ──
            pending = self._get_pending()
            if pending:
                action = pending['action']
                params = pending['params']
                awaiting = pending['awaiting']

                # ── Handle confirmation step ──
                if awaiting == 'confirm':
                    self._clear_pending()
                    msg_lower = user_message.strip().lower().rstrip('!.,?')
                    if msg_lower in CONFIRM_YES:
                        if action == '_bulk_delete':
                            reply = self._delete_reminders_by_position(params.get('positions', []))
                        else:
                            reply = self._execute_action(action, params) or "Something went wrong. Please try again."
                        return self._reply(reply)
                    elif msg_lower in CONFIRM_NO:
                        return self._reply("❌ Operation cancelled. What else can I help you with?")
                    else:
                        self._save_pending(action, params, 'confirm')
                        return self._reply('Please reply with "yes" to confirm or "no" to cancel.')

                if self._is_new_intent(user_message):
                    self._clear_pending()
                else:
                    self._clear_pending()

                    error = self._store_field(awaiting, user_message, params)
                    if error:
                        self._save_pending(action, params, awaiting)
                        return self._reply(error)

                    next_field, next_question = self._next_missing_field(action, params)
                    if next_field:
                        self._save_pending(action, params, next_field)
                        return self._reply(next_question)

                    # All fields collected — ask for confirmation
                    self._save_pending(action, params, 'confirm')
                    return self._reply(self._build_confirmation(action, params))

            # ── Positional delete (e.g. "delete 1 and 2", "delete first one") ──
            positions = self._parse_positional_delete(user_message)
            if positions:
                # Build confirmation
                reminders = list(
                    Reminder.objects.filter(user=self.user).order_by('is_completed', 'due_date')[:20]
                )
                titles = []
                invalid = []
                for pos in positions:
                    if 1 <= pos <= len(reminders):
                        titles.append(f"{pos}. '{reminders[pos-1].title}'")
                    else:
                        invalid.append(pos)
                if invalid:
                    return self._reply(f'❌ Position(s) {invalid} are out of range. You have {len(reminders)} reminders.')
                confirm_text = (
                    f'Please confirm the following:\n'
                    f'  📌 Action  : ⚠️ Delete Reminders (cannot be undone)\n'
                    f'  🗑️  To delete: {chr(10).join(titles)}\n\n'
                    f'Type "yes" to confirm or "no" to cancel.'
                )
                self._save_pending('_bulk_delete', {'positions': positions}, 'confirm')
                return self._reply(confirm_text)

            # ── Month-level record query ──
            month_query = self.classifier.get_month_query_intent(user_message)
            if month_query:
                record_type, month, year = month_query
                reply = self.tools.get_records_by_month(record_type, month, year)
                return self._reply(reply)

            # ── Date-specific record query ──
            date_query = self.classifier.get_date_query_intent(user_message)
            if date_query:
                record_type, date_str = date_query
                reply = self.tools.get_records_by_date(record_type, date_str)
                return self._reply(reply)

            # ── Action intent (write operations + generic show_*) ──
            action_intent = self.classifier.get_action_intent(user_message)

            if action_intent == 'show_reminders':
                return self._reply(self.tools.get_all_reminders())

            if action_intent == 'show_expenses':
                return self._reply(self.tools.get_expense_breakdown())

            if action_intent == 'show_income':
                return self._reply(self.tools.get_total_revenue())

            if action_intent == 'show_sales':
                return self._reply(self.tools.get_monthly_trend())

            if action_intent and action_intent in ACTION_FIELDS:
                params = self._extract_inline_params(action_intent, user_message)
                next_field, next_question = self._next_missing_field(action_intent, params)
                if next_field:
                    self._save_pending(action_intent, params, next_field)
                    action_labels = {
                        'create_reminder':    'Sure! Let me set up a reminder for you.',
                        'complete_reminder':  'Sure! Let me mark that reminder as complete.',
                        'uncomplete_reminder':'Sure! Let me revert that reminder.',
                        'delete_reminder':    'Sure! Let me delete that reminder.',
                        'add_expense':        'Sure! Let me record that expense.',
                        'add_income':         'Sure! Let me record that income.',
                        'add_sale':           'Sure! Let me record that sale.',
                    }
                    intro = action_labels.get(action_intent, 'Sure!')
                    return self._reply(f"{intro}\n\n{next_question}")
                else:
                    # All params extracted inline — ask for confirmation
                    self._save_pending(action_intent, params, 'confirm')
                    return self._reply(self._build_confirmation(action_intent, params))

            # ── Analytical / read query → Ollama ──
            intents = self.classifier.classify(user_message)
            business_data = self._get_selective_context(intents)

            prompt = f"""You are a senior business manager and financial advisor for SmartMSME. You speak with authority, clarity, and confidence.

Your tone:
- Direct and professional
- Use decisive language: "Here's what the numbers show", "My recommendation is"
- Always use ₹ (Indian Rupees) for all amounts
- Reference past conversation naturally when relevant
- Keep it concise

=== BUSINESS DATA ===
{business_data}

=== CONVERSATION HISTORY ===
{history}

=== QUESTION ===
{user_message}

Respond as a senior manager:"""

            response = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.6, "num_predict": 500}
                },
                timeout=60
            )

            if response.status_code == 200:
                ai_text = response.json()['response'].strip()
                return self._reply(ai_text, data=business_data)
            else:
                return self._reply(f"AI service error: Status {response.status_code}")

        except requests.exceptions.ConnectionError:
            return {'response': "Cannot connect to AI service. Make sure Ollama is running.", 'data': None}
        except Exception as e:
            return {'response': f"Error: {str(e)}", 'data': None}

    def clear_context(self):
        ChatMessage.objects.filter(user=self.user).delete()
