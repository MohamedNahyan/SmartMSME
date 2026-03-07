# SmartMSME AI Agent Setup

## ✅ What I've Created

All AI agent files have been created successfully:

```
Backend/core/ai_agent/
├── __init__.py          ✅ Package initialization
├── tools.py             ✅ Business intelligence tools
├── agent.py             ✅ Main AI agent with Ollama integration
├── views.py             ✅ REST API endpoint
└── urls.py              ✅ URL routing

Backend/
├── test_ai_agent.py     ✅ Test script
└── requirements.txt     ✅ Updated with requests library
```

## 🚀 Next Steps

### 1. Install Dependencies
```bash
cd c:\Users\moham\Desktop\Nahyan\SmartMSME\Backend
pip install requests
```

### 2. Start Ollama Server
Open a **NEW terminal** and run:
```bash
ollama serve
```
Keep this running!

### 3. Start Django Server
Open **ANOTHER terminal** and run:
```bash
cd c:\Users\moham\Desktop\Nahyan\SmartMSME\Backend
python manage.py runserver
```

### 4. Test the AI Agent

#### Option A: Using the Test Script
```bash
# Edit test_ai_agent.py and update USERNAME and PASSWORD
python test_ai_agent.py
```

#### Option B: Using Postman

1. **Login to get token:**
   - Method: POST
   - URL: `http://127.0.0.1:8000/api/login/`
   - Body (JSON):
   ```json
   {
     "username": "your_username",
     "password": "your_password"
   }
   ```
   - Copy the `access` token from response

2. **Test AI Chat:**
   - Method: POST
   - URL: `http://127.0.0.1:8000/api/ai/chat/`
   - Headers:
     - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
     - `Content-Type`: `application/json`
   - Body (JSON):
   ```json
   {
     "message": "What is my total revenue?"
   }
   ```

## 🎯 Example Queries

Try asking these questions:
- "What is my total revenue?"
- "Which branch is performing best?"
- "Show me my top selling products"
- "What are my biggest expenses?"
- "Show me expense breakdown by category"
- "What is my profit margin?"
- "Show me monthly revenue trend"
- "Any pending reminders?"

## 🔧 Troubleshooting

### Error: "Cannot connect to Ollama"
**Solution:** Make sure Ollama is running
```bash
ollama serve
```

### Error: "Model not found"
**Solution:** Pull the model again
```bash
ollama pull llama3.1:8b
```

### Error: "401 Unauthorized"
**Solution:** Your JWT token expired, login again to get a new token

### Slow responses?
**Solution:** Your RTX 4060 should make it fast (2-5 seconds). If slow:
- Check if Ollama is using GPU: `nvidia-smi`
- Restart Ollama server

## 📊 API Endpoint

**Endpoint:** `POST /api/ai/chat/`

**Request:**
```json
{
  "message": "Your question here"
}
```

**Response:**
```json
{
  "message": "Your question here",
  "response": "AI generated response with insights and recommendations"
}
```

## 🎓 For Your MCA Demo

The AI agent can:
- ✅ Answer natural language questions about business data
- ✅ Analyze revenue, expenses, and profit
- ✅ Compare branch performance
- ✅ Identify top products
- ✅ Show expense breakdowns
- ✅ Display monthly trends
- ✅ List pending reminders
- ✅ Provide actionable recommendations

## 🚀 What's Next?

1. Build a frontend chat interface (React/Vue)
2. Add conversation history to database
3. Add more AI tools (predictions, alerts)
4. Create visual charts in frontend
5. Add export to PDF functionality

---

**Status:** ✅ AI Agent is ready to use!
