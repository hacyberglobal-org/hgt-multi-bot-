import React, { useState, useEffect } from 'react';
import { safeStorage as localStorage } from '../lib/safeStorage';
import { SparkOffer, SparkOrderType, LogEntry, GigPlatform } from '../types';
import { 
  WALMART_STORES, 
  INSTACART_STORES, 
  DOORDASH_STORES, 
  AMAZON_STORES, 
  UBER_STORES,
  SHIPT_STORES,
  ROADIE_STORES,
  BUNGII_STORES,
  GOSHARE_STORES,
  LYFT_STORES,
  VEHO_STORES,
  POSTMATES_STORES
} from '../data';
import { 
  Send, 
  Sparkles, 
  Cpu, 
  Terminal, 
  Settings, 
  Database,
  Hash, 
  DollarSign, 
  MapPin, 
  ShoppingBag, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Unlock,
  Check,
  X,
  ExternalLink,
  Activity,
  ShieldAlert,
  User,
  Shield,
  Clock,
  Laptop,
  Zap,
  Copy,
  CreditCard,
  Link
} from 'lucide-react';

interface MultiBotRequestProps {
  onInjectOffer: (offer: SparkOffer) => void;
  onAddLog: (
    type: LogEntry['type'],
    message: string,
    offerId?: string,
    badge?: string
  ) => void;
  activeDomain: string;
}

