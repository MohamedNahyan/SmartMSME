from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .agent import BusinessAIAgent
from .tools import BusinessTools

class AIAgentChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        message = request.data.get('message', '')
        session_id = request.data.get('session_id', None)
        clear_context = request.data.get('clear_context', False)
        
        if not message:
            return Response({'error': 'Message is required'}, status=400)
        
        agent = BusinessAIAgent(request.user, session_id=session_id)
        
        if clear_context:
            agent.clear_context()
        
        result = agent.chat(message)
        
        return Response({
            'message': message,
            'response': result['response'],
            'data': result['data'],
            'intents': result['intents'],
            'entities': result['entities'],
            'session_id': agent.session_id
        })

class AIAgentClearContextView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id', None)
        agent = BusinessAIAgent(request.user, session_id=session_id)
        agent.clear_context()
        
        return Response({'message': 'Conversation context cleared successfully'})

class KPIRevenueView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tools = BusinessTools(request.user)
        branch_name = request.query_params.get('branch')
        result = tools.get_total_revenue(branch_name)
        return Response({'data': result})

class KPIExpensesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tools = BusinessTools(request.user)
        branch_name = request.query_params.get('branch')
        result = tools.get_total_expenses(branch_name)
        return Response({'data': result})

class KPIProfitView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tools = BusinessTools(request.user)
        branch_name = request.query_params.get('branch')
        result = tools.get_profit(branch_name)
        return Response({'data': result})

class KPITopProductsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tools = BusinessTools(request.user)
        limit = int(request.query_params.get('limit', 5))
        result = tools.get_top_products(limit)
        return Response({'data': result})

class KPIBranchPerformanceView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tools = BusinessTools(request.user)
        result = tools.get_branch_performance()
        return Response({'data': result})

class KPIExpenseBreakdownView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tools = BusinessTools(request.user)
        result = tools.get_expense_breakdown()
        return Response({'data': result})

class KPIMonthlyTrendView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tools = BusinessTools(request.user)
        months = int(request.query_params.get('months', 6))
        result = tools.get_monthly_trend(months)
        return Response({'data': result})

class KPIPendingRemindersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tools = BusinessTools(request.user)
        result = tools.get_pending_reminders()
        return Response({'data': result})
