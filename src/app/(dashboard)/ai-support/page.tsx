'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  Wrench,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface SuggestedPrompt {
  id: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const suggestedPrompts: SuggestedPrompt[] = [
  {
    id: '1',
    text: 'Why is pH high at Chennai-01?',
    icon: AlertTriangle,
    category: 'Analysis',
  },
  {
    id: '2',
    text: 'Show RO membrane trend for last 7 days',
    icon: TrendingUp,
    category: 'Trends',
  },
  {
    id: '3',
    text: 'When is the next scheduled maintenance?',
    icon: Wrench,
    category: 'Maintenance',
  },
  {
    id: '4',
    text: 'Generate daily operations report',
    icon: FileText,
    category: 'Reports',
  },
];

// Mock AI responses
const mockResponses: Record<string, string> = {
  'why is ph high at chennai': `Based on my analysis of Chennai WTP-01 sensor data:

**Current Status:**
- pH Level: 8.7 (exceeds threshold of 8.5)
- Duration: 15 minutes
- Trend: Rising over last 2 hours

**Probable Causes:**
1. **Chemical Dosing Imbalance** - The lime dosing pump may be over-dosing. Recommended action: Check pump calibration.
2. **Inlet Water Quality** - Recent rainfall may have affected source water alkalinity.
3. **Sensor Drift** - The pH sensor was last calibrated 45 days ago.

**Recommended Actions:**
1. Verify lime dosing pump settings
2. Check inlet water quality parameters
3. Schedule pH sensor calibration

Would you like me to create a maintenance ticket for the calibration?`,

  'show ro membrane trend': `Here's the RO membrane performance analysis for the last 7 days:

**Key Metrics:**
- Average Recovery Rate: 78.2%
- Average Permeate Flow: 342 m³/h
- Feed Pressure: 12.4 bar (stable)
- Differential Pressure: +0.3 bar (within normal)

**Observations:**
- Performance remains within optimal range
- No significant fouling indicators
- Salt rejection rate: 99.2% (excellent)

**Predicted Membrane Life:**
- Current Status: Healthy
- Estimated Remaining Life: 45 days
- Recommended: Schedule CIP cleaning in 2 weeks

Do you want me to generate a detailed membrane health report?`,

  'when is the next scheduled maintenance': `**Upcoming Maintenance Schedule:**

| Plant | Equipment | Type | Scheduled Date | Assigned |
|-------|-----------|------|----------------|----------|
| Chennai WTP-01 | RO Membrane Unit A | Preventive | Dec 12, 2024 | Amit Singh |
| Mumbai WTP-02 | Flow Sensor Array | Calibration | Dec 15, 2024 | Priya Sharma |
| Delhi WTP-03 | pH Sensor Bank | Replacement | **OVERDUE** | Rahul Kumar |
| Bangalore WTP-04 | Pump Motor P2 | Inspection | Dec 17, 2024 | Vikram Reddy |

**Attention Required:**
- Delhi WTP-03 pH sensor replacement is overdue by 1 day
- Recommend prioritizing this maintenance task

Should I escalate the overdue maintenance to the supervisor?`,

  'generate daily operations report': `**Report Generation Started**

I'm preparing the Daily Operations Summary report with the following data:

**Report Contents:**
- Executive Summary
- Plant-wise Performance Metrics
- Sensor Readings Summary
- Alert Statistics (5 active, 3 critical)
- Water Quality Parameters
- Compliance Status

**Processing:**
- Aggregating data from 6 plants
- Calculating KPIs
- Generating charts and visualizations

The report will be ready in approximately 2 minutes and will be available in the Reports section.

Would you like me to notify you when it's ready?`,

  default: `I understand you're asking about the water treatment operations. Let me help you with that.

Based on your query, I can assist with:
- **Real-time monitoring** - Check current sensor values and plant status
- **Alert analysis** - Investigate active alerts and their causes
- **Trend analysis** - View historical data and patterns
- **Maintenance** - Schedule and track maintenance activities
- **Reports** - Generate operational and compliance reports

Could you please provide more specific details about what you'd like to know? For example:
- Which plant or sensor are you interested in?
- What time period should I analyze?
- Do you need any specific metrics or KPIs?`,
};

const getAIResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('ph') && lowerMessage.includes('chennai')) {
    return mockResponses['why is ph high at chennai'];
  }
  if (lowerMessage.includes('ro') || lowerMessage.includes('membrane')) {
    return mockResponses['show ro membrane trend'];
  }
  if (lowerMessage.includes('maintenance') || lowerMessage.includes('scheduled')) {
    return mockResponses['when is the next scheduled maintenance'];
  }
  if (lowerMessage.includes('report') || lowerMessage.includes('generate')) {
    return mockResponses['generate daily operations report'];
  }

  return mockResponses['default'];
};

export default function AISupportPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI assistant for AquaFlow. I can help you with:

- **Analyzing alerts** and diagnosing issues
- **Viewing trends** and historical data
- **Managing maintenance** schedules
- **Generating reports** and insights

How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Add AI response
    const aiResponse: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: getAIResponse(content),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="AI Agentic Support"
        subtitle="Intelligent assistant for operations and analytics"
      />

      <div className="flex-1 p-8 flex gap-6">
        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-4',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <Avatar
                    className={cn(
                      'h-9 w-9 flex-shrink-0',
                      message.role === 'assistant' && 'gradient-bg'
                    )}
                  >
                    <AvatarFallback
                      className={cn(
                        message.role === 'assistant' && 'text-white',
                        message.role === 'user' && 'bg-muted'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <Bot className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'flex-1 space-y-2',
                      message.role === 'user' && 'text-right'
                    )}
                  >
                    <div
                      className={cn(
                        'inline-block rounded-xl px-4 py-3 text-sm',
                        message.role === 'assistant'
                          ? 'bg-muted text-left prose prose-sm max-w-none [&_table]:text-xs [&_table]:w-full [&_th]:text-left [&_th]:py-1 [&_td]:py-1'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br />')
                              .replace(/\|(.*)\|/g, (match) => {
                                const cells = match.split('|').filter(Boolean);
                                return `<tr>${cells.map((c) => `<td class="border-b border-border px-2">${c.trim()}</td>`).join('')}</tr>`;
                              }),
                          }}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4">
                  <Avatar className="h-9 w-9 gradient-bg">
                    <AvatarFallback className="text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      AI is analyzing...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="max-w-3xl mx-auto flex gap-3">
              <Input
                ref={inputRef}
                placeholder="Ask me anything about your water treatment operations..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Suggested Prompts Sidebar */}
        <Card className="w-80 flex-shrink-0 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-[var(--accent-purple)]" />
            <h3 className="font-semibold">Suggested Questions</h3>
          </div>
          <div className="space-y-3">
            {suggestedPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.id}
                  onClick={() => handlePromptClick(prompt.text)}
                  disabled={isTyping}
                  className="w-full text-left p-3 rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {prompt.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{prompt.text}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-semibold mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handlePromptClick('Show all active alerts')}
                disabled={isTyping}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-[var(--danger)]" />
                View Active Alerts
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handlePromptClick('Generate daily operations report')}
                disabled={isTyping}
              >
                <FileText className="h-4 w-4 mr-2 text-[var(--accent-blue)]" />
                Generate Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handlePromptClick('Check system health status')}
                disabled={isTyping}
              >
                <TrendingUp className="h-4 w-4 mr-2 text-[var(--success)]" />
                System Health
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