export default function MultiBotRequest({ onInjectOffer, onAddLog, activeDomain }: MultiBotRequestProps) {
  // --- SUB TABS STATE ---
  const [activeTab, setActiveTab] = useState<'injector' | 'leadCenter'>('leadCenter');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2200);
      onAddLog('info', `📋 LINK COPIED: ${keyName} copied to clipboard! Ready to send to Telegram lead.`, undefined, 'LINK_COPIED');
    }
  };

  // ==========================================
  // --- TAB 1: STATE FOR CUSTOM OFFER GENERATOR ---
  // ==========================================
  const [platform, setPlatform] = useState<GigPlatform>('Spark');
  const [storeNumber, setStoreNumber] = useState<string>('1299');
  const [orderType, setOrderType] = useState<SparkOrderType>('Shop & Deliver');

  useEffect(() => {
    if (platform === 'Spark') {
      setOrderType('Shop & Deliver');
      setStoreNumber('1024');
    } else if (platform === 'Instacart') {
      setOrderType('Full Service');
      setStoreNumber('3819');
    } else if (platform === 'DoorDash') {
      setOrderType('Shop & Deliver (DD)');
      setStoreNumber('8821');
    } else if (platform === 'Amazon Flex') {
      setOrderType('Logistics Block');
      setStoreNumber('DQX1');
    } else if (platform === 'Uber Eats') {
      setOrderType('Food Courier');
      setStoreNumber('UBX4');
    } else if (platform === 'Shipt') {
      setOrderType('Shipt Shop & Deliver');
      setStoreNumber('S192');
    } else if (platform === 'Roadie') {
      setOrderType('Roadie Gig');
      setStoreNumber('HD88');
    } else if (platform === 'Bungii') {
      setOrderType('Bungii Large Load');
      setStoreNumber('BU91');
    } else if (platform === 'GoShare') {
      setOrderType('GoShare LTL Freight');
      setStoreNumber('GS40');
    } else if (platform === 'Lyft') {
      setOrderType('Lyft Passenger Trip');
      setStoreNumber('LF01');
    } else if (platform === 'Veho') {
      setOrderType('Veho Route Package');
      setStoreNumber('VH01');
    } else if (platform === 'Postmates') {
      setOrderType('Postmates Merchant Run');
      setStoreNumber('PM01');
    }
  }, [platform]);

  const [basePay, setBasePay] = useState<number>(35.00);
  const [tip, setTip] = useState<number>(15.00);
  const [distance, setDistance] = useState<number>(3.5);
  const [itemsCount, setItemsCount] = useState<number>(24);
  const [lifespanSec, setLifespanSec] = useState<number>(15);
  const [customUidPrefix, setCustomUidPrefix] = useState<string>('HACYBER');
  const [apiSecretKey, setApiSecretKey] = useState<string>('multibot_sec_8849_prod');
  const [payloadPreview, setPayloadPreview] = useState<string>('');
  const [recentInjections, setRecentInjections] = useState<Array<{ id: string; time: string; pay: number }>>([]);
  const [showInjectedNotification, setShowInjectedNotification] = useState<boolean>(false);
  const [lastInjectedId, setLastInjectedId] = useState<string>('');

  useEffect(() => {
    if (orderType === 'Dotcom Delivery') {
      setTip(0);
    }
  }, [orderType]);

  const getStoreName = (number: string, pl: GigPlatform = platform) => {
    let storesArray: Array<{ number: string; name: string }> = WALMART_STORES;
    if (pl === 'Instacart') storesArray = INSTACART_STORES;
    else if (pl === 'DoorDash') storesArray = DOORDASH_STORES;
    else if (pl === 'Amazon Flex') storesArray = AMAZON_STORES;
    else if (pl === 'Uber Eats') storesArray = UBER_STORES;
    else if (pl === 'Shipt') storesArray = SHIPT_STORES;
    else if (pl === 'Roadie') storesArray = ROADIE_STORES;
    else if (pl === 'Bungii') storesArray = BUNGII_STORES;
    else if (pl === 'GoShare') storesArray = GOSHARE_STORES;
    else if (pl === 'Lyft') storesArray = LYFT_STORES;
    else if (pl === 'Veho') storesArray = VEHO_STORES;
    else if (pl === 'Postmates') storesArray = POSTMATES_STORES;

    const s = storesArray.find(st => st.number === number);
    if (s) return s.name;
    return `${pl} Hub #${number}`;
  };

  useEffect(() => {
    const computedTotal = Number((Number(basePay) + Number(tip)).toFixed(2));
    const generatedId = `${customUidPrefix || 'SPK'}-${Math.floor(100000 + Math.random() * 900000)}`;

    const mockPayload = {
      event: "multibot_incoming_fcfs_order",
      client_domain: activeDomain,
      timestamp: new Date().toISOString(),
      security: {
        api_header_secret: apiSecretKey || "multibot_sec_8849_prod",
        verif_hash_hmac_sha256: `hacyber_sha256_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
      },
      order_data: {
        id: generatedId,
        platform: platform,
        store_number: storeNumber,
        store_name: getStoreName(storeNumber),
        type: orderType,
        financials: {
          base_pay: Number(basePay),
          tip: Number(tip),
          total_payout: computedTotal,
          rate_per_mile: Number((computedTotal / distance).toFixed(2))
        },
        logistics: {
          distance_miles: Number(distance),
          volume_item_or_stops_count: Number(itemsCount),
          expiration_lifespan_sec: lifespanSec,
          hot_zone_geofenced: true
        }
      }
    };

    setPayloadPreview(JSON.stringify(mockPayload, null, 2));
  }, [platform, storeNumber, orderType, basePay, tip, distance, itemsCount, lifespanSec, customUidPrefix, activeDomain, apiSecretKey]);

  const handleApplyPreset = (presetType: 'mega' | 'short' | 'dotcom') => {
    if (presetType === 'mega') {
      setPlatform('Spark');
      setStoreNumber('1024');
      setOrderType('Shop & Deliver');
      setBasePay(48.50);
      setTip(25.00);
      setDistance(4.2);
      setItemsCount(32);
      setLifespanSec(12);
      setCustomUidPrefix('MEGA-GRAB');
    } else if (presetType === 'short') {
      setPlatform('Uber Eats');
      setStoreNumber('2489');
      setOrderType('Food Courier');
      setBasePay(14.00);
      setTip(6.00);
      setDistance(1.2);
      setItemsCount(8);
      setLifespanSec(20);
      setCustomUidPrefix('FAST-GRAB');
    } else {
      setPlatform('Amazon Flex');
      setStoreNumber('0714');
      setOrderType('Logistics Block');
      setBasePay(62.00);
      setTip(0);
      setDistance(16.5);
      setItemsCount(5);
      setLifespanSec(30);
      setCustomUidPrefix('AMZN-BLOCK');
    }
    
    onAddLog(
      'info',
      `💼 Preloaded Custom Order Request Preset: '${presetType.toUpperCase()}' matching bot testing configuration!`,
      undefined,
      'PRESET_LOADED'
    );
  };

  const handleInject = () => {
    const finalTotal = Number((Number(basePay) + Number(tip)).toFixed(2));
    const finalId = `${customUidPrefix.trim().toUpperCase() || 'SPK'}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowTimestamp = Date.now();
    const expiresAtTimestamp = nowTimestamp + (lifespanSec * 1000);

    const customOffer: SparkOffer = {
      id: finalId,
      platform,
      storeNumber,
      storeName: getStoreName(storeNumber),
      type: orderType,
      basePay: Number(basePay),
      tip: Number(tip),
      distance: Number(distance),
      itemsCount: Number(itemsCount),
      totalPay: finalTotal,
      createdAt: nowTimestamp,
      expiresAt: expiresAtTimestamp,
      status: 'pending'
    };

    onInjectOffer(customOffer);

    setLastInjectedId(finalId);
    setShowInjectedNotification(true);
    setRecentInjections(prev => [
      { id: finalId, time: new Date().toLocaleTimeString(), pay: finalTotal },
      ...prev
    ].slice(0, 3));

    onAddLog(
      'info',
      `🔊 Hacyber Multi-Bot API received order request: dispatched Custom ${orderType} #${finalId} for $${finalTotal} with ${lifespanSec}s lifespan limit.`,
      finalId,
      'HACYBER_BOT'
    );

    setTimeout(() => {
      setShowInjectedNotification(false);
    }, 4000);
  };

  const handleFastLaneInject = () => {
    const highBase = Math.max(78.50, Number(basePay) + 25.00);
    const highTip = Math.max(22.00, Number(tip) + 10.00);
    const finalTotal = Number((highBase + highTip).toFixed(2));
    const finalId = `FASTLANE-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowTimestamp = Date.now();
    const expiresAtTimestamp = nowTimestamp + 8000;

    const fastLaneOffer: SparkOffer = {
      id: finalId,
      platform,
      storeNumber,
      storeName: getStoreName(storeNumber),
      type: orderType,
      basePay: highBase,
      tip: highTip,
      distance: Number(distance) || 1.8,
      itemsCount: Number(itemsCount) || 10,
      totalPay: finalTotal,
      createdAt: nowTimestamp,
      expiresAt: expiresAtTimestamp,
      status: 'pending'
    };

    onInjectOffer(fastLaneOffer);

    setLastInjectedId(finalId);
    setShowInjectedNotification(true);
    setRecentInjections(prev => [
      { id: finalId, time: new Date().toLocaleTimeString(), pay: finalTotal },
      ...prev
    ].slice(0, 3));

    onAddLog(
      'bot_accept',
      `⚡ FAST-LANE PRIORITY DISPATCH EXECUTED: Bypassed standard queue and forced high-priority order #${finalId} ($${finalTotal}) directly to top of execution list!`,
      finalId,
      'FAST_LANE'
    );

    setTimeout(() => {
      setShowInjectedNotification(false);
    }, 4000);
  };

  // ==========================================
  // --- TAB 2: PORTAL AND LEAD CONTROL CENTER ---
  // ==========================================
  const [requests, setRequests] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('req');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 1718974801000, plan: 'Bot Activation ⚙️ - $130.00', status: 'approved', timestamp: '6/21/2026, 12:40:01 PM' },
      { id: 1718975902000, plan: '2FA Activation 🛡️ - $75.40', status: 'awaiting_payment', timestamp: '6/21/2026, 12:58:22 PM', paymentExpiry: Date.now() + 30 * 60 * 1000 }
    ];
  });

  const [timerDisplay, setTimerDisplay] = useState<string>('30:00');

  useEffect(() => {
    const interval = setInterval(() => {
      setRequests(prev => prev.map(req => {
        if (req.status === 'awaiting_payment' && req.paymentExpiry) {
          const timeLeft = req.paymentExpiry - Date.now();
          if (timeLeft <= 0) {
            return { ...req, status: 'rejected' };
          }
        }
        return req;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('req', JSON.stringify(requests));
  }, [requests]);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [userEmailInput, setUserEmailInput] = useState('hacybertech@gmail.com');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);

  // Live rolling system activities
  const [activityFeed, setActivityFeed] = useState<any[]>(() => {
    const initial = [];
    const actionsList = [
      "activated Multi-Bot ⚡",
      "requested payment method 💸",
      "verified system access 🔐",
      "upgraded plan 🔁",
      "connected automation module 🤖",
      "submitted transaction receipt 🧾"
    ];
    for (let i = 0; i < 6; i++) {
      const id = Math.floor(Math.random() * 900 + 100);
      const action = actionsList[Math.floor(Math.random() * actionsList.length)];
      const time = new Date(Date.now() - (i * 24000)).toLocaleTimeString();
      initial.push({ id, action, time });
    }
    return initial;
  });

  // Dynamic system activity generator
  useEffect(() => {
    const actionsList = [
      "activated Multi-Bot ⚡",
      "requested payment method 💸",
      "verified system access 🔐",
      "uploaded payment receipt 🧾",
      "connected automation module 🤖",
      "bypassed secure cloud handshake ✅"
    ];
    const interval = setInterval(() => {
      const id = Math.floor(Math.random() * 900 + 100);
      const action = actionsList[Math.floor(Math.random() * actionsList.length)];
      const time = new Date().toLocaleTimeString();
      setActivityFeed(prev => [{ id, action, time }, ...prev].slice(0, 6));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleCreateRequest = () => {
    if (!selectedPlan) {
      alert("Please select a plan first");
      return;
    }

    const id = Date.now();
    const newReq = {
      id,
      plan: selectedPlan,
      status: 'processing',
      timestamp: new Date().toLocaleString(),
      paymentExpiry: Date.now() + 30 * 60 * 1000
    };

    setRequests(prev => [newReq, ...prev]);
    onAddLog('info', `🎟️ LEAD CREATED: Customer (${userEmailInput}) selected plan [${selectedPlan}]. Order ID: ${id}. Initializing handshakes...`, undefined, 'LEAD_INIT');
    onAddLog('bot_accept', `📧 RECEIPT QUEUED: Automated receipt will be sent to ${userEmailInput} upon $130 transaction verification.`, undefined, 'RCPT_QUEUED');

    // Auto-update to awaiting_payment after 2 seconds to simulate billing server assignation
    setTimeout(() => {
      setRequests(curr => curr.map(r => r.id === id ? { ...r, status: 'awaiting_payment' } : r));
      onAddLog('warning', `⚡ BILLING DISPATCHED: Assigned secure Telegram billing link for request ${id}. Waiting for payment client verification.`, undefined, 'BILL_COORD_SENT');
    }, 2000);
  };

  const handleAdminVerify = () => {
    if (adminPasscode === '0217') {
      setIsAdminAuthenticated(true);
      onAddLog('info', '🔓 Giga-Secure Credentials Authenticated. Admin entered Control Center Dashboard successfully.', undefined, 'ADMIN_ACCESS');
    } else {
      alert("Wrong password. Access denied.");
      onAddLog('warning', '⚠️ SECURITY ALERT: Unauthorized Admin dashboard login attempt with incorrect code credential.', undefined, 'SEC_INTRUSION');
    }
  };

  const handleApprove = (id: number) => {
    const target = requests.find(r => r.id === id);
    const planName = target ? target.plan : 'Unknown Plan';
    
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    onAddLog('manual_accept', `💰 LEAD ACCEPTED & APPROVED: Handshake validated successfully for Lead ID: ${id}. Dispatched lifetime bot activation key!`, undefined, 'TG_BILL_APPROVED');
    alert(`Request #${id} marked as APPROVED successfully.`);
  };

  const handleReject = (id: number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    onAddLog('manual_decline', `❌ LEAD DISMISSED / REJECTED: Financial verification failed for Lead ID: ${id}. Handshake revoked.`, undefined, 'TG_BILL_REJECT');
    alert(`Request #${id} marked as REJECTED.`);
  };

  const lastRequest = requests[0] || null;
  const telegramMessage = lastRequest 
    ? `Activation Request\n\nID: ${lastRequest.id}\nPlan: ${lastRequest.plan}\nStatus: ${lastRequest.status}\n\nRequesting payment method and installation guide.`
    : `Hello HACYBERGLOBALTECH, I am interested in activating Multi-Bot. Please provide plans and setup instructions.`;

  const telegramLink = `https://t.me/hacyberglobaltech?text=${encodeURIComponent(telegramMessage)}`;

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-900 select-none">
        <button
          type="button"
          onClick={() => setActiveTab('leadCenter')}
          className={`py-1.5 px-2.5 rounded text-[10px] uppercase font-mono font-bold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
            activeTab === 'leadCenter'
              ? 'bg-cyan-500 text-neutral-950 shadow-[0_0_10px_rgba(6,182,212,0.4)] font-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Leads & Control Portal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('injector')}
          className={`py-1.5 px-2.5 rounded text-[10px] uppercase font-mono font-bold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
            activeTab === 'injector'
              ? 'bg-amber-500 text-neutral-950 shadow-[0_0_10px_rgba(245,158,11,0.4)] font-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Sim Order Injector</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* =============== TAB 1: SIM ORDER INJECTOR =============== */}
      {/* ======================================================== */}
      {activeTab === 'injector' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-1">
            <div>
              <span className="text-[10px] font-mono text-amber-500 block">CUSTOM TEST INJECTOR</span>
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <Cpu className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Hacyber Multi-Bot API
              </h3>
            </div>
            <span className="text-[8px] font-mono text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850">
              SECURE_NODE_ONLINE
            </span>
          </div>

          <p className="text-[9.5px] text-neutral-400 font-sans leading-relaxed">
            Test custom speed rates, sound alerts, and order grabbing responses by manually forcing virtual delivery orders into the local telemetry system.
          </p>

          {/* Preset Fast Actions */}
          <div className="space-y-1.5">
            <label className="text-[8px] font-mono text-neutral-500 block uppercase">Load Testing Presets:</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('mega')}
                className="py-1 px-1.5 bg-neutral-950 hover:bg-neutral-850 hover:border-amber-500/40 border border-neutral-850 text-[8.5px] font-mono rounded cursor-pointer transition-colors text-amber-400 flex flex-col items-center justify-center text-center"
              >
                <span className="font-bold text-white">$73.50 Mega</span>
                <span className="text-[7.5px] text-neutral-500 mt-0.5">Shop / 4.2 mi</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('short')}
                className="py-1 px-1.5 bg-neutral-950 hover:bg-neutral-850 hover:border-emerald-500/40 border border-neutral-850 text-[8.5px] font-mono rounded cursor-pointer transition-colors text-emerald-400 flex flex-col items-center justify-center text-center"
              >
                <span className="font-bold text-white">$20.00 Quick</span>
                <span className="text-[7.5px] text-neutral-500 mt-0.5">Curbside / 1.2 mi</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('dotcom')}
                className="py-1 px-1.5 bg-neutral-950 hover:bg-neutral-850 hover:border-sky-500/40 border border-neutral-850 text-[8.5px] font-mono rounded cursor-pointer transition-colors text-sky-400 flex flex-col items-center justify-center text-center"
              >
                <span className="font-bold text-white">$38.00 Far</span>
                <span className="text-[7.5px] text-neutral-500 mt-0.5">Dotcom / 16.5 mi</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-neutral-850/80 my-0.5" />

          {/* Interactive Form Details */}
          <div className="space-y-2.5">
            
            {/* Store Name Dropdown & Type */}
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">Network</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as GigPlatform)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-200 p-1 rounded font-mono outline-none focus:border-amber-500"
                >
                  <option value="Spark">Spark (Wmt)</option>
                  <option value="Instacart">Instacart</option>
                  <option value="DoorDash">DoorDash</option>
                  <option value="Amazon Flex">Amzn Flex</option>
                  <option value="Uber Eats">Uber Eats</option>
                  <option value="Shipt">Shipt</option>
                  <option value="Roadie">Roadie</option>
                  <option value="Bungii">Bungii</option>
                  <option value="GoShare">GoShare</option>
                  <option value="Lyft">Lyft (Ride)</option>
                  <option value="Veho">Veho</option>
                  <option value="Postmates">Postmates</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">Hub / Store</label>
                <select
                  value={storeNumber}
                  onChange={(e) => setStoreNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-200 p-1 rounded font-mono outline-none focus:border-amber-500"
                >
                  {platform === 'Spark' && WALMART_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      #{s.number} - {s.name.replace('Walmart ', '')}
                    </option>
                  ))}
                  {platform === 'Instacart' && INSTACART_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      #{s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'DoorDash' && DOORDASH_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      #{s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'Amazon Flex' && AMAZON_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name.replace('Amazon ', '')}
                    </option>
                  ))}
                  {platform === 'Uber Eats' && UBER_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'Shipt' && SHIPT_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'Roadie' && ROADIE_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'Bungii' && BUNGII_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'GoShare' && GOSHARE_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'Lyft' && LYFT_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'Veho' && VEHO_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                  {platform === 'Postmates' && POSTMATES_STORES.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as SparkOrderType)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-200 p-1 rounded font-mono outline-none focus:border-amber-500"
                >
                  {platform === 'Spark' && (
                    <>
                      <option value="Shop & Deliver">Shop / Deliver</option>
                      <option value="Curbside Pickup">Curbside</option>
                      <option value="Dotcom Delivery">Dotcom</option>
                    </>
                  )}
                  {platform === 'Instacart' && (
                    <>
                      <option value="Full Service">Full Service</option>
                      <option value="Shop & Bag">Shop & Bag</option>
                      <option value="Delivery Only">Delivery Only</option>
                    </>
                  )}
                  {platform === 'DoorDash' && (
                    <>
                      <option value="Shop & Deliver (DD)">Shop & Del (DD)</option>
                      <option value="Restaurant Delivery">Restaurant</option>
                      <option value="DashMart Pack">DashMart</option>
                    </>
                  )}
                  {platform === 'Amazon Flex' && (
                    <>
                      <option value="Logistics Block">Logistics Block</option>
                      <option value="Prime Now Block">Prime Block</option>
                      <option value="Whole Foods Block">Whole Foods</option>
                    </>
                  )}
                  {platform === 'Uber Eats' && (
                    <>
                      <option value="Food Courier">Food Courier</option>
                      <option value="UberX Ride">UberX Ride</option>
                      <option value="Uber Connect">Uber Connect</option>
                    </>
                  )}
                  {platform === 'Shipt' && (
                    <>
                      <option value="Shipt Shop & Deliver">Shipt Shop & Deliver</option>
                      <option value="Shipt Delivery Only">Shipt Delivery Only</option>
                    </>
                  )}
                  {platform === 'Roadie' && (
                    <>
                      <option value="Roadie Gig">Roadie Gig</option>
                      <option value="Home Depot Delivery">Home Depot Delivery</option>
                    </>
                  )}
                  {platform === 'Bungii' && (
                    <>
                      <option value="Bungii Large Load">Bungii Large Load</option>
                      <option value="Bungii XL Cargo">Bungii XL Cargo</option>
                    </>
                  )}
                  {platform === 'GoShare' && (
                    <>
                      <option value="GoShare LTL Freight">GoShare LTL Freight</option>
                      <option value="GoShare Helper Run">GoShare Helper Run</option>
                    </>
                  )}
                  {platform === 'Lyft' && (
                    <>
                      <option value="Lyft Passenger Trip">Lyft Passenger Trip</option>
                      <option value="Lyft XL Ride">Lyft XL Ride</option>
                    </>
                  )}
                  {platform === 'Veho' && (
                    <>
                      <option value="Veho Route Package">Veho Route Package</option>
                      <option value="Veho Same-Day Delivery">Veho Same-Day Delivery</option>
                    </>
                  )}
                  {platform === 'Postmates' && (
                    <>
                      <option value="Postmates Merchant Run">Postmates Merchant Run</option>
                      <option value="Postmates Instant Food">Postmates Instant Food</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Financial metrics inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">Base Pay ($)</label>
                <div className="relative">
                  <span className="absolute left-1.5 top-1 font-mono text-[9px] text-neutral-500">$</span>
                  <input
                    type="number"
                    min="5"
                    max="150"
                    step="0.5"
                    value={basePay}
                    onChange={(e) => setBasePay(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-850 text-[10px] text-neutral-200 py-1 pl-4.5 pr-2 rounded font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">
                  Tip ($) {orderType === 'Dotcom Delivery' && <span className="text-[7.5px] text-rose-500 font-extrabold">(N/A)</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-1.5 top-1 font-mono text-[9px] text-neutral-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tip}
                    disabled={orderType === 'Dotcom Delivery'}
                    onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-850 text-[10px] text-neutral-200 py-1 pl-4.5 pr-2 rounded font-mono outline-none focus:border-amber-500 disabled:opacity-40 disabled:hover:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Logistics inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">Distance (miles)</label>
                <input
                  type="number"
                  min="0.5"
                  max="40"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value) || 1)}
                  className="w-full bg-neutral-950 border border-neutral-850 text-[10px] text-neutral-200 py-1 px-2.5 rounded font-mono outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">
                  {orderType === 'Dotcom Delivery' ? 'Stops Count' : 'Items Count'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={itemsCount}
                  onChange={(e) => setItemsCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-neutral-950 border border-neutral-850 text-[10px] text-neutral-200 py-1 px-2.5 rounded font-mono outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">FCFS Lifespan (secs)</label>
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={lifespanSec}
                  onChange={(e) => setLifespanSec(parseInt(e.target.value) || 10)}
                  className="w-full bg-neutral-950 border border-neutral-850 text-[10px] text-neutral-200 py-1 px-2.5 rounded font-mono outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono text-neutral-400 block mb-0.5">Custom ID Prefix</label>
                <input
                  type="text"
                  maxLength={12}
                  value={customUidPrefix}
                  onChange={(e) => setCustomUidPrefix(e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase())}
                  placeholder="HACYBER"
                  className="w-full bg-neutral-950 border border-neutral-850 text-[10px] text-neutral-200 py-1 px-2.5 rounded font-mono outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleInject}
              className="w-full justify-center px-2.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-mono font-black text-[10.5px] rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Standard Queue Dispatch</span>
            </button>

            <button
              id="fast-lane-priority-dispatch-btn"
              type="button"
              onClick={handleFastLaneInject}
              className="w-full justify-center px-2.5 py-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono font-black text-[10.5px] rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-98 border border-cyan-300/40 relative overflow-hidden"
              title="Bypass standard execution queue and immediately force high-priority dispatch to the top of execution list"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              <span>⚡ FAST-LANE PRIORITY DISPATCH</span>
            </button>
          </div>

          {showInjectedNotification && (
            <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded font-mono text-[9px] text-emerald-400 animate-pulse">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Dispatched custom offer #{lastInjectedId} successfully into the telemetry polling queue!</span>
            </div>
          )}

          <div className="border-t border-neutral-900 pt-3">
            <span className="text-[8.5px] font-mono text-neutral-500 block mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>WebClient JSON Payload Preview:</span>
              <span className="text-amber-500 text-[7.5px] font-bold">SHA-256 SECURED</span>
            </span>
            <pre className="p-2 bg-neutral-950 border border-neutral-900 rounded font-mono text-[8px] leading-relaxed text-neutral-400 overflow-x-auto max-h-[120px] scrollbar-thin select-all">
              {payloadPreview}
            </pre>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ============ TAB 2: CLIENT PORTAL & ADMIN PANEL ============ */}
      {/* ======================================================== */}
      {activeTab === 'leadCenter' && (
        <div className="space-y-4">
          
          {/* Cyber Header bar */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <div>
              <span className="text-[9px] font-mono text-cyan-400 block tracking-widest uppercase animate-pulse">HACYBERGLOBALTECH™ | CONTROL CENTER</span>
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Multi-Bot™ Pipeline
              </h3>
            </div>
            
            {/* Real-time green indicator */}
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[8.5px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>SYSTEM ONLINE</span>
            </div>
          </div>

          {/* 📲 TELEGRAM LEADS & DISPATCH LINKS HUB */}
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-cyan-500/30 p-3.5 rounded-xl space-y-3 shadow-[0_0_20px_rgba(6,182,212,0.12)] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                  <Send className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    Telegram Leads & Payment Dispatch Hub
                  </h4>
                  <span className="text-[9px] text-neutral-400 font-sans block">Instant links to send payment methods & admin activation to Telegram leads</span>
                </div>
              </div>
              <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                TELEGRAM_DIRECT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* 1. Telegram Lead Chat */}
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1">
                      <Send className="w-3 h-3 text-cyan-400" /> Lead Chat Link
                    </span>
                    <span className="text-[7.5px] font-mono text-neutral-500">@hacyberglobaltech</span>
                  </div>
                  <p className="text-[9px] text-neutral-300 font-sans line-clamp-1">Direct Telegram lead message link</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-neutral-900">
                  <a
                    href={telegramLink}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex-1 py-1 px-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-mono font-bold text-[8.5px] rounded text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Lead</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(telegramLink, 'Telegram Lead Chat')}
                    className="py-1 px-2 bg-neutral-900 hover:bg-neutral-800 text-cyan-400 border border-neutral-700 font-mono text-[8.5px] rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'Telegram Lead Chat' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'Telegram Lead Chat' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Payment Method Link */}
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-amber-400" /> Payment Method
                    </span>
                    <span className="text-[7.5px] font-mono text-amber-500 font-bold">$130 / $91.99</span>
                  </div>
                  <p className="text-[9px] text-neutral-300 font-sans line-clamp-1">Crypto / PayPal / Flutterwave instructions</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `HACYBER Multi-Bot Payment Method Link:\nhttps://${activeDomain || 'app'}/#payment-methods\n\nSubmit receipt back to Telegram @hacyberglobaltech to finalize activation!`;
                      copyToClipboard(msg, 'Payment Method');
                    }}
                    className="w-full py-1 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-bold text-[8.5px] rounded text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'Payment Method' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                    <span>{copiedKey === 'Payment Method' ? 'Copied Payment Link!' : 'Copy Payment Link'}</span>
                  </button>
                </div>
              </div>

              {/* 3. Admin Control Gatekeeper Link */}
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" /> Admin Control
                    </span>
                    <span className="text-[7.5px] font-mono text-neutral-500">Code: 0217</span>
                  </div>
                  <p className="text-[9px] text-neutral-300 font-sans line-clamp-1">Gatekeeper admin verification portal</p>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDashboardVisible(true);
                      const adminUrl = `https://${activeDomain || 'app'}/#admin-login`;
                      copyToClipboard(adminUrl, 'Admin Gatekeeper');
                    }}
                    className="w-full py-1 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[8.5px] rounded text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'Admin Gatekeeper' ? <Check className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-emerald-400" />}
                    <span>{copiedKey === 'Admin Gatekeeper' ? 'Copied Admin Link!' : 'Open / Copy Admin Link'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="text-center bg-cyan-950/20 border border-cyan-500/10 rounded-lg p-3.5 relative overflow-hidden backdrop-blur-md">
            {/* Animated scanning line */}
            <div className="absolute left-0 w-full h-[1px] bg-cyan-400/40 animate-[bounce_3s_infinite]" />
            
            <h1 className="text-base font-sans font-black tracking-tight text-white mb-1 uppercase">Automate Everything</h1>
            <p className="text-[10px] text-neutral-400 max-w-md mx-auto">
              Secure • Intelligent • Instant | Select your HACYBER license tier, submit activation leads, and manage connections.
            </p>

            <div className="flex justify-center gap-2 mt-3.5">
              <a
                href="#plans-section"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('plans-anchor')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="py-1 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-mono font-bold text-[9px] transition-all cursor-pointer hover:shadow-[0_0_12px_#06b6d4] active:scale-95"
              >
                Buy Lifetime License
              </a>
              <button
                type="button"
                onClick={() => setIsDashboardVisible(prev => !prev)}
                className="py-1 px-3 rounded border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 text-cyan-400 hover:text-white font-mono font-bold text-[9px] transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <Settings className="w-2.5 h-2.5 animate-spin" />
                <span>{isDashboardVisible ? "Close Control" : "Admin Login"}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Feed ticker simulation */}
          <div className="bg-neutral-950/80 border border-neutral-900 p-2.5 rounded-lg select-none">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-[8.5px] font-mono text-neutral-400 font-bold uppercase tracking-wider">📡 LIVE SYSTEM ACTIVITY INGEST</span>
            </div>
            <div className="h-[95px] overflow-y-auto space-y-1 pr-1 font-mono text-[8.5px] text-neutral-400 scrollbar-thin">
              {activityFeed.map((act, index) => (
                <div key={index} className="flex justify-between items-center bg-neutral-900/40 p-1 rounded-sm border border-neutral-950/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-cyan-400 font-bold">User #{act.id}</span>
                    <span className="text-neutral-300">{act.action}</span>
                  </div>
                  <span className="text-neutral-600 text-[8px] shrink-0 font-bold">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin center credentials verification portal */}
          {isDashboardVisible && (
            <div className="bg-neutral-950/90 border border-amber-500/30 p-3 rounded-lg space-y-2.5 shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[9.5px] font-mono text-amber-500 font-extrabold uppercase">Gatekeeper Control Login</span>
              </div>
              
              {!isAdminAuthenticated ? (
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="Enter Admin Code (0217)"
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-100 py-1 px-2.5 rounded font-mono outline-none focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAdminVerify}
                    className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-[9px] rounded transition-colors cursor-pointer active:scale-95"
                  >
                    Authorize
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 border-b border-neutral-800 pb-1.5">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      ADMIN SECURE NODE CONNECTED
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminAuthenticated(false);
                        setAdminPasscode('');
                        onAddLog('info', '🔒 Private database session signed out.', undefined, 'ADMIN_OUT');
                      }}
                      className="text-rose-500 hover:underline font-bold"
                    >
                      LOCK_PANEL
                    </button>
                  </div>

                  {/* Private Admin Table - Control leads and accept if customer */}
                  <div className="space-y-1.5">
                    <label className="text-[8.5px] font-mono text-amber-500 block uppercase font-bold tracking-tight">Active Client Leads (Pending Verification)</label>
                    <div className="overflow-x-auto border border-neutral-900 rounded-lg max-h-[160px] scrollbar-thin">
                      <table className="w-full font-mono text-[8.5px] text-neutral-200">
                        <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-900 text-left">
                          <tr>
                            <th className="p-2">Lead ID</th>
                            <th className="p-2">Plan</th>
                            <th className="p-2 text-center">Status</th>
                            <th className="p-2 text-center">Time Left</th>
                            <th className="p-2 text-right">Actions Required</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900/60 bg-neutral-950">
                          {requests.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-neutral-600">No active leads logged.</td>
                            </tr>
                          ) : (
                            requests.map((r, index) => (
                              <tr key={index} className="hover:bg-neutral-900/60">
                                <td className="p-2 font-bold text-neutral-400">#{r.id}</td>
                                <td className="p-2 text-[8px] text-neutral-300">{r.plan}</td>
                                <td className="p-2 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase transition-all ${
                                    r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    r.status === 'processing' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse' :
                                    r.status === 'awaiting_payment' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                                    'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="p-2 text-center text-[8px] text-neutral-400 font-mono">
                                    {r.status === 'awaiting_payment' && r.paymentExpiry ? (
                                        Math.max(0, Math.floor((r.paymentExpiry - Date.now()) / 1000 / 60)) + ':' + 
                                        Math.floor(((r.paymentExpiry - Date.now()) / 1000) % 60).toString().padStart(2, '0')
                                    ) : '--:--'}
                                </td>
                                <td className="p-2 text-right">
                                  {r.status === 'awaiting_payment' || r.status === 'processing' ? (
                                    <div className="inline-flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleApprove(r.id)}
                                        className="py-0.5 px-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded cursor-pointer transition-colors"
                                        title="Approve Customer & Activate Bot"
                                      >
                                        ✔ ACCEPT
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleReject(r.id)}
                                        className="py-0.5 px-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded cursor-pointer transition-colors"
                                        title="Reject / Revoke"
                                      >
                                        ✖
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-600 text-[7px] font-bold tracking-wider">VERIFIED</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing Selector section */}
          <div id="plans-anchor" className="space-y-2 border-t border-neutral-900 pt-3">
            <span className="text-[8.5px] font-mono text-cyan-400 block tracking-wider uppercase font-bold">1. Select Activation Tier plan</span>
            <div className="grid grid-cols-3 gap-1.5">
              
              <button
                type="button"
                id="activation-130-plan-btn"
                onClick={() => setSelectedPlan('Bot Activation ⚙️ - $130.00')}
                className={`flex-1 p-2 bg-neutral-950 hover:bg-neutral-900 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedPlan === 'Bot Activation ⚙️ - $130.00'
                    ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] bg-cyan-950/10'
                    : 'border-neutral-850'
                }`}
              >
                <div>
                  <span className="text-[8px] font-mono text-cyan-400 block font-bold uppercase mb-1">BOT SETUP</span>
                  <span className="text-[10px] font-sans font-bold text-white block">Bot Activation ⚙️</span>
                </div>
                <span className="text-[11px] font-mono font-black text-cyan-400 mt-2 block">$130.00</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('Monthly Renewal 🔁 - $91.99')}
                className={`flex-1 p-2 bg-neutral-950 hover:bg-neutral-900 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedPlan === 'Monthly Renewal 🔁 - $91.99'
                    ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] bg-cyan-950/10'
                    : 'border-neutral-850'
                }`}
              >
                <div>
                  <span className="text-[8px] font-mono text-cyan-400 block font-bold uppercase mb-1">RENEW LICENSE</span>
                  <span className="text-[10px] font-sans font-bold text-white block">Monthly Renewal 🔁</span>
                </div>
                <span className="text-[11px] font-mono font-black text-cyan-400 mt-2 block">$91.99</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('2FA Activation 🛡️ - $75.40')}
                className={`flex-1 p-2 bg-neutral-950 hover:bg-neutral-900 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedPlan === '2FA Activation 🛡️ - $75.40'
                    ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] bg-cyan-950/10'
                    : 'border-neutral-850'
                }`}
              >
                <div>
                  <span className="text-[8px] font-mono text-cyan-400 block font-bold uppercase mb-1">BYPASS 2FA</span>
                  <span className="text-[10px] font-sans font-bold text-white block">2FA Activation 🛡️</span>
                </div>
                <span className="text-[11px] font-mono font-black text-cyan-400 mt-2 block">$75.40</span>
              </button>

            </div>

            {/* Email Field for Automated $130 Receipt Delivery */}
            <div className="space-y-1 text-[8.5px] font-mono text-left my-2">
              <label className="text-cyan-400 font-bold uppercase block">
                2. Email Address for Automated $130 Receipt Delivery:
              </label>
              <input
                id="multibot-activation-email-input"
                type="email"
                required
                value={userEmailInput}
                onChange={(e) => setUserEmailInput(e.target.value)}
                placeholder="hacybertech@gmail.com"
                className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded-lg text-[9.5px] outline-none font-mono focus:border-cyan-400"
              />
            </div>

            <div className="bg-neutral-900 border border-amber-500/20 p-3 rounded-lg text-[10px] text-amber-100 font-mono space-y-1 my-2">
              <p className="font-bold uppercase text-amber-500">⚠️ Payment Requirement Notice</p>
              <p>Once you submit a request, you have exactly 30 minutes to complete the payment for your chosen plan.</p>
              <p className="font-bold text-amber-500">Rules:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Payment must be verified within the 30-minute window.</li>
                <li>Requests expire automatically if payment is not received.</li>
                <li>Ensure transaction receipt is uploaded immediately after payment.</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 select-none">
              <button
                type="button"
                onClick={handleCreateRequest}
                className="w-full p-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-mono font-black text-[10.5px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 hover:shadow-[0_0_12px_#06b6d4] active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Submit Activation Request</span>
              </button>

              {/* Telegram dispatcher */}
              <a
                href={telegramLink}
                target="_blank"
                referrerPolicy="no-referrer"
                className="w-full p-2 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-cyan-400 hover:text-white font-mono font-black text-[10.5px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:border-cyan-400 text-center active:scale-98"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>📲 Contact via Telegram</span>
              </a>
            </div>

            <p className="text-[8px] text-neutral-500 font-mono italic text-left mt-1">
              *HACYBERGLOBALTECH Billing Protocol: Payment details are assigned securely via private direct message on Telegram after initiating your plan request.
            </p>
          </div>

          {/* User Request status view */}
          <div className="space-y-1.5 border-t border-neutral-900 pt-3">
            <span className="text-[8.5px] font-mono text-neutral-500 block uppercase font-bold">2. Your Verification Status Log</span>
            <div className="overflow-x-auto border border-neutral-900 rounded-lg max-h-[140px] scrollbar-thin">
              <table className="w-full font-mono text-[8px] text-neutral-300 text-left">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-900">
                  <tr>
                    <th className="p-1.5">Request ID</th>
                    <th className="p-1.5">Licensing Tier</th>
                    <th className="p-1.5 text-center">Polling Status</th>
                    <th className="p-1.5 text-right font-bold uppercase">Update Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40 bg-neutral-950/40">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-neutral-600">Select a plan and click `Submit Activation Request`.</td>
                    </tr>
                  ) : (
                    requests.map((r, index) => (
                      <tr key={index} className="hover:bg-neutral-900">
                        <td className="p-1.5 font-bold text-neutral-400">#{r.id}</td>
                        <td className="p-1.5 text-neutral-300">{r.plan}</td>
                        <td className="p-1.5 text-center">
                          <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase inline-block ${
                            r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            r.status === 'processing' ? 'bg-sky-500/15 text-sky-400 animate-pulse' :
                            r.status === 'awaiting_payment' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-rose-500/10 text-rose-500'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-1.5 text-right text-neutral-500 text-[7px] font-bold shrink-0">{r.timestamp || 'Just Now'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

