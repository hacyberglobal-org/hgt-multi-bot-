import React, { useState, useEffect, useRef } from 'react';
import { safeStorage as localStorage } from '../lib/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Search, 
  CheckCheck, 
  Clock, 
  Sparkles, 
  Phone, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Download, 
  Zap, 
  Sliders, 
  Globe, 
  X, 
  ChevronRight, 
  Circle,
  Truck,
  ShoppingBag,
  DollarSign,
  Share2,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { toast } from 'sonner';

export type NonSparkPlatform = 
  | 'DoorDash'
  | 'Instacart'
  | 'Uber Eats'
  | 'Amazon Flex'
  | 'Veho'
  | 'Shipt'
  | 'Grubhub'
  | 'Roadie'
  | 'General Support'
  | 'VIP Dispatch';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'bot' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'synced';
  payloadCard?: {
    title: string;
    payout: string;
    details: string;
    actionUrl?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  platform: NonSparkPlatform;
  contactHandle: string;
  contactPhone?: string;
  priority: 'NORMAL' | 'HIGH' | 'VIP';
  autoBotEnabled: boolean;
  unreadCount: number;
  lastMessage: string;
  lastTimestamp: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface MultiPlatformChatProps {
  onAddLog: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'competitor' | 'expire' | 'warning', 
    message: string, 
    offerId?: string, 
    badge?: string
  ) => void;
  activeDomain?: string;
}

const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: 'chat-dd-01',
    title: 'DoorDash High-Value Dispatch',
    platform: 'DoorDash',
    contactHandle: '@dash_dispatcher_88',
    contactPhone: '+1 (312) 884-2041',
    priority: 'HIGH',
    autoBotEnabled: true,
    unreadCount: 0,
    lastMessage: 'DoorDash batch order #DD-9021 confirmed at $34.50 (3.2 mi). Auto-grabber standing by.',
    lastTimestamp: '10:42 AM',
    createdAt: '2026-08-10',
    messages: [
      {
        id: 'm-1',
        sender: 'system',
        senderName: 'System',
        text: '⚡ New DoorDash Dispatch Channel initialized. Multi-Bot proxy listening on port 3000.',
        timestamp: '10:30 AM',
        status: 'synced'
      },
      {
        id: 'm-2',
        sender: 'agent',
        senderName: 'Dispatch Agent Marcus',
        text: 'Welcome to the DoorDash VIP Dispatch Line. Send batch parameters or target restaurant IDs.',
        timestamp: '10:32 AM',
        status: 'read'
      },
      {
        id: 'm-3',
        sender: 'user',
        senderName: 'Lead Driver',
        text: 'Looking for high pay shop & deliver orders around Downtown SF area (> $25 pay, under 5 mi).',
        timestamp: '10:38 AM',
        status: 'read'
      },
      {
        id: 'm-4',
        sender: 'bot',
        senderName: 'HGT DD-Bot v4.2',
        text: 'DoorDash batch order #DD-9021 confirmed at $34.50 (3.2 mi). Auto-grabber standing by.',
        timestamp: '10:42 AM',
        status: 'read',
        payloadCard: {
          title: 'DoorDash Premium Grocery Batch',
          payout: '$34.50',
          details: 'Target: Safeway #2901 | 18 Items | 3.2 Miles | Est. Time: 22 mins'
        }
      }
    ]
  },
  {
    id: 'chat-ic-02',
    title: 'Instacart Fast-Batch Terminal',
    platform: 'Instacart',
    contactHandle: '@ic_batch_runner',
    contactPhone: '+1 (415) 902-1188',
    priority: 'VIP',
    autoBotEnabled: true,
    unreadCount: 1,
    lastMessage: 'Instacart $58.00 Costco double batch detected in zone #904.',
    lastTimestamp: '10:15 AM',
    createdAt: '2026-08-10',
    messages: [
      {
        id: 'm-ic-1',
        sender: 'system',
        senderName: 'System',
        text: '🛒 Instacart Batch Channel active. Sub-100ms tapper active.',
        timestamp: '10:00 AM',
        status: 'synced'
      },
      {
        id: 'm-ic-2',
        sender: 'bot',
        senderName: 'Instacart Auto-Tapper',
        text: 'Instacart $58.00 Costco double batch detected in zone #904.',
        timestamp: '10:15 AM',
        status: 'delivered',
        payloadCard: {
          title: 'Instacart Heavy Costco Double Batch',
          payout: '$58.00',
          details: 'Costco Warehouse #122 | 24 Units | 6.8 Miles | Tip: $38.00'
        }
      }
    ]
  },
  {
    id: 'chat-af-03',
    title: 'Amazon Flex Block Dispatch',
    platform: 'Amazon Flex',
    contactHandle: '@flex_sub_same_day',
    contactPhone: '+1 (206) 555-8902',
    priority: 'NORMAL',
    autoBotEnabled: false,
    unreadCount: 0,
    lastMessage: '3.5 Hour Sub-Same-Day Block available for $112.00 at SSD VCA1.',
    lastTimestamp: '09:50 AM',
    createdAt: '2026-08-10',
    messages: [
      {
        id: 'm-af-1',
        sender: 'user',
        senderName: 'Flex Dispatcher',
        text: 'Monitor VCA1 SSD warehouse for evening surges over $30/hr.',
        timestamp: '09:45 AM',
        status: 'read'
      },
      {
        id: 'm-af-2',
        sender: 'agent',
        senderName: 'Flex AI Monitor',
        text: '3.5 Hour Sub-Same-Day Block available for $112.00 at SSD VCA1.',
        timestamp: '09:50 AM',
        status: 'read'
      }
    ]
  }
];

