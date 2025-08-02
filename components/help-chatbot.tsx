"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2,
  HelpCircle,
  Building2,
  FileText,
  Users,
  TrendingUp,
  Shield
} from "lucide-react"
import { COHERE_API_KEY, COHERE_API_URL, SYSTEM_PROMPT, QUICK_QUESTIONS } from "@/lib/chatbot-config"

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isLoading?: boolean
}

interface QuickQuestion {
  id: string
  text: string
  icon: React.ReactNode
}

const quickQuestions: QuickQuestion[] = [
  {
    id: "1",
    text: "How does TenderChain work?",
    icon: <Building2 className="h-4 w-4" />
  },
  {
    id: "2", 
    text: "What are the pricing plans?",
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: "3",
    text: "How to submit a bid?",
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: "4",
    text: "What is the verification process?",
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: "5",
    text: "How does AI analysis work?",
    icon: <Bot className="h-4 w-4" />
  },
  {
    id: "6",
    text: "Contact support",
    icon: <Users className="h-4 w-4" />
  }
]

const systemPrompt = `You are a helpful customer support assistant for TenderChain, a blockchain and AI-powered tender management platform. 

Key Information about TenderChain:
- Platform for managing tender projects and bids using blockchain technology and AI
- Two user types: Tenders (project creators) and Bidders (project bidders)
- Features include AI-powered bid analysis, blockchain verification, automated evaluation
- Pricing plans: Free (5 projects), Subscription (₹999/month unlimited), Enterprise (custom)
- ML analysis considers: ongoing projects, conflicting deadlines, employee count, company capacity, financial stability
- Minimum bid amount: 80% of project budget
- Verification process for companies and documents

Common Topics:
1. How to create/manage tender projects
2. How to submit and analyze bids
3. Pricing and subscription plans
4. AI analysis and scoring
5. Company verification process
6. Technical support and troubleshooting

Always be helpful, professional, and provide accurate information about TenderChain. If you don't know something specific, suggest contacting support.`

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your TenderChain assistant. How can I help you today? I can answer questions about our platform, pricing, bidding process, AI analysis, and more!",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch(COHERE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          preamble: SYSTEM_PROMPT,
          model: "command-r-plus",
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response from Cohere')
      }

      const data = await response.json()
      const botResponse = data.text || "I'm sorry, I couldn't process your request. Please try again or contact our support team."

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chatbot error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact our support team for immediate assistance.",
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: QuickQuestion) => {
    sendMessage(question.text)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <style jsx global>{`
            .chat-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .chat-scrollbar::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 3px;
            }
            .chat-scrollbar::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 3px;
            }
            .chat-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          `}</style>
          <CardHeader className="bg-primary text-white rounded-t-lg pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6" />
                <div>
                  <CardTitle className="text-lg">TenderChain Assistant</CardTitle>
                  <p className="text-sm opacity-90">AI-powered help center</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Online
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full overflow-y-auto pr-4" style={{ maxHeight: 'calc(600px - 180px)' }}>
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.sender === 'bot' && (
                          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        {message.sender === 'user' && (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4" />
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">Typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Questions:</p>
              <div className="grid grid-cols-1 gap-2">
                {quickQuestions.map((question) => (
                  <Button
                    key={question.id}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto p-2"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    <div className="flex items-center space-x-2">
                      {question.icon}
                      <span className="text-xs">{question.text}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about TenderChain..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by AI • Your data is secure
            </p>
          </div>
        </div>
      )}
    </>
  )
} 