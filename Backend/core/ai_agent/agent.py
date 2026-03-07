import requests
from .tools import BusinessTools
from .intent_classifier import IntentClassifier
from typing import Dict

class ConversationContext:
    def __init__(self, max_history=5):
        self.history = []
        self.max_history = max_history
        self.last_intent = None
        self.last_entities = {}
    
    def add_message(self, role: str, content: str, intent: Dict = None, entities: Dict = None):
        self.history.append({'role': role, 'content': content, 'intent': intent, 'entities': entities})
        if len(self.history) > self.max_history * 2:
            self.history = self.history[-self.max_history * 2:]
        if intent:
            self.last_intent = intent
        if entities:
            self.last_entities = entities
    
    def get_context_summary(self) -> str:
        if not self.history:
            return ""
        summary = "Previous conversation:\n"
        for msg in self.history[-4:]:
            role = "User" if msg['role'] == 'user' else "Assistant"
            summary += f"{role}: {msg['content'][:100]}...\n"
        return summary
    
    def clear(self):
        self.history = []
        self.last_intent = None
        self.last_entities = {}

class BusinessAIAgent:
    _contexts = {}
    
    def __init__(self, user, session_id=None):
        self.user = user
        self.tools = BusinessTools(user)
        self.classifier = IntentClassifier()
        self.ollama_url = "http://localhost:11434/api/generate"
        self.model = "llama3.1:8b"
        
        self.session_id = session_id or f"user_{user.id}"
        if self.session_id not in BusinessAIAgent._contexts:
            BusinessAIAgent._contexts[self.session_id] = ConversationContext()
        self.context = BusinessAIAgent._contexts[self.session_id]
    
    def _get_system_prompt(self):
        return """You are a friendly business advisor for SmartMSME. 

Your responses should:
- Start with a direct answer to the question
- Use simple, conversational language
- Break down complex information into bullet points
- Highlight important numbers with context
- End with 1-2 actionable recommendations
- Reference previous conversation when relevant
- Avoid technical jargon

Format your response in a clear, scannable way using line breaks and structure."""
    
    def _resolve_context_references(self, query: str, entities: Dict) -> Dict:
        resolved = entities.copy()
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['it', 'that', 'same', 'this']):
            if not resolved.get('branch_name') and self.context.last_entities.get('branch_name'):
                resolved['branch_name'] = self.context.last_entities['branch_name']
            if not resolved.get('time_period') and self.context.last_entities.get('time_period'):
                resolved['time_period'] = self.context.last_entities['time_period']
        
        return resolved
    
    def _parse_and_execute_tools(self, query: str, intents: Dict, entities: Dict) -> str:
        results = []
        entities = self._resolve_context_references(query, entities)
        sorted_intents = sorted(intents.items(), key=lambda x: x[1], reverse=True)
        branch_name = entities.get('branch_name')
        time_period = entities.get('time_period')
        
        for intent, score in sorted_intents:
            if intent == 'profit':
                results.append(self.tools.get_profit(branch_name, time_period))
            elif intent == 'revenue':
                if 'trend' in intents:
                    results.append(self.tools.get_monthly_trend(time_period=time_period))
                elif 'compare' in intents or 'branch' in intents:
                    results.append(self.tools.get_branch_performance(time_period))
                else:
                    results.append(self.tools.get_total_revenue(branch_name, time_period))
            elif intent == 'expense':
                if 'breakdown' in intents:
                    results.append(self.tools.get_expense_breakdown(time_period))
                else:
                    results.append(self.tools.get_total_expenses(branch_name, time_period))
            elif intent == 'product':
                results.append(self.tools.get_top_products(time_period=time_period))
            elif intent == 'branch' and 'compare' in intents:
                results.append(self.tools.get_branch_performance(time_period))
            elif intent == 'reminder':
                results.append(self.tools.get_pending_reminders())
            elif intent == 'trend':
                results.append(self.tools.get_monthly_trend(time_period=time_period))
        
        if not results:
            results.append(self.tools.get_profit(time_period=time_period))
            results.append(self.tools.get_branch_performance(time_period))
        
        return "\n\n".join(dict.fromkeys(results))
    
    def chat(self, user_message: str) -> Dict:
        try:
            intents = self.classifier.classify(user_message)
            entities = self.classifier.extract_entities(user_message)
            self.context.add_message('user', user_message, intents, entities)
            
            tool_results = self._parse_and_execute_tools(user_message, intents, entities)
            context_summary = self.context.get_context_summary()
            
            prompt = f"""{self._get_system_prompt()}

{context_summary}

Business Data:
{tool_results}

User Question: {user_message}

Provide a clear, friendly response:"""
            
            response = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 400}
                },
                timeout=60
            )
            
            if response.status_code == 200:
                ai_text = response.json()['response'].strip()
                self.context.add_message('assistant', ai_text)
                return {
                    'response': ai_text,
                    'data': tool_results,
                    'intents': intents,
                    'entities': entities
                }
            else:
                return {
                    'response': f"❌ Error: Unable to generate response (Status {response.status_code})",
                    'data': None,
                    'intents': intents,
                    'entities': entities
                }
                
        except requests.exceptions.ConnectionError:
            return {'response': "❌ Cannot connect to AI service. Please ensure Ollama is running.", 'data': None, 'intents': {}, 'entities': {}}
        except Exception as e:
            return {'response': f"❌ Error: {str(e)}", 'data': None, 'intents': {}, 'entities': {}}
    
    def clear_context(self):
        self.context.clear()