export default function MultiPlatformChat({ onAddLog, activeDomain = 'hacyberglobal.linkpc.net' }: MultiPlatformChatProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('hgt_nonspark_chat_sessions');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'chat-dd-01';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Chat Form States
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState<NonSparkPlatform>('DoorDash');
  const [newHandle, setNewHandle] = useState('@driver_lead_01');
  const [newPhone, setNewPhone] = useState('+1 (415) 555-0199');
  const [newPriority, setNewPriority] = useState<'NORMAL' | 'HIGH' | 'VIP'>('HIGH');
  const [newInitialMsg, setNewInitialMsg] = useState('Hello! Welcome to our multi-platform non-Spark dispatch line. How can we assist with your driver route today?');
  const [newEnableAutoBot, setNewEnableAutoBot] = useState(true);

  // Auto scroll chat body
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem('hgt_nonspark_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Handle creating a brand new chat (NOT Spark)
  const handleCreateNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Please enter a chat title');
      return;
    }

    const newId = `chat-custom-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const initialMessages: ChatMessage[] = [
      {
        id: `m-${Date.now()}-1`,
        sender: 'system',
        senderName: 'System Gateway',
        text: `🚀 Created new non-Spark Chat Channel for ${newPlatform} (${newHandle}). Proxy endpoint initialized.`,
        timestamp: nowTime,
        status: 'synced'
      }
    ];

    if (newInitialMsg.trim()) {
      initialMessages.push({
        id: `m-${Date.now()}-2`,
        sender: 'agent',
        senderName: 'Dispatch Agent',
        text: newInitialMsg.trim(),
        timestamp: nowTime,
        status: 'read'
      });
    }

    const newSessionItem: ChatSession = {
      id: newId,
      title: newTitle.trim(),
      platform: newPlatform,
      contactHandle: newHandle.startsWith('@') ? newHandle : `@${newHandle}`,
      contactPhone: newPhone,
      priority: newPriority,
      autoBotEnabled: newEnableAutoBot,
      unreadCount: 0,
      lastMessage: newInitialMsg.trim() || 'New Chat Created',
      lastTimestamp: nowTime,
      createdAt: new Date().toISOString().split('T')[0],
      messages: initialMessages
    };

    setSessions(prev => [newSessionItem, ...prev]);
    setActiveSessionId(newId);
    setShowNewChatModal(false);

    // Reset form defaults
    setNewTitle('');
    setNewInitialMsg('Hello! Welcome to our multi-platform non-Spark dispatch line. How can we assist with your driver route today?');

    onAddLog(
      'info',
      `💬 NEW CHAT CREATED (NON-SPARK): Opened channel "${newSessionItem.title}" for ${newPlatform}`,
      undefined,
      'NEW_CHAT'
    );
    toast.success(`Created new chat channel for ${newPlatform}!`);
  };

  // Send message in active session
  const handleSendMessage = (customText?: string, payloadCard?: ChatMessage['payloadCard']) => {
    const textToSend = customText || messageInput;
    if (!textToSend.trim() && !payloadCard) return;

    if (!currentSession) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      senderName: 'Operator',
      text: textToSend.trim(),
      timestamp: nowTime,
      status: 'synced',
      payloadCard
    };

    const updatedMessages = [...currentSession.messages, userMsg];

    setSessions(prev => prev.map(s => {
      if (s.id === currentSession.id) {
        return {
          ...s,
          lastMessage: textToSend.trim() || 'Sent order payload',
          lastTimestamp: nowTime,
          messages: updatedMessages
        };
      }
      return s;
    }));

    setMessageInput('');

    // Trigger Telegram / Webhook notification forward
    try {
      const tgToken = localStorage.getItem('spark_bot_tg_token');
      const tgChatId = localStorage.getItem('spark_bot_tg_chat_id');
      if (tgToken && tgChatId && !tgToken.includes('mock') && tgToken.length > 20) {
        const textMsg = `💬 [Multi-Platform Chat - ${currentSession.platform}] ${currentSession.title}\n\nSender: Operator\nMessage: ${textToSend}\nContact: ${currentSession.contactHandle}`;
        fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChatId, text: textMsg })
        }).catch(err => console.error("TG sync error", err));
      }
    } catch (_) {}

    // If Auto Bot Response is enabled for this chat, generate an intelligent AI reply
    if (currentSession.autoBotEnabled) {
      setTimeout(() => {
        const botReplyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let botText = `🤖 [${currentSession.platform} Bot] Received request: "${textToSend}". Auto-grabber filters configured and listening for high-value ${currentSession.platform} batches.`;

        if (textToSend.toLowerCase().includes('pay') || textToSend.toLowerCase().includes('rate')) {
          botText = `💵 [${currentSession.platform} Bot] Minimum pay threshold set to $25.00. High payout route matching in progress!`;
        } else if (textToSend.toLowerCase().includes('store') || textToSend.toLowerCase().includes('warehouse')) {
          botText = `📍 [${currentSession.platform} Bot] Target location geofence locked. Auto-polling interval: 1200ms.`;
        } else if (textToSend.toLowerCase().includes('help') || textToSend.toLowerCase().includes('support')) {
          botText = `🛡️ [${currentSession.platform} VIP Agent] Dispatch support team notified. An agent will join this thread shortly.`;
        }

        const botMsg: ChatMessage = {
          id: `m-bot-${Date.now()}`,
          sender: 'bot',
          senderName: `${currentSession.platform} AI Dispatch`,
          text: botText,
          timestamp: botReplyTime,
          status: 'read'
        };

        setSessions(prev => prev.map(s => {
          if (s.id === currentSession.id) {
            return {
              ...s,
              lastMessage: botText,
              lastTimestamp: botReplyTime,
              messages: [...s.messages, botMsg]
            };
          }
          return s;
        }));

        onAddLog(
          'bot_accept',
          `🤖 CHAT AGENT REPLY (${currentSession.platform}): Dispatched auto-response to ${currentSession.contactHandle}`,
          undefined,
          'CHAT_BOT'
        );
      }, 1000);
    }
  };

  const handleQuickTemplate = (type: 'PAYLOAD' | 'GEOFENCE' | 'SUPPORT' | 'REFUND') => {
    if (!currentSession) return;

    if (type === 'PAYLOAD') {
      const card = {
        title: `${currentSession.platform} High-Priority Batch`,
        payout: `$${(Math.random() * 25 + 22).toFixed(2)}`,
        details: `Store: ${currentSession.platform} Hub | Distance: ${(Math.random() * 4 + 1.2).toFixed(1)} mi | Items: ${Math.floor(Math.random() * 15 + 4)}`
      };
      handleSendMessage(`Dispatched payload parameters for ${currentSession.platform} order.`, card);
    } else if (type === 'GEOFENCE') {
      handleSendMessage(`📍 Verification request: Confirm GPS geofence coordinate sync for ${currentSession.platform} hub.`);
    } else if (type === 'SUPPORT') {
      handleSendMessage(`📞 Support Alert: Requesting priority supervisor assistance for driver route.`);
    } else if (type === 'REFUND') {
      handleSendMessage(`💳 Billing Update: Processing instant credit adjustment for trip delay.`);
    }
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      toast.error('Cannot delete the only remaining chat session.');
      return;
    }

    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      setActiveSessionId(remaining[0]?.id || '');
    }
    toast.success('Chat thread deleted.');
  };

  const handleToggleAutoBot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSession) return;
    const nextState = !currentSession.autoBotEnabled;
    setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, autoBotEnabled: nextState } : s));
    toast.info(`AI Auto-Bot is now ${nextState ? 'ENABLED' : 'DISABLED'} for ${currentSession.title}`);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactHandle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlatformBadgeColor = (plat: NonSparkPlatform) => {
    switch (plat) {
      case 'DoorDash': return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'Instacart': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Uber Eats': return 'bg-green-500/15 text-green-300 border-green-500/30';
      case 'Amazon Flex': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Veho': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Shipt': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Grubhub': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'Roadie': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'VIP Dispatch': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse';
      default: return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[680px]">
      
      {/* Top Header Bar */}
      <div className="bg-neutral-950 border-b border-neutral-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Multi-Platform Chat Center</h2>
              <span className="text-[9px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                NON-SPARK DISPATCH
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Live driver chat & automated dispatch threads for DoorDash, Instacart, Uber Eats, Amazon Flex & more.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNewChatModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-bold font-mono text-xs rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW CHAT</span>
        </button>
      </div>

      {/* Main Body Grid: Sidebar + Active Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-[580px]">
        
        {/* Left Sidebar: Session List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-neutral-800 bg-neutral-950/60 flex flex-col">
          
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-neutral-800">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search chats, handles, platforms..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 outline-none font-mono transition-all"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-10 px-4 text-neutral-500 font-mono text-xs">
                No chats found matching search.
              </div>
            ) : (
              filteredSessions.map(session => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-neutral-850 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                        : 'bg-neutral-900/40 hover:bg-neutral-850/60 border-neutral-850 hover:border-neutral-750'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-neutral-600'}`} />
                        <h4 className="text-xs font-bold text-white truncate">{session.title}</h4>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500 shrink-0">{session.lastTimestamp}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getPlatformBadgeColor(session.platform)}`}>
                          {session.platform}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 truncate">{session.contactHandle}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {session.autoBotEnabled && (
                          <span title="AI Bot Auto-Response Enabled" className="p-0.5 text-cyan-400">
                            <Bot className="w-3 h-3" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteChat(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                          title="Delete Chat Session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400 truncate mt-1.5 line-clamp-1 font-mono">
                      {session.lastMessage}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Stats Footbar */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-950 font-mono text-[10px] text-neutral-400 flex items-center justify-between">
            <span>TOTAL CHATS: <strong className="text-white">{sessions.length}</strong></span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Circle className="w-2 h-2 fill-cyan-400 text-cyan-400 animate-pulse" /> LIVE DISPATCH
            </span>
          </div>
        </div>

        {/* Right Pane: Active Chat Area (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-neutral-900">
          
          {currentSession ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3 md:p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400 shrink-0 font-bold font-mono text-sm">
                    {currentSession.platform[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{currentSession.title}</h3>
                      <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${getPlatformBadgeColor(currentSession.platform)}`}>
                        {currentSession.platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 mt-0.5">
                      <span>Handle: <strong className="text-cyan-300">{currentSession.contactHandle}</strong></span>
                      {currentSession.contactPhone && (
                        <span>Phone: <strong className="text-neutral-300">{currentSession.contactPhone}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Auto Bot Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleAutoBot}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentSession.autoBotEnabled
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                    title="Toggle AI Bot Auto-Response for this Chat"
                  >
                    <Bot className={`w-3.5 h-3.5 ${currentSession.autoBotEnabled ? 'text-cyan-400 animate-pulse' : ''}`} />
                    <span>AI BOT: {currentSession.autoBotEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyText(currentSession.contactHandle, 'Handle')}
                    className="p-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg border border-neutral-700 cursor-pointer"
                    title="Copy Contact Handle"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[380px] max-h-[500px]">
                {currentSession.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isBot = msg.sender === 'bot';
                  const isSystem = msg.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-1 rounded-full text-[10px] font-mono text-cyan-400/90 flex items-center gap-1.5 shadow-sm">
                          <Zap className="w-3 h-3 text-cyan-400" />
                          <span>{msg.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-neutral-500">
                        <span className="font-bold text-neutral-300">{msg.senderName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 shadow-md font-sans text-xs leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                            : isBot
                            ? 'bg-neutral-950 border border-cyan-500/30 text-cyan-100 rounded-tl-none shadow-[0_0_15px_rgba(0,242,255,0.05)]'
                            : 'bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Order Payload Card attachment if present */}
                        {msg.payloadCard && (
                          <div className="mt-2.5 p-2.5 bg-neutral-900/90 border border-cyan-500/40 rounded-xl text-left font-mono text-[11px] space-y-1">
                            <div className="flex justify-between items-center text-cyan-300 font-bold">
                              <span>{msg.payloadCard.title}</span>
                              <span className="text-emerald-400 font-black text-xs">{msg.payloadCard.payout}</span>
                            </div>
                            <p className="text-neutral-400 text-[10px]">{msg.payloadCard.details}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-neutral-500">
                        <CheckCheck className="w-3 h-3 text-cyan-400" />
                        <span className="uppercase">{msg.status}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Template Actions Bar */}
              <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase mr-1">QUICK ACTION:</span>
                <button
                  type="button"
                  onClick={() => handleQuickTemplate('PAYLOAD')}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span>Send Order Payload</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTemplate('GEOFENCE')}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>Sync Geofence</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTemplate('SUPPORT')}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-amber-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <BellRing className="w-3 h-3 text-amber-400" />
                  <span>Request Support</span>
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 md:p-4 bg-neutral-950 border-t border-neutral-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Type message to ${currentSession.contactHandle} (${currentSession.platform})...`}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 outline-none font-sans transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-extrabold font-mono text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>SEND</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 font-mono">
              <MessageSquare className="w-12 h-12 mb-3 text-neutral-700" />
              <p>No chat selected. Create a new chat or pick one from the left sidebar.</p>
            </div>
          )}
        </div>
      </div>

      {/* NEW CHAT MODAL (NON-SPARK) */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-cyan-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Create New Chat (Non-Spark)</h3>
                    <p className="text-[10px] font-mono text-cyan-400">Initialize custom platform dispatch thread</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="text-neutral-500 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewChat} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-neutral-300 mb-1">
                    Chat Title / Channel Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. DoorDash VIP Route Chat"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-cyan-500 outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-neutral-300 mb-1">
                      Gig Platform (Not Spark)
                    </label>
                    <select
                      value={newPlatform}
                      onChange={e => setNewPlatform(e.target.value as NonSparkPlatform)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-cyan-300 focus:border-cyan-500 outline-none font-mono"
                    >
                      <option value="DoorDash">DoorDash</option>
                      <option value="Instacart">Instacart</option>
                      <option value="Uber Eats">Uber Eats</option>
                      <option value="Amazon Flex">Amazon Flex</option>
                      <option value="Veho">Veho</option>
                      <option value="Shipt">Shipt</option>
                      <option value="Grubhub">Grubhub</option>
                      <option value="Roadie">Roadie</option>
                      <option value="General Support">General Support</option>
                      <option value="VIP Dispatch">VIP Dispatch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-neutral-300 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-amber-300 focus:border-cyan-500 outline-none font-mono"
                    >
                      <option value="NORMAL">Normal Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="VIP">VIP Direct Line</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-neutral-300 mb-1">
                      Contact Handle / Username
                    </label>
                    <input
                      type="text"
                      value={newHandle}
                      onChange={e => setNewHandle(e.target.value)}
                      placeholder="@driver_lead_01"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-neutral-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      placeholder="+1 (415) 555-0199"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-neutral-300 mb-1">
                    Initial Welcome Greeting
                  </label>
                  <textarea
                    rows={2}
                    value={newInitialMsg}
                    onChange={e => setNewInitialMsg(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white placeholder-neutral-600 focus:border-cyan-500 outline-none font-sans"
                  />
                </div>

                <div className="flex items-center gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <input
                    type="checkbox"
                    id="autoBotCheck"
                    checked={newEnableAutoBot}
                    onChange={e => setNewEnableAutoBot(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="autoBotCheck" className="text-xs text-neutral-300 font-mono cursor-pointer">
                    Enable AI Auto-Bot Responses for this chat thread
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-mono font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-extrabold font-mono text-xs rounded-xl shadow-lg cursor-pointer"
                  >
                    Create Chat
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
