import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Bot, Send, Trash2 } from 'lucide-react'

export default function AIAssistant() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load history from backend on mount
  useEffect(() => {
    api.get('/ai/chat/').then(({ data }) => {
      if (data && data.length > 0) setMessages(data)
    }).catch(() => {})
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const clearChat = async () => {
    await api.post('/ai/clear-context/', {}).catch(() => {})
    setMessages([])
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/ai/chat/', { message: input })
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error processing request' }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 sm:p-6 border-b bg-white flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8" /> AI Business Assistant
          </h1>
          <p className="text-muted-foreground mt-2">Ask questions about your business performance</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={clearChat} className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Clear Chat
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <Bot className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <p className="text-lg">Ask me anything about your business!</p>
            <p className="text-sm mt-2">Try: "What's my profit this month?" or "Which branch is performing best?"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Card className={`max-w-2xl ${msg.role === 'user' ? 'bg-blue-600' : ''}`}>
              <CardContent className="p-4">
                <p className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : ''}`}>{msg.content}</p>
              </CardContent>
            </Card>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <Card className="max-w-2xl">
              <CardContent className="p-4">
                <p className="text-muted-foreground">Thinking...</p>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 sm:p-6 border-t bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about revenue, expenses, products..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={loading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
