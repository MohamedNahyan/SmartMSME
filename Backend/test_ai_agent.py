"""
Test script for SmartMSME AI Agent

Usage:
1. Make sure Ollama is running: ollama serve
2. Make sure Django is running: python manage.py runserver
3. Update USERNAME and PASSWORD below
4. Run: python test_ai_agent.py
"""

import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "admin"  # Change this to your username
PASSWORD = "admin"  # Change this to your password

def get_token():
    """Login and get JWT token"""
    print("🔐 Logging in...")
    response = requests.post(
        f"{BASE_URL}/api/login/",
        json={"username": USERNAME, "password": PASSWORD}
    )
    
    if response.status_code == 200:
        token = response.json()['access']
        print("✅ Login successful!\n")
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_ai_chat(token, message):
    """Test AI chat endpoint"""
    print(f"🤔 Question: {message}")
    print("⏳ Waiting for AI response...\n")
    
    response = requests.post(
        f"{BASE_URL}/api/ai/chat/",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={"message": message}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"🤖 AI Response:\n{data['response']}\n")
        print("-" * 80 + "\n")
        return True
    else:
        print(f"❌ Error: {response.text}\n")
        return False

def main():
    print("=" * 80)
    print("SmartMSME AI Agent Test")
    print("=" * 80 + "\n")
    
    # Get authentication token
    token = get_token()
    if not token:
        return
    
    # Test queries
    test_queries = [
        "What is my total revenue?",
        "Which branch is performing best?",
        "Show me my top products",
        "What are my biggest expenses?",
        "What is my profit margin?"
    ]
    
    for query in test_queries:
        test_ai_chat(token, query)
    
    print("✅ All tests completed!")

if __name__ == "__main__":
    main()
