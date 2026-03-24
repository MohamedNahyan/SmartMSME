import requests
from django.conf import settings
from core.models import ChatMessage
from .tools import BusinessTools
from .intent_classifier import IntentClassifier


class BusinessAIAgent:
    def __init__(self, user, session_id=None):
        self.user = user
        self.tools = BusinessTools(user)
        self.classifier = IntentClassifier()
        self.ollama_url = getattr(settings, 'OLLAMA_URL', 'http://localhost:11434/api/generate')
        self.model = getattr(settings, 'OLLAMA_MODEL', 'llama3.1:8b')

    def _get_selective_context(self, intents: dict) -> str:
        parts = []
        # If no clear intent detected, fetch everything
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
            parts.append(self.tools.get_pending_reminders())

        return "\n\n".join(parts)

    def _get_history(self) -> str:
        messages = ChatMessage.objects.filter(user=self.user).order_by('-created_at')[:20]
        lines = []
        for m in reversed(list(messages)):
            label = "User" if m.role == "user" else "Assistant"
            lines.append(f"{label}: {m.content}")
        return "\n".join(lines)

    def chat(self, user_message: str) -> dict:
        try:
            # Fetch history BEFORE saving to avoid current message appearing twice
            history = self._get_history()
            ChatMessage.objects.create(user=self.user, role="user", content=user_message)

            intents = self.classifier.classify(user_message)
            business_data = self._get_selective_context(intents)

            prompt = f"""You are a senior business manager and financial advisor for SmartMSME. You speak with authority, clarity, and confidence like an experienced manager briefing their team.

Your tone:
- Direct and professional, but not cold
- Use decisive language like: "Here's what the numbers show", "My recommendation is", "We need to address"
- Point out risks and opportunities clearly
- Always use ₹ (Indian Rupees) for all amounts
- Reference past conversation naturally when relevant
- Keep it concise, managers don't ramble

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
                ChatMessage.objects.create(user=self.user, role="assistant", content=ai_text)
                return {'response': ai_text, 'data': business_data}
            else:
                return {'response': f"Error: Status {response.status_code}", 'data': None}

        except requests.exceptions.ConnectionError:
            return {'response': "Cannot connect to AI service. Make sure Ollama is running.", 'data': None}
        except Exception as e:
            return {'response': f"Error: {str(e)}", 'data': None}

    def clear_context(self):
        ChatMessage.objects.filter(user=self.user).delete()
