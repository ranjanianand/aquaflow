'use client';

import { useState, useRef, useEffect } from 'react';
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
  MessageSquare,
  Cpu,
  ChevronRight,
  Activity,
  Database,
  BookOpen,
  HardDrive,
  Clock,
  CheckCircle2,
  Search,
  Layers,
  RefreshCw,
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
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header - Compact */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Cpu className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">AI Agentic Support</span>
          <span className="text-[10px] text-slate-400">Intelligent Operations Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          {/* AI Status Indicator */}
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-700 border border-slate-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              AI Online
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              1.2s avg
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 flex gap-6">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col border-2 border-slate-300 bg-white overflow-hidden">
          {/* Chat Header */}
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Conversation
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500">
                {messages.length} messages
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 p-6 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 320px)' }}
          >
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-4',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'h-9 w-9 flex-shrink-0 flex items-center justify-center',
                      message.role === 'assistant'
                        ? 'bg-blue-600'
                        : 'bg-slate-600'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <Bot className="h-5 w-5 text-white" />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={cn(
                      'flex-1 space-y-1',
                      message.role === 'user' && 'text-right'
                    )}
                  >
                    {/* Sender Label */}
                    <div className={cn(
                      'text-[9px] font-bold uppercase tracking-wider',
                      message.role === 'assistant' ? 'text-blue-600' : 'text-slate-500'
                    )}>
                      {message.role === 'assistant' ? 'AquaFlow AI' : 'You'}
                    </div>

                    {/* Message Box */}
                    <div
                      className={cn(
                        'inline-block px-4 py-3 text-[13px] border-2',
                        message.role === 'assistant'
                          ? 'bg-slate-50 border-slate-200 text-left'
                          : 'bg-slate-700 border-slate-600 text-white'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div
                          className="prose prose-sm max-w-none [&_table]:text-xs [&_table]:w-full [&_th]:text-left [&_th]:py-1 [&_td]:py-1 [&_strong]:text-slate-800 [&_strong]:font-semibold"
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br />')
                              .replace(/\|(.*)\|/g, (match) => {
                                const cells = match.split('|').filter(Boolean);
                                return `<tr>${cells.map((c) => `<td class="border-b border-slate-200 px-2 py-1 text-[12px]">${c.trim()}</td>`).join('')}</tr>`;
                              }),
                          }}
                        />
                      ) : (
                        message.content
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-[10px] text-slate-400 font-mono">
                      {format(message.timestamp, 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-4">
                  <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-blue-600">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                      AquaFlow AI
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-[12px] text-slate-500">
                        Analyzing your request...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-slate-300 bg-slate-50 p-4">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask me anything about your water treatment operations..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                className="flex-1 h-11 px-4 text-[13px] border-2 border-slate-300 bg-white focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className={cn(
                  'h-11 px-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-colors',
                  inputValue.trim() && !isTyping
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          {/* Suggested Questions */}
          <div className="border-2 border-slate-300 bg-white">
            <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Suggested Questions
              </span>
            </div>
            <div className="p-3 space-y-2">
              {suggestedPrompts.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt.text)}
                    disabled={isTyping}
                    className="w-full text-left p-3 border-2 border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-500">
                        {prompt.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-medium text-slate-700">{prompt.text}</p>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RAG Knowledge Base */}
          <div className="border-2 border-slate-300 bg-white">
            <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Knowledge Base
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] text-emerald-600 font-medium">SYNCED</span>
              </div>
            </div>
            <div className="p-3 space-y-3">
              {/* Indexed Data Sources */}
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Indexed Sources
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3 w-3 text-blue-500" />
                      <span className="text-[11px] text-slate-700">Sensor Data</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">2.4M records</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-amber-500" />
                      <span className="text-[11px] text-slate-700">Maintenance Logs</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">12.8K docs</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3 text-purple-500" />
                      <span className="text-[11px] text-slate-700">Equipment Manuals</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">847 pages</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-[11px] text-slate-700">Alert History</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">45.2K events</span>
                  </div>
                </div>
              </div>

              {/* Embedding Stats */}
              <div className="pt-2 border-t border-slate-200">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Vector Index
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-50 border border-blue-200">
                    <div className="text-[9px] text-blue-600 uppercase">Embeddings</div>
                    <div className="text-[14px] font-bold font-mono text-blue-700">3.2M</div>
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-200">
                    <div className="text-[9px] text-emerald-600 uppercase">Accuracy</div>
                    <div className="text-[14px] font-bold font-mono text-emerald-700">98.4%</div>
                  </div>
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  Last sync: 5 min ago
                </div>
                <button className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700">
                  <RefreshCw className="h-3 w-3" />
                  Sync
                </button>
              </div>
            </div>
          </div>

          {/* RAG Context Panel */}
          <div className="border-2 border-slate-300 bg-white">
            <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Retrieval Context
              </span>
            </div>
            <div className="p-3 space-y-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Last Query Sources
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-medium text-slate-700">pH Sensor Calibration Guide</div>
                    <div className="text-[9px] text-slate-400">Relevance: 94%</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-medium text-slate-700">Chennai WTP-01 Sensor History</div>
                    <div className="text-[9px] text-slate-400">Relevance: 89%</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-medium text-slate-700">Lime Dosing SOP v2.1</div>
                    <div className="text-[9px] text-slate-400">Relevance: 76%</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Layers className="h-3 w-3" />
                  3 chunks retrieved
                </div>
                <span className="text-[9px] font-mono text-slate-400">~1,240 tokens</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
