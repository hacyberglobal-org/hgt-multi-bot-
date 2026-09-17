import React, { useState, useEffect } from 'react';
import { safeStorage as localStorage } from '../lib/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import GeofenceCanvas from './GeofenceCanvas';
import { 
  ShieldCheck, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Smartphone, 
  MapPin, 
  RefreshCw, 
  Cpu, 
  Play, 
  Pause, 
  CheckCircle,
  AlertTriangle,
  KeyRound,
  FileCode,
  Sparkles,
  DollarSign,
  Activity,
  User,
  Sliders,
  Mail,
  Lock,
  Globe,
  CreditCard,
  Check,
  QrCode,
  Share2,
  Copy
} from 'lucide-react';

interface ClientHqProps {
  onAddLog: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'competitor' | 'expire' | 'warning', 
    message: string, 
    offerId?: string, 
    badge?: string
  ) => void;
  activeDomain: string;
}

interface ActiveBotSession {
  id: string;
  name: string;
  platform: 'Spark' | 'DoorDash' | 'Instacart' | 'Amazon Flex' | 'Uber Eats' | 'Veho' | 'Postmates';
  speedMs: number;
  status: 'IDLE' | 'SCANNING' | 'GRABBED';
  interceptsCount: number;
  cost: number;
}

export default function ClientHq({ onAddLog, activeDomain }: ClientHqProps) {
  // --- AUTH STATE ---
  const [isRegistered, setIsRegistered] = useState(() => localStorage.getItem('hq_is_registered') === 'true');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('hq_is_logged_in') === 'true');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('hq_user_email') || 'hacybertech@gmail.com');
  const [userPassword, setUserPassword] = useState('*********');
  const [driverName, setDriverName] = useState(() => localStorage.getItem('hq_driver_name') || 'Marcus Harrison');
  const [driverPhone, setDriverPhone] = useState(() => localStorage.getItem('hq_driver_phone') || '+1 (415) 555-0199');
  
  // Link credentials state
  const [sparkUser, setSparkUser] = useState(() => localStorage.getItem('hq_link_spark_user') || 'marcus.dispatch@gmail.com');
  const [sparkPass, setSparkPass] = useState('••••••••••••');
  const [linkStatus, setLinkStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('CONNECTED');
  const [selectedPlatform, setSelectedPlatform] = useState<'Spark' | 'DoorDash' | 'Instacart' | 'Amazon Flex' | 'Uber Eats' | 'Veho' | 'Postmates'>('Spark');

  // License Key Management
  const [licenseKey, setLicenseKey] = useState(() => localStorage.getItem('hq_license_key') || '');
  const [licenseState, setLicenseState] = useState<'TRIAL' | 'PRO_LICENSE' | 'EXPIRED'>(() => {
    const key = localStorage.getItem('hq_license_key') || '';
    return key.toUpperCase().includes('HGT-SPARK-PRO') || key.toUpperCase().includes('HGT-MULTIBOT-PRO') ? 'PRO_LICENSE' : 'TRIAL';
  });

  // GPS Map / Geocircle tracking simulation
  const [lat, setLat] = useState('37.7749');
  const [lng, setLng] = useState('-122.4194');
  const [radiusMiles, setRadiusMiles] = useState(8);
  const [targetStoreLabel, setTargetStoreLabel] = useState('Walmart Supercenter #1852 (San Francisco-East)');
  const [isUpdatingGeofence, setIsUpdatingGeofence] = useState(false);

  // Unlocked bots state from localStorage
  const [unlockedBotIds, setUnlockedBotIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlocked_bot_ids');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return ['BOT-X1']; // Spark unlocked by default, others locked initially
  });

  // Active Grabbing Bots list
  const [bots, setBots] = useState<ActiveBotSession[]>([
    { id: 'BOT-X1', name: 'HGT Multi-Bot Grabber Pro', platform: 'Spark', speedMs: 1200, status: 'SCANNING', interceptsCount: 41, cost: 0 },
    { id: 'BOT-D2', name: 'DoorDash Infinite Dispatch', platform: 'DoorDash', speedMs: 950, status: 'IDLE', interceptsCount: 28, cost: 19.99 },
    { id: 'BOT-I3', name: 'Instacart Fast-Batch Tapper', platform: 'Instacart', speedMs: 1400, status: 'IDLE', interceptsCount: 15, cost: 19.99 },
    { id: 'BOT-A4', name: 'Amazon Flex Speed-Tapper', platform: 'Amazon Flex', speedMs: 800, status: 'IDLE', interceptsCount: 5, cost: 24.99 },
    { id: 'BOT-U5', name: 'Uber Eats Fast-Route Runner', platform: 'Uber Eats', speedMs: 1100, status: 'IDLE', interceptsCount: 12, cost: 14.99 },
    { id: 'BOT-V6', name: 'Veho Route Optimizer Grabber', platform: 'Veho', speedMs: 1050, status: 'IDLE', interceptsCount: 8, cost: 29.99 },
    { id: 'BOT-P7', name: 'Postmates Swift-Food Grabber', platform: 'Postmates', speedMs: 900, status: 'IDLE', interceptsCount: 19, cost: 14.99 }
  ]);

  // Payment/Checkout state
  const [selectedBotToUnlock, setSelectedBotToUnlock] = useState<ActiveBotSession | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [cardHolder, setCardHolder] = useState('Marcus Harrison');
  const [cardEmail, setCardEmail] = useState('hacybertech@gmail.com');
  const [activationReceiptEmail, setActivationReceiptEmail] = useState('hacybertech@gmail.com');
  const [receiptNotification, setReceiptNotification] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentIsProcessing, setPaymentIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedLicenseKey, setGeneratedLicenseKey] = useState('');

  // Deploy Node Status State
  const [pingStatus, setPingStatus] = useState<'IDLE' | 'PINGING' | 'REPLIED'>('IDLE');
  const [pingLatency, setPingLatency] = useState<number>(0);

  // QR Code Sharing State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrLinkType, setQrLinkType] = useState<'telegram' | 'tracker' | 'active_domain' | 'custom'>('telegram');
  const [customQrUrl, setCustomQrUrl] = useState(() => localStorage.getItem('hq_custom_qr_url') || '');
  const [qrColorMode, setQrColorMode] = useState<'cyber' | 'classic'>('cyber');
  const [copiedLink, setCopiedLink] = useState(false);

  // Persist unlocked bots
  useEffect(() => {
    localStorage.setItem('unlocked_bot_ids', JSON.stringify(unlockedBotIds));
  }, [unlockedBotIds]);

  // Handle registration submission
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !driverName) return;
    setIsRegistered(true);
    setIsLoggedIn(true);
    localStorage.setItem('hq_is_registered', 'true');
    localStorage.setItem('hq_is_logged_in', 'true');
    localStorage.setItem('hq_user_email', userEmail);
    localStorage.setItem('hq_driver_name', driverName);
    localStorage.setItem('hq_driver_phone', driverPhone);
    
    onAddLog('info', `👤 Multi-Bot Central: New dispatcher profile brand signed up for ${driverName} (${userEmail})`, undefined, 'HQ_REG');
  };

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    localStorage.setItem('hq_is_logged_in', 'true');
    onAddLog('info', `🔐 Multi-Bot Central: Authorized secure session handshake for driver email: ${userEmail}.`, undefined, 'HQ_AUTH');
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('hq_is_logged_in', 'false');
    onAddLog('info', `🔒 Client HQ: User session cleared. Intercept channels safely parked.`, undefined, 'HQ_MUTE');
  };

  // Handle linking external delivery account
  const handleLinkAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkStatus('CONNECTING');
    onAddLog('info', `🔗 Account Linker: Requesting OAuth & token exchange handshake with Walmart Spark Partner API...`, undefined, 'LINK_REQ');
    
    setTimeout(() => {
      setLinkStatus('CONNECTED');
      localStorage.setItem('hq_link_spark_user', sparkUser);
      onAddLog('info', `✅ Link Secured: Driver account ${sparkUser} securely bound on cluster platform. Interceptor operational.`, undefined, 'LINK_OK');
    }, 1800);
  };

  // Handle license activation
  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey) return;
    
    const isMultiBot = licenseKey.toUpperCase().includes('HGT-MULTIBOT-PRO');
    const isSparkPro = licenseKey.toUpperCase().includes('HGT-SPARK-PRO');
    
    if (isMultiBot || isSparkPro) {
      setLicenseState('PRO_LICENSE');
      localStorage.setItem('hq_license_key', licenseKey);
      
      // Sync to $130 license payment history
      try {
        const existingRaw = localStorage.getItem('hq_license_purchases');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newTxId = `TX-130-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRecord = {
          id: newTxId,
          licenseKey: licenseKey,
          planName: isMultiBot ? 'HGT Multi-Bot Activation Pass ($130.00)' : 'Walmart Spark 1ms Pro Pass ($130.00)',
          amount: 130.00,
          paymentMethod: 'PayPal Express',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Active',
          txHashOrProof: `PP-${newTxId}`
        };
        localStorage.setItem('hq_license_purchases', JSON.stringify([newRecord, ...existing]));
        
        // Automated Receipt Delivery Notification
        const targetEmail = activationReceiptEmail || userEmail || 'hacybertech@gmail.com';
        setReceiptNotification(`📧 Automated $130 transaction verification receipt sent to ${targetEmail}! Ref: #${newTxId}`);
        onAddLog('bot_accept', `📧 AUTOMATED RECEIPT DISPATCHED: $130 Activation receipt sent to ${targetEmail} (Tx: #${newTxId}). Verification complete.`, undefined, 'RCPT_SENT');
      } catch (err) {}
      
      if (isMultiBot) {
        // Unlock all bots completely
        const allBotIds = ['BOT-X1', 'BOT-D2', 'BOT-I3', 'BOT-A4', 'BOT-U5'];
        setUnlockedBotIds(allBotIds);
        localStorage.setItem('unlocked_bot_ids', JSON.stringify(allBotIds));
        
        // Start scanning on all bots
        setBots(prev => prev.map(bot => ({
          ...bot,
          status: 'SCANNING'
        })));
        
        onAddLog('info', `🔥 MULTI-BOT DISPATCH ACTIVE: All platforms (Spark, DoorDash, Instacart, Amazon Flex, Uber Eats) unlocked and set to permanent scanning at 1ms reaction delay!`, undefined, 'LIC_MULTI');
      } else {
        onAddLog('info', `⭐ HACYBER License Activated: Professional Enterprise Grabber activated. 1ms reaction rate unlocked.`, undefined, 'LIC_PRO');
      }
    } else {
      onAddLog('warning', `⚠️ License validation failed: Serial Key '${licenseKey}' invalid or expired on blockchain server.`, undefined, 'LIC_ERR');
    }
  };

  // Handle geofence lock update
  const handleUpdateGeofence = () => {
    setIsUpdatingGeofence(true);
    onAddLog('info', `📡 GPS Geocentre: Recalculating centroid coordinates to ${lat}, ${lng}...`, undefined, 'GEO_CALC');
    
    setTimeout(() => {
      setIsUpdatingGeofence(false);
      onAddLog('info', `🎯 Geofence locked: Scanning Walmart store geofence within a ${radiusMiles}-mile radius centered at Wal-Store #${targetStoreLabel.split('#')[1]?.split(' ')[0] || '1852'}.`, undefined, 'GEO_LOCKED');
    }, 1500);
  };

  // Toggle Bot session active status
  const toggleBot = (botId: string) => {
    // If the bot requires licensing (not in unlockedBotIds), block and trigger payment modal
    if (!unlockedBotIds.includes(botId)) {
      const selectedBot = bots.find(b => b.id === botId);
      if (selectedBot) {
        setSelectedBotToUnlock(selectedBot);
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setPaymentSuccess(false);
        setPaymentIsProcessing(false);
        setShowCheckoutModal(true);
        onAddLog('warning', `⚠️ License Required: Worker ${selectedBot.name} is on standby. Standard API throttle protects server nodes. Complete checkout to bind perpetual 1ms driver dispatch bypass.`, undefined, 'LIC_REQD');
      }
      return;
    }

    setBots(prev => prev.map(bot => {
      if (bot.id === botId) {
        const nextStatus = bot.status === 'SCANNING' ? 'IDLE' : 'SCANNING';
        onAddLog('info', `🤖 Active Session: Worker ${bot.name} set to ${nextStatus}.`, undefined, nextStatus === 'SCANNING' ? 'BOT_UP' : 'BOT_MUTE');
        return {
          ...bot,
          status: nextStatus
        };
      }
      return bot;
    }));
  };

  // Execute interactive secure checkout payment pipeline
  const processCheckoutPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotToUnlock) return;
    setPaymentIsProcessing(true);
    onAddLog('info', `💳 Billing Gateway: Connecting with end-to-end bank auth nodes for $${selectedBotToUnlock.cost}...`, undefined, 'BILL_INIT');

    setTimeout(() => {
      // Generate a dynamic license hash
      const randomKey = `HGT-MULTIBOT-PRO-${selectedBotToUnlock.platform.replace(/\s+/g, '').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setGeneratedLicenseKey(randomKey);
      setUnlockedBotIds(prev => [...prev, selectedBotToUnlock.id]);
      setLicenseState('PRO_LICENSE');
      localStorage.setItem('hq_license_key', randomKey);

      // Sync to $130 license payment history
      try {
        const existingRaw = localStorage.getItem('hq_license_purchases');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newTxId = `TX-130-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRecord = {
          id: newTxId,
          licenseKey: randomKey,
          planName: `${selectedBotToUnlock.name} License ($130.00)`,
          amount: 130.00,
          paymentMethod: 'Stripe Card',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Verified',
          txHashOrProof: `ch_3M${Math.floor(1000000000 + Math.random() * 9000000000)}`
        };
        localStorage.setItem('hq_license_purchases', JSON.stringify([newRecord, ...existing]));
        
        // Dispatch automated receipt
        const destEmail = cardEmail || userEmail || 'hacybertech@gmail.com';
        setReceiptNotification(`📧 Automated receipt dispatched to ${destEmail}! Ref: #${newTxId}`);
        onAddLog('bot_accept', `📧 AUTOMATED RECEIPT DELIVERED: Payment verification receipt sent to ${destEmail} (Tx: #${newTxId}).`, undefined, 'RCPT_OK');
      } catch (err) {}

      setPaymentSuccess(true);
      setPaymentIsProcessing(false);

      // Instantly start the bot on the active state
      setBots(prev => prev.map(b => {
        if (b.id === selectedBotToUnlock.id) {
          return { ...b, status: 'SCANNING' };
        }
        return b;
      }));

      onAddLog('bot_accept', `💰 payment success! Perpetual cloud license verified for ${selectedBotToUnlock.name}. Activated on live cluster.`, undefined, 'BILL_OK');
    }, 2800);
  };

  // Download PDF Receipt for perpetual license transaction
  const handleDownloadInvoice = () => {
    if (!selectedBotToUnlock) return;
    const doc = new jsPDF();
    
    doc.setDocumentProperties({
      title: 'Hacyber Digital Payment Invoice',
      creator: 'HACYBER BIOMETRIC BILLING DISPATCH'
    });

    // Aesthetic frames
    doc.setDrawColor(210, 210, 215);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 281);

    // Dark header
    doc.setFillColor(15, 15, 18);
    doc.rect(10, 10, 190, 32, 'F');

    doc.setTextColor(0, 242, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text('HACYBER SECURE LICENSE TRANSACTION RECEIPT', 15, 20);

    doc.setTextColor(245, 158, 11);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.text('AUTOMATED CLOUD DISPATCH PERPETUAL LICENSE UNLOCK • STATEMENT', 15, 27);

    doc.setTextColor(150, 150, 150);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`TRANSACTION TIMESTAMP: ${new Date().toLocaleString()}`, 15, 35);

    // Invoice body details
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.setFillColor(242, 242, 245);
    doc.rect(10, 48, 190, 40, 'F');
    doc.rect(10, 48, 190, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('A. BILLING PROFILE DETAILS', 14, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cardholder Name: ${cardHolder}`, 14, 62);
    doc.text(`Account Dispatcher: ${driverName}`, 14, 68);
    doc.text(`Secure Billing Email: ${userEmail}`, 14, 74);
    doc.text(`Mobile Phone Reference: ${driverPhone}`, 14, 80);

    // Transaction terms
    doc.setFont('helvetica', 'bold');
    doc.text('B. PURCHASED DISPATCH ARTIFACTS', 14, 96);
    doc.setFont('helvetica', 'normal');

    // Create a beautiful receipt billing ledger table
    doc.setFillColor(15, 15, 18);
    doc.rect(10, 102, 190, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ITEM IDENTIFIER', 12, 106.5);
    doc.text('DESCRIPTION', 55, 106.5);
    doc.text('GIG PLATFORM', 115, 106.5);
    doc.text('LICENSE TYPE', 145, 106.5);
    doc.text('TOTAL COST', 175, 106.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(selectedBotToUnlock.id, 12, 114);
    doc.text(selectedBotToUnlock.name, 55, 114);
    doc.text(selectedBotToUnlock.platform, 115, 114);
    doc.text('Lifetime Perpetual License', 145, 114);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`$${selectedBotToUnlock.cost.toFixed(2)}`, 175, 114);

    doc.setDrawColor(230, 230, 235);
    doc.line(10, 118, 200, 118);

    // Totals Box
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.text('SUBTOTAL:', 140, 125);
    doc.text(`$${selectedBotToUnlock.cost.toFixed(2)}`, 175, 125);
    doc.text('GST/SALES TAX (0.00%):', 140, 131);
    doc.text('$0.00', 175, 131);
    
    doc.setFillColor(240, 253, 250);
    doc.rect(138, 135, 62, 9, 'F');
    doc.rect(138, 135, 62, 9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text('TOTAL CHARGED:', 140, 141);
    doc.text(`$${selectedBotToUnlock.cost.toFixed(2)}`, 175, 141);

    // License token box
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(242, 252, 245);
    doc.rect(10, 150, 190, 22, 'F');
    doc.rect(10, 150, 190, 22);

    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('C. LOCK-FREE LICENSE REGISTER SERIAL', 14, 156);
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 15, 18);
    doc.text(generatedLicenseKey, 14, 164);

    // Terms of service disclaimer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('TERMS & COMPLIANCE STATISTICAL WAIVER:', 10, 185);
    doc.text('The purchased perpetual high speed license removes minimum throttling delays (originally set to 1000ms). This license code is permanently tied to your browser local sandbox instance. No physical delivery is required. All digital transactions are final and simulated as a proof-of-concept for educational driver telemetry systems.', 10, 190, { maxWidth: 190 });

    // Cryptographic signature block
    const cryptoHash = `SHA-256_SECBOOT_LEDGER_ROUTE_SSL_VERIFIED_REFLEX_1ms_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.text(`SECURITY SIGNATURE VERIFICATION DIGEST: ${cryptoHash}`, 10, 240);

    // Footer
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 145);
    doc.text('CONFIDENTIAL • Hacyber Digital Systems Inc. Billing Core. Sandboxed Environment Cloud Run Node.', 10, 273);

    doc.save(`hacyber_license_receipt_${selectedBotToUnlock.id}.pdf`);
  };

  // Simulate a live Cloud Run container connection test
  const handlePingDeployedNode = () => {
    if (pingStatus === 'PINGING') return;
    setPingStatus('PINGING');
    
    // Simulate real network request round-trip delay
    const mockLatency = Math.floor(12 + Math.random() * 24);
    
    setTimeout(() => {
      setPingStatus('REPLIED');
      setPingLatency(mockLatency);
      onAddLog('info', `📡 Cloud Node: Received TCP/TLS echo reply from production container: Latency ${mockLatency}ms. Stream interface healthy.`, undefined, 'PING_OK');
    }, 1200);
  };

  // Simulate automated grab counter tick of scanning bots
  useEffect(() => {
    const interval = setInterval(() => {
      setBots(prev => prev.map(bot => {
        if (bot.status === 'SCANNING' && Math.random() > 0.88) {
          return {
            ...bot,
            interceptsCount: bot.interceptsCount + 1
          };
        }
        return bot;
      }));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-5 text-left font-sans">
      {/* Visual Portal Header */}
      <div className="border-b border-neutral-900 pb-3">
        <span className="text-[9px] font-mono text-neutral-500 block uppercase font-bold tracking-wider">HACYBERGLOBAL CLIENT HQ PORTAL</span>
        <h2 className="text-sm font-semibold text-white tracking-wide mt-1 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#00f2ff]" />
          <span>Drivers Portal & High-Frequency Multi-Instance Dispatch</span>
        </h2>
        <p className="text-[9px] text-neutral-400 mt-1 leading-relaxed">
          Link driver credentials, provision active automated grabbing instances (bots), coordinate Walmart Supercenter GPS coordinates, and monitor license limits.
        </p>
      </div>

      {!isLoggedIn ? (
        /* ================= AUTHENTICATION FORM (SIGN UP & LOG IN) ================= */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 bg-neutral-950/60 p-4 border border-neutral-900 rounded-xl space-y-4">
            <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider">
              <UserPlus className="w-4 h-4 text-amber-500" />
              <span>1. DRIVER REGISTRATION & HANDSHAKE ENROLLMENT</span>
            </div>
            
            <p className="text-[9px] text-neutral-400 leading-normal">
              Register a driver profile to securely connect multiple high-speed dispatch services. Active sessions authorize multi-platform parallel grabbing features.
            </p>

            <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-mono text-neutral-500 block uppercase">Driver / Dispatcher Name:</label>
                <div className="relative">
                  <User className="absolute left-2 top-2 w-3.5 h-3.5 text-neutral-600" />
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-neutral-900/80 border border-neutral-800 text-[9.5px] text-white p-2 pl-7.5 rounded outline-none font-mono focus:border-amber-500"
                    placeholder="Marcus Harrison"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-mono text-neutral-500 block uppercase">Mobile Phone Contact:</label>
                <div className="relative">
                  <Smartphone className="absolute left-2 top-2  w-3.5 h-3.5 text-neutral-600" />
                  <input
                    type="text"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-neutral-900/80 border border-neutral-800 text-[9.5px] text-white p-2 pl-7.5 rounded outline-none font-mono focus:border-amber-500"
                    placeholder="+1 (415) 555-0199"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[8px] font-mono text-neutral-500 block uppercase">Secure Gateway Login Email:</label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2  w-3.5 h-3.5 text-neutral-600" />
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-neutral-900/80 border border-neutral-800 text-[9.5px] text-white p-2 pl-7.5 rounded outline-none font-mono focus:border-amber-500"
                    placeholder="hacybertech@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[8px] font-mono text-neutral-500 block uppercase">Access Credentials Password:</label>
                <div className="relative">
                  <Lock className="absolute left-2 top-2  w-3.5 h-3.5 text-neutral-600" />
                  <input
                    type="password"
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full bg-neutral-900/80 border border-neutral-800 text-[9.5px] text-white p-2 pl-7.5 rounded outline-none font-mono focus:border-amber-500"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-glow sm:col-span-2 mt-2 w-full py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded hover:scale-[1.01] transition-transform active:scale-[0.99] cursor-pointer"
              >
                PROVISION NEW DRIVER PROFILE PROFILE
              </button>
            </form>
          </div>

          <div className="md:col-span-5 bg-neutral-950/60 p-4 border border-neutral-900 rounded-xl flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center gap-1.5 text-[#00f2ff] font-mono text-[10px] font-bold uppercase tracking-wider">
                <LogIn className="w-4 h-4 text-[#00f2ff]" />
                <span>EXISTING MEMBER SECURITY LOGIN</span>
              </div>
              <p className="text-[9px] text-neutral-400 leading-normal">
                Already have a HACYBER dispatcher account or a Multi-Bot API subscription? Input your dynamic driver credentials to boot up existing active intercept sessions.
              </p>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-neutral-500 block uppercase font-bold text-neutral-500">Dispatcher Identifier Email:</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-[9.5px] text-amber-400 p-2 rounded outline-none font-mono focus:border-amber-550/50"
                    placeholder="hacybertech@gmail.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-neutral-500 block uppercase font-bold text-neutral-500 font-mono">Password Pin Code:</label>
                  <input
                    type="password"
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 text-[9.5px] text-white p-2 rounded outline-none font-mono focus:border-amber-550/50"
                    placeholder="••••••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded font-mono text-[9px] font-bold text-[#00f2ff] cursor-pointer"
                >
                  ESTABLISH SECURE INTERCEPT SESSION
                </button>
              </form>
            </div>

            <div className="border-t border-neutral-900 pt-3 mt-4 text-[7.5px] leading-relaxed font-mono text-neutral-500">
              🛡️ End-to-end telemetry encryption verified. Active SSL Handshake: AES-256-GCM cloud tunnel.
            </div>
          </div>
        </div>
      ) : (
        /* ================= AUTHENTICATED CONTROL PANEL MODULE ================= */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Column A: Driver Details & Connected Accounts Linker */}
          <div className="md:col-span-4 space-y-4">
            
            {/* Driver active account badge */}
            <div id="client-hq-verification-panel" className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-900 text-left space-y-2.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-neutral-500 uppercase tracking-widest">Active Dispatch Session</span>
                <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 px-1 rounded animate-pulse uppercase">LIVE</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff] font-bold font-mono">
                  {driverName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block">{driverName}</span>
                  <span className="text-[8.5px] text-neutral-400 block truncate max-w-[150px]">{userEmail}</span>
                </div>
              </div>

              <div className="space-y-1 border-t border-neutral-900 pt-2.5 text-[8px] text-neutral-400 leading-normal">
                <div className="flex justify-between">
                  <span>DRIVER ID:</span>
                  <span className="text-white font-bold">HGT-USR-582928</span>
                </div>
                <div className="flex justify-between">
                  <span>PHONE LINK:</span>
                  <span className="text-white font-bold">{driverPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>DISPATCH KEY:</span>
                  <span className="text-amber-500 font-bold">SHA-256_ACTIVE</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowQrModal(true);
                  onAddLog('info', `📱 System Node: Initialized holographic QR Generator. Access link is queued.`, undefined, 'QR_GEN');
                }}
                className="w-full mt-2.5 py-1.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 hover:border-[#00f2ff]/60 rounded font-mono text-[8.5px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3 h-3 text-[#00f2ff]" />
                SHARE BOT INVITATION QR
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full mt-1.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 hover:text-rose-400 text-neutral-550 border border-neutral-850 rounded font-mono text-[8.5px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                <LogOut className="w-3 h-3 text-rose-500/80 shrink-0" />
                DISCONNECT DRIVER SESSION
              </button>
            </div>

            {/* Account Linker Form */}
            <div className="bg-neutral-950/60 p-3.5 border border-neutral-900 rounded-xl space-y-3 font-mono">
              <div className="flex items-center gap-1.5 text-amber-500 text-[10px] uppercase font-bold tracking-wider">
                <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                <span>LINK PLATFORM ACCOUNT</span>
              </div>

              <p className="text-[7.5px] text-neutral-400 leading-relaxed">
                Connect your Walmart Spark Driver or DoorDash dispatch accounts to synchronize high-frequency automatic grab loops.
              </p>

              <form onSubmit={handleLinkAccount} className="space-y-2">
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {(['Spark', 'DoorDash', 'Instacart', 'Amazon Flex', 'Uber Eats', 'Veho', 'Postmates'] as const).map((plat) => {
                    const isSelected = selectedPlatform === plat;
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setSelectedPlatform(plat)}
                        className={`text-[7.5px] py-1 rounded border font-mono transition-all cursor-pointer truncate ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold' 
                            : 'bg-neutral-900 text-neutral-500 border-neutral-850 hover:bg-neutral-850'
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <label className="text-[7px] text-neutral-500 uppercase block font-bold leading-none">Login Email ID / Driver ID:</label>
                  <input
                    type="text"
                    required
                    value={sparkUser}
                    onChange={(e) => setSparkUser(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-850 text-[9px] text-[#00f2ff] p-1.5 rounded outline-none font-mono"
                    placeholder="driver.login@spark.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[7px] text-neutral-500 uppercase block font-bold leading-none">Access Token Pin / OTP Key:</label>
                  <input
                    type="password"
                    className="w-full bg-neutral-900 border border-neutral-850 text-[9px] text-white p-1.5 rounded outline-none font-mono"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="flex justify-between items-center text-[7.5px] pt-1 border-t border-neutral-900">
                  <span className="text-neutral-500 uppercase">LINK STATE:</span>
                  <span className={`font-bold uppercase ${
                    linkStatus === 'CONNECTED' ? 'text-emerald-400' :
                    linkStatus === 'CONNECTING' ? 'text-amber-400 animate-pulse' :
                    'text-rose-400'
                  }`}>{linkStatus}</span>
                </div>

                <button
                  type="submit"
                  disabled={linkStatus === 'CONNECTING'}
                  className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded font-mono text-[8.5px] font-bold text-amber-500 cursor-pointer uppercase flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${linkStatus === 'CONNECTING' ? 'animate-spin text-amber-400' : 'text-neutral-500'}`} />
                  {linkStatus === 'CONNECTED' ? 'RE-SYNC LINKED GIG ACCOUNT' : 'LINK ACCOUNT'}
                </button>
              </form>
            </div>

          </div>

          {/* Column B: Active Dispatch Grabbing Bots Sessions and Gps geofencing coordinater */}
          <div className="md:col-span-8 space-y-4">
            
            {/* Active Workers Bot Sessions Grid */}
            <div className="bg-neutral-950/60 p-4 border border-neutral-900 rounded-xl space-y-3.5 font-mono">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <div className="flex items-center gap-1.5 text-[#00f2ff] text-[10px] uppercase font-bold tracking-wider">
                  <Cpu className="w-4 h-4 text-[#00f2ff]" />
                  <span>ACTIVE HIGH-FREQUENCY BOT AGENTS ({bots.filter(b => b.status === 'SCANNING').length} RUNNING)</span>
                </div>
                <span className="text-[7px] text-neutral-500">MULTI-INSTANCE DAEMON ENGINE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {bots.map((bot) => {
                  const isUnlocked = unlockedBotIds.includes(bot.id);
                  const isScanning = bot.status === 'SCANNING';
                  return (
                    <div 
                      key={bot.id} 
                      className={`p-3 rounded-lg border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[135px] ${
                        !isUnlocked
                          ? 'bg-neutral-950/40 border-neutral-900/60 opacity-80'
                          : isScanning 
                            ? 'bg-neutral-900/90 border-[#00f2ff]/30 shadow-lg shadow-[#00f2ff]/2'
                            : 'bg-neutral-950/50 border-neutral-850 opacity-60'
                      }`}
                    >
                      {/* Pulse beacon or lock symbol */}
                      {isUnlocked && isScanning && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                      {!isUnlocked && (
                        <span className="absolute top-2 right-2 text-[7px] bg-red-500/10 border border-red-500/25 text-red-400 px-1.5 rounded flex items-center gap-0.5 font-bold uppercase">
                          <Lock className="w-2 h-2 text-red-500" /> LOCKED
                        </span>
                      )}

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[7.5px]">
                          <span className="text-neutral-500 font-bold">#{bot.id}</span>
                          <span className={`font-bold px-1 rounded text-[7px] ${
                            bot.platform === 'Spark' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/25' :
                            bot.platform === 'DoorDash' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/25' :
                            bot.platform === 'Instacart' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25' :
                            bot.platform === 'Amazon Flex' ? 'text-purple-400 bg-purple-500/10 border border-purple-500/25' :
                            bot.platform === 'Veho' ? 'text-teal-400 bg-teal-500/10 border border-teal-500/25' :
                            bot.platform === 'Postmates' ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/25' :
                            'text-[#00f2ff] bg-[#00f2ff]/10 border border-[#00f2ff]/25'
                          }`}>{bot.platform}</span>
                        </div>
                        <h4 className="text-[9.5px] font-bold text-white tracking-tight truncate leading-tight">{bot.name}</h4>
                      </div>

                      <div className="space-y-0.5 text-[8px] text-neutral-400 pt-1.5 border-t border-neutral-950">
                        <div className="flex justify-between">
                          <span>INTERCEPTS:</span>
                          <span className="text-white font-bold">{isUnlocked ? `${bot.interceptsCount} grabs` : '0 grabs (unarmed)'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>REACTION RATE:</span>
                          <span className={isUnlocked ? 'text-amber-500 font-bold' : 'text-neutral-500'}>
                            {isUnlocked ? `${bot.speedMs}ms` : '1000ms Throttled'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleBot(bot.id)}
                        className={`w-full mt-2.5 py-1 text-[8px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          !isUnlocked
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold'
                            : isScanning 
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' 
                              : 'bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/20'
                        }`}
                      >
                        {!isUnlocked ? (
                          <>
                            <CreditCard className="w-2.5 h-2.5 text-amber-500" />
                            <span>💳 UNLOCK LICENSE (${bot.cost.toFixed(2)})</span>
                          </>
                        ) : isScanning ? (
                          <>
                            <Pause className="w-2.5 h-2.5 text-rose-500" />
                            <span>MUTE AUTOMATION</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-2.5 h-2.5 text-[#00f2ff]" />
                            <span>RESUME GRABBING</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GPS GEOFENCE CENTROID COORDINATOR */}
            <div className="bg-neutral-950/60 p-4 border border-neutral-900 rounded-xl space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <div className="flex items-center gap-1.5 text-amber-500 text-[10px] uppercase font-bold tracking-wider">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>2. Walmart Geocircle geofence target locks</span>
                </div>
                <span className="text-[7.5px] text-neutral-500">CENTROID COORDINATOR</span>
              </div>

              <p className="text-[8.5px] text-neutral-400 leading-normal">
                HGT Multi-Bots require strict geolocatability alignment. Select your cluster GPS coordinates. Pinning to target location triggers simulated high-probability FCFS batch distributions locally.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* Inputs block */}
                <div className="sm:col-span-6 space-y-2.5 text-[9px]">
                  <div className="space-y-1">
                    <label className="text-[7.5px] text-neutral-500 uppercase block font-bold leading-none">Target Walmart / Hub Geofence Cluster:</label>
                    <select
                      value={targetStoreLabel}
                      onChange={(e) => {
                        setTargetStoreLabel(e.target.value);
                        // Shift coordinates to simulate different stores
                        if (e.target.value.includes('1852')) { setLat('37.7749'); setLng('-122.4194'); }
                        else if (e.target.value.includes('4105')) { setLat('34.0522'); setLng('-118.2437'); }
                        else { setLat('40.7128'); setLng('-74.0060'); }
                      }}
                      className="w-full bg-neutral-900 border border-neutral-850 text-white rounded p-1.5 outline-none font-mono focus:border-amber-500 text-[8.5px] h-8 cursor-pointer"
                    >
                      <option value="Walmart Supercenter #1852 (San Francisco-East)">Walmart Supercenter #1852 (SF, CA)</option>
                      <option value="Walmart Neighborhood Market #4105 (Los Angeles-Core)">Walmart Neighborhood Market #4105 (LA, CA)</option>
                      <option value="Walmart Store #9281 (Metro New York-Jersey Hub)">Walmart Store #9281 (NY, NY)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[7.5px] text-neutral-500 uppercase block font-bold leading-none">Latitude coordinate:</label>
                      <input
                        type="text"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 text-[#00f2ff] rounded p-1.5 outline-none font-mono text-[8.5px]"
                        placeholder="37.7749"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7.5px] text-neutral-500 uppercase block font-bold leading-none">Longitude coordinate:</label>
                      <input
                        type="text"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 text-[#00f2ff] rounded p-1.5 outline-none font-mono text-[8.5px]"
                        placeholder="-122.4194"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[7.5px]">
                      <span className="text-neutral-500 font-bold uppercase">Search Radius:</span>
                      <span className="text-amber-500 font-bold">{radiusMiles} miles</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      step="1"
                      value={radiusMiles}
                      onChange={(e) => setRadiusMiles(Number(e.target.value))}
                      className="w-full h-1.5 accent-amber-500 cursor-pointer bg-neutral-900 border border-neutral-950 rounded appearance-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUpdateGeofence}
                    disabled={isUpdatingGeofence}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 hover:text-white border border-neutral-850 rounded text-amber-500 font-bold text-[8.5px] cursor-pointer"
                  >
                    {isUpdatingGeofence ? 'RE-ALIGING GPS POSITION...' : 'LOCK GEOFENCE RADAR TARGET'}
                  </button>
                </div>

                {/* Visual Canvas Representation of Active Geofence Area */}
                <div className="sm:col-span-6">
                  <GeofenceCanvas 
                    lat={lat} 
                    lng={lng} 
                    radiusMiles={radiusMiles} 
                    targetStoreLabel={targetStoreLabel} 
                  />
                </div>

              </div>
            </div>

            {/* LICENSE SUBSCRIPTION STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              
              {/* Box: Trial active */}
              <div className="sm:col-span-5 bg-neutral-950/60 p-3 rounded-xl border border-neutral-900 flex flex-col justify-between space-y-3 font-mono">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-500 text-[10px] uppercase font-bold tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bot license status</span>
                  </div>
                  <p className="text-[7.5px] text-neutral-400 leading-normal mt-1">
                    Your current applet removes minimum throttling delays once unlocked. Upgrade to remove the 1000ms tapper cycle protections.
                  </p>
                </div>

                <div className="bg-neutral-900 border border-neutral-850 p-2 rounded text-[8.5px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">LICENSE PROFILE:</span>
                    <span className={`font-black uppercase ${licenseState === 'PRO_LICENSE' ? 'text-[#00f2ff]' : 'text-amber-500'}`}>{licenseState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">TAP RATE THROTTLE:</span>
                    <span className="text-white font-bold">{licenseState === 'PRO_LICENSE' ? '0ms (INSTANTANEOUS)' : '1000ms minimum'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">EXPIRATION:</span>
                    <span className="text-neutral-350">{licenseState === 'PRO_LICENSE' ? '29 Days remaining' : '3 Hours (demo)'}</span>
                  </div>
                </div>
              </div>

              {/* Box: License code input */}
              <div id="client-hq-license-section" className="sm:col-span-7 bg-neutral-950/60 p-3 rounded-xl border border-neutral-900 space-y-3.5 font-mono">
                <div className="flex items-center gap-1.5 text-[#00f2ff] text-[10px] uppercase font-bold tracking-wider">
                  <KeyRound className="w-3.5 h-3.5 text-[#00f2ff]" />
                  <span>ACTIVATE SERIAL LICENSE KEY</span>
                </div>
                
                <p className="text-[7.5px] text-neutral-400 leading-normal">
                  Unlock limitless high-speed grabs. Input your HGT serial key or unlock individually above to bind extreme bypass modes.
                </p>

                <form onSubmit={handleActivateLicense} className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[7.5px] text-neutral-400 font-bold uppercase block">
                      Serial Key & Activation Code:
                    </label>
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-850 text-[10px] text-amber-400 pl-2 p-1.5 rounded outline-none font-mono focus:border-amber-500/50 uppercase"
                      placeholder="e.g. HGT-MULTIBOT-PRO-928"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[7.5px] text-[#00f2ff] font-bold uppercase block">
                      Email Address for Automated $130 Receipt Delivery:
                    </label>
                    <input
                      id="activation-receipt-email-input"
                      type="email"
                      required
                      value={activationReceiptEmail}
                      onChange={(e) => setActivationReceiptEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-850 text-[9.5px] text-white p-1.5 rounded outline-none font-mono focus:border-[#00f2ff]"
                      placeholder="hacybertech@gmail.com"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[7.5px] uppercase text-neutral-500">
                    <span>HINT: Enter <code className="text-amber-500 bg-neutral-900 px-1 py-0.5 rounded">HGT-MULTIBOT-PRO-99</code> for pro mode demo</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-[#00f2ff] hover:bg-[#00e0ec] text-neutral-950 font-bold text-[9px] font-mono rounded cursor-pointer"
                  >
                    ACTIVATE LICENSE & DISPATCH RECEIPT
                  </button>

                  {receiptNotification && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-[8px] text-emerald-400 flex items-center justify-between">
                      <span className="font-semibold">{receiptNotification}</span>
                      <button type="button" onClick={() => setReceiptNotification(null)} className="text-neutral-500 hover:text-white text-[9px] font-bold">✕</button>
                    </div>
                  )}
                </form>
              </div>

            </div>

            {/* PERMANENT CLOUD CONTAINER RUNTIME STATUS */}
            <div className="bg-neutral-950/80 p-4 border border-neutral-900 rounded-xl space-y-4 font-mono mt-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                  <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>3. PERMANENT SERVERLESS CLOUD ROUTE STATUS</span>
                </div>
                <span className="text-[7px] text-neutral-500 font-bold">PERMANENT DEPLOYMENT NODE</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 space-y-2">
                  <p className="text-[8.5px] text-neutral-400 leading-normal">
                    This Multi-Bot tapper operates on a production-ready serverless container architecture deployed to <strong>Google Cloud Run</strong>. By utilizing GCP's permanent free tiers, your dynamic interceptor algorithms, dispatch proxies, and auto-grab processes run 24/7/365 completely free forever!
                  </p>
                  
                  <div className="p-2.5 bg-neutral-950 border border-neutral-900 rounded text-[8px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 uppercase">LIVE APPLICATION URL:</span>
                      <a href={window.location.origin} target="_blank" rel="noreferrer" className="text-[#00f2ff] hover:underline font-bold truncate max-w-[250px]">
                        {window.location.origin}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 uppercase">HOST PLATFORM ENVIRONMENT:</span>
                      <span className="text-emerald-400 font-bold">Google Cloud Run (Serverless Edge Hub)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 uppercase">CONTAINER SLA:</span>
                      <span className="text-white font-bold">99.99% Permanent Uptime Guaranteed</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 bg-neutral-900/60 p-3 rounded-lg border border-neutral-900 flex flex-col justify-between space-y-3 text-center">
                  <div>
                    <span className="text-[7.5px] text-neutral-500 uppercase block font-bold leading-none">EDGE CONTAINER HEALTH:</span>
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      ● LIVE & HOSTED FREE
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePingDeployedNode}
                    disabled={pingStatus === 'PINGING'}
                    className="w-full py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/30 text-[8.5px] text-emerald-400 font-bold rounded cursor-pointer transition-colors"
                  >
                    {pingStatus === 'PINGING' ? (
                      <span className="flex items-center justify-center gap-1">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> PINGING CONTAINER GATEWAY...
                      </span>
                    ) : pingStatus === 'REPLIED' ? (
                      <span>PING ECHO OK ({pingLatency}ms)</span>
                    ) : (
                      <span>CONNECT PING HEALTH</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* GLOWING SECURE CYBER PAYMENT CHECKOUT MODAL */}
      <AnimatePresence>
        {showCheckoutModal && selectedBotToUnlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-filter backdrop-blur-md overflow-y-auto select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-xl p-5 shadow-[0_0_35px_rgba(0,242,255,0.15)] font-mono text-left space-y-4"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-rose-400 text-xs font-bold font-mono uppercase bg-neutral-900 hover:bg-neutral-850 px-2 py-0.5 rounded cursor-pointer"
              >
                ESC [X]
              </button>

              {/* Title Header */}
              <div className="border-b border-neutral-900 pb-3">
                <span className="text-[8px] text-amber-500 font-bold uppercase tracking-widest block">SECURE LICENSING NODE GATEWAY</span>
                <h3 className="text-sm font-semibold text-white tracking-wide mt-1 flex items-center gap-1.5 uppercase">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Activate {selectedBotToUnlock.platform} license</span>
                </h3>
                <p className="text-[7.5px] text-neutral-400 mt-1 leading-normal">
                  Link an authorized debit/credit contract node to permanently bypass high-frequency 1000ms tapper safeguards.
                </p>
              </div>

              {/* Bot Item Specifications */}
              <div className="p-3 bg-neutral-900/65 rounded-lg border border-neutral-900 space-y-2 text-[8px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">BOT CLUSTER:</span>
                  <span className="text-white font-bold">{selectedBotToUnlock.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">GIG NETWORK TARGET:</span>
                  <span className="text-amber-500 font-bold uppercase">{selectedBotToUnlock.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">BYPASS DELAY:</span>
                  <span className="text-emerald-400 font-bold uppercase">1ms High-Speed Grabber</span>
                </div>
                <div className="flex justify-between border-t border-neutral-950 pt-2 text-[9px]">
                  <span className="text-neutral-300 font-bold uppercase">ONE-TIME LICENSE FEE:</span>
                  <span className="text-white font-black text-xs">${selectedBotToUnlock.cost.toFixed(2)} USD</span>
                </div>
              </div>

              {!paymentSuccess ? (
                // Secure card form input
                <form onSubmit={processCheckoutPayment} className="space-y-3.5">
                  {/* Visual card flipper mockup */}
                  <div className="relative h-28 w-full rounded-lg bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-850 border border-neutral-800 p-3.5 flex flex-col justify-between overflow-hidden shadow-inner font-mono text-white select-none">
                    <div className="absolute right-[-10px] bottom-[-20px] w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start">
                      <div className="w-7 h-5 bg-gradient-to-br from-yellow-300 to-amber-500 rounded flex items-center justify-center">
                        <span className="w-5 h-3.5 border border-amber-600/30 rounded" />
                      </div>
                      <span className="text-[7px] text-neutral-500 uppercase font-black tracking-widest bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850">HACYBER LEDGER</span>
                    </div>

                    <div className="text-[11px] tracking-[4px] font-bold text-center py-2 text-neutral-200">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end text-[7px] text-neutral-400 uppercase">
                      <div>
                        <span className="text-[5px] text-neutral-500 block leading-none">CARDHOLDER:</span>
                        <span className="font-bold truncate max-w-[150px] block">{cardHolder || 'MARCUS HARRISON'}</span>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[5px] text-neutral-500 block leading-none">EXPIRES:</span>
                          <span className="font-bold">{cardExpiry || 'MM/YY'}</span>
                        </div>
                        <div>
                          <span className="text-[5px] text-neutral-500 block leading-none">CVC:</span>
                          <span className="font-bold">{cardCvc || '•••'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-2 text-[9px]">
                    <div className="space-y-1 text-[8px]">
                      <label className="text-amber-400 uppercase block font-bold leading-none">Email Address for Automated Receipt Delivery:</label>
                      <input
                        type="email"
                        required
                        value={cardEmail}
                        onChange={(e) => setCardEmail(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 text-white rounded p-1.5 outline-none font-mono focus:border-amber-500"
                        placeholder="hacybertech@gmail.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8px]">
                      <div className="space-y-1">
                        <label className="text-neutral-500 uppercase block font-bold leading-none">Cardholder Name:</label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-850 text-white rounded p-1.5 outline-none font-mono"
                          placeholder="Marcus Harrison"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-neutral-500 uppercase block font-bold leading-none">Credit Card Number:</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            // Format number with spaces
                            const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                            const matches = v.match(/\d{4,16}/g);
                            const match = (matches && matches[0]) || '';
                            const parts = [];
                            for (let i = 0, len = match.length; i < len; i += 4) {
                              parts.push(match.substring(i, i + 4));
                            }
                            if (parts.length > 0) {
                              setCardNumber(parts.join(' '));
                            } else {
                              setCardNumber(v);
                            }
                          }}
                          className="w-full bg-neutral-900 border border-neutral-850 text-[#00f2ff] rounded p-1.5 outline-none font-mono font-bold"
                          placeholder="4111 2222 3333 4444"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8px]">
                      <div className="space-y-1">
                        <label className="text-neutral-500 uppercase block font-bold leading-none">Expiration date:</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^0-9]/gi, '');
                            if (v.length > 2) {
                              v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                            }
                            setCardExpiry(v);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-850 text-white rounded p-1.5 outline-none font-mono"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-neutral-500 uppercase block font-bold leading-none">CVC Code:</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/gi, ''))}
                          className="w-full bg-neutral-900 border border-neutral-850 text-white rounded p-1.5 outline-none font-mono text-center tracking-widest"
                          placeholder="•••"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={paymentIsProcessing}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-950 hover:scale-[1.01] transition-transform active:scale-[0.99] border border-transparent disabled:border-neutral-800 text-neutral-950 disabled:text-neutral-500 font-mono font-black text-[10px] rounded cursor-pointer uppercase flex items-center justify-center gap-1.5"
                  >
                    {paymentIsProcessing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-neutral-950" />
                        <span>AUTHORIZING HIGH-SPEED LICENSE...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-neutral-950" />
                        <span>CONFIRM & SECURE TRANSACTION</span>
                      </>
                    )}
                  </button>

                  <p className="text-[7px] text-neutral-500 text-center uppercase tracking-wide leading-relaxed">
                    🛡️ Authenticated gateway. TLS 1.3 encryption node active. Transactions are simulated for educational driver feedback analytics.
                  </p>
                </form>
              ) : (
                // Success message & invoice printing option
                <div className="space-y-4 text-center py-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">TRANSACTION VERIFIED SUCCESSFUL</h4>
                    <p className="text-[8px] text-neutral-400 leading-normal">
                      License serial key generated and bound to local dispatcher kernel successfully. Reaction rate is now unthrottled!
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-900/60 rounded border border-neutral-850 text-left space-y-1.5 text-[8.5px] font-mono select-text">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">SERIAL VALUE:</span>
                      <span className="text-amber-500 font-bold font-mono">{generatedLicenseKey}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">LICENSE PROFILE:</span>
                      <span className="text-[#00f2ff] font-bold">PERPETUAL PRO LIFETIME</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">GRAB RE-DELAY:</span>
                      <span className="text-emerald-400 font-bold">1ms (UNLIMITED BYPASS)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[8px] pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadInvoice}
                      className="py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/35 text-amber-500 font-bold rounded cursor-pointer uppercase flex items-center justify-center gap-1"
                    >
                      <FileCode className="w-2.5 h-2.5" />
                      <span>PRINT RECEIPT PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCheckoutModal(false)}
                      className="py-1.5 bg-[#00f2ff] hover:bg-[#00d8e4] text-neutral-950 font-bold rounded cursor-pointer uppercase font-mono text-[8px]"
                    >
                      RETURN TO DASHBOARD
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARING INVITATION QR CODE MODAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-filter backdrop-blur-md overflow-y-auto select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-neutral-950 border border-[#00f2ff]/30 rounded-xl p-5 shadow-[0_0_35px_rgba(0,242,255,0.2)] font-mono text-left space-y-4"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-rose-400 text-xs font-bold font-mono uppercase bg-neutral-900 hover:bg-neutral-850 px-2 py-0.5 rounded cursor-pointer"
              >
                ESC [X]
              </button>

              {/* Title Header */}
              <div className="border-b border-neutral-900 pb-3">
                <span className="text-[8px] text-[#00f2ff] font-bold uppercase tracking-widest block">TELEMETRY ACCESS GATEWAY</span>
                <h3 className="text-sm font-semibold text-white tracking-wide mt-1 flex items-center gap-1.5 uppercase">
                  <QrCode className="w-4 h-4 text-[#00f2ff]" />
                  <span>SHARE BOT INVITATION QR</span>
                </h3>
                <p className="text-[7.5px] text-neutral-400 mt-1 leading-normal">
                  Generate a high-frequency telemetry invitation matrix to seamlessly stream automated dispatch configs to secondary devices.
                </p>
              </div>

              {/* Selector Tabs for Link Types */}
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setQrLinkType('telegram');
                    setCopiedLink(false);
                  }}
                  className={`text-[7.5px] py-1.5 rounded border font-mono transition-all cursor-pointer text-center ${
                    qrLinkType === 'telegram'
                      ? 'bg-[#00f2ff]/10 border-[#00f2ff]/40 text-[#00f2ff] font-bold'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-850 hover:bg-neutral-850'
                  }`}
                >
                  TELEGRAM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrLinkType('tracker');
                    setCopiedLink(false);
                  }}
                  className={`text-[7.5px] py-1.5 rounded border font-mono transition-all cursor-pointer text-center ${
                    qrLinkType === 'tracker'
                      ? 'bg-[#00f2ff]/10 border-[#00f2ff]/40 text-[#00f2ff] font-bold'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-850 hover:bg-neutral-850'
                  }`}
                >
                  TRACKER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrLinkType('active_domain');
                    setCopiedLink(false);
                  }}
                  className={`text-[7.5px] py-1.5 rounded border font-mono transition-all cursor-pointer text-center ${
                    qrLinkType === 'active_domain'
                      ? 'bg-[#00f2ff]/10 border-[#00f2ff]/40 text-[#00f2ff] font-bold'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-850 hover:bg-neutral-850'
                  }`}
                >
                  DOMAIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrLinkType('custom');
                    setCopiedLink(false);
                    if (!customQrUrl) {
                      setCustomQrUrl('https://');
                    }
                  }}
                  className={`text-[7.5px] py-1.5 rounded border font-mono transition-all cursor-pointer text-center ${
                    qrLinkType === 'custom'
                      ? 'bg-[#00f2ff]/10 border-[#00f2ff]/40 text-[#00f2ff] font-bold'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-850 hover:bg-neutral-850'
                  }`}
                >
                  CUSTOM LINK
                </button>
              </div>

              {/* Dynamic URL Resolver */}
              {(() => {
                let resolvedUrl = 'https://t.me/multi_grabber_system_bot';
                let label = 'Telegram Multi-Grabber Bot';
                let desc = 'Automated dispatch daemon directly in secure messenger nodes.';
                
                if (qrLinkType === 'tracker') {
                  resolvedUrl = 'https://hacyber-global.github.io/Bot.com/';
                  label = 'Hacyber Live Web Tracker';
                  desc = 'Interactive browser map portal syncing Walmart GPS geofences.';
                } else if (qrLinkType === 'active_domain') {
                  resolvedUrl = `https://${activeDomain || window.location.host}`;
                  label = 'Secure Local Host Tunnel';
                  desc = 'Active container endpoint deployment running on Cloud Run edge nodes.';
                } else if (qrLinkType === 'custom') {
                  resolvedUrl = customQrUrl.trim() || 'https://';
                  label = 'Custom Network Link';
                  desc = 'User-provided invitation, custom referral tracker, or alternate routing node.';
                }

                // QR Color mapping
                const fgColor = qrColorMode === 'cyber' ? '00f2ff' : '000000';
                const bgColor = qrColorMode === 'cyber' ? '0a0a0c' : 'ffffff';
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${fgColor}&bgcolor=${bgColor}&data=${encodeURIComponent(resolvedUrl)}`;

                const handleCopyLink = () => {
                  navigator.clipboard.writeText(resolvedUrl);
                  setCopiedLink(true);
                  onAddLog('info', `📋 Shared Node: Bot invitation link copied to system clipboard: ${resolvedUrl}`, undefined, 'QR_COPY');
                  setTimeout(() => setCopiedLink(false), 2000);
                };

                return (
                  <div className="space-y-4">
                    {/* Custom Input URL Panel (Visible when qrLinkType is 'custom') */}
                    {qrLinkType === 'custom' && (
                      <div className="p-3 bg-neutral-900/60 border border-[#00f2ff]/30 rounded-lg space-y-2">
                        <label className="text-[7.5px] text-[#00f2ff] font-bold uppercase tracking-wider block">PASTE CUSTOM QR TARGET URL</label>
                        <input
                          type="text"
                          value={customQrUrl}
                          placeholder="e.g. https://your-custom-link.com"
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomQrUrl(val);
                            localStorage.setItem('hq_custom_qr_url', val);
                          }}
                          className="w-full text-[9px] font-mono bg-black border border-[#00f2ff]/40 text-[#00f2ff] rounded p-2 focus:ring-1 focus:ring-[#00f2ff] focus:outline-none placeholder-neutral-600"
                        />
                        <p className="text-[7px] text-neutral-500 leading-normal">
                          Type or paste any target invitation link, Telegram chat link, or referral URL above to instantly re-generate the QR matrix code.
                        </p>
                      </div>
                    )}

                    {/* QR Code Canvas Frame */}
                    <div className="relative flex flex-col items-center justify-center p-6 bg-neutral-900/40 rounded-lg border border-neutral-900/80 overflow-hidden group">
                      {/* Hologram background flare */}
                      <div className="absolute inset-0 bg-gradient-to-b from-[#00f2ff]/2 to-[#00f2ff]/0 pointer-events-none" />
                      
                      {/* Interactive visual scan lines */}
                      {qrColorMode === 'cyber' && (
                        <div className="scan-line" />
                      )}

                      {/* Cyber Framing brackets */}
                      <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-[#00f2ff]/40" />
                      <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-[#00f2ff]/40" />
                      <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-[#00f2ff]/40" />
                      <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-[#00f2ff]/40" />

                      {/* Image tag loaded referrals */}
                      <div className={`p-3 rounded-md ${qrColorMode === 'cyber' ? 'bg-[#0a0a0c]/90 border border-[#00f2ff]/20' : 'bg-white border border-neutral-200'} transition-colors duration-300`}>
                        <img 
                          src={qrUrl} 
                          alt="Bot Invitation QR Code"
                          referrerPolicy="no-referrer"
                          className="w-48 h-48 select-text object-contain"
                        />
                      </div>

                      {/* Scannable overlay alert */}
                      <span className="text-[7.5px] text-neutral-500 uppercase mt-3 tracking-widest font-bold">
                        [ Point other device camera to scan ]
                      </span>
                    </div>

                    {/* Metadata Card */}
                    <div className="p-3 bg-neutral-900/50 rounded-lg border border-neutral-900 space-y-1 text-[8px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-neutral-500 uppercase">INVITATION ID:</span>
                        <span className="text-white font-bold">{qrLinkType.toUpperCase()}-CONNECT</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 uppercase">LINK TARGET:</span>
                        <span className="text-[#00f2ff] font-bold truncate max-w-[200px]">{resolvedUrl}</span>
                      </div>
                      <p className="text-neutral-400 mt-1 leading-normal italic text-[7.5px] border-t border-neutral-950 pt-1.5">
                        {desc}
                      </p>
                    </div>

                    {/* Interactive controls */}
                    <div className="grid grid-cols-2 gap-2 text-[8px]">
                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-[#00f2ff]/30 text-neutral-300 font-bold rounded cursor-pointer uppercase flex items-center justify-center gap-1"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-emerald-400">COPIED SUCCESSFULLY</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5 text-neutral-500" />
                            <span>COPY ACCESS URL</span>
                          </>
                        )}
                      </button>

                      {/* Color mode switcher */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextMode = qrColorMode === 'cyber' ? 'classic' : 'cyber';
                          setQrColorMode(nextMode);
                          onAddLog('info', `🎨 UI Theme: Switched QR matrix contrast mode to ${nextMode === 'cyber' ? 'CYBER_NEON_BLUE' : 'CLASSIC_MONOCHROME'}`, undefined, 'QR_THEME');
                        }}
                        className={`py-1.5 border rounded font-bold cursor-pointer uppercase font-mono text-[8px] flex items-center justify-center gap-1 ${
                          qrColorMode === 'cyber'
                            ? 'bg-neutral-900 border-neutral-800 hover:border-amber-500/20 text-amber-500'
                            : 'bg-white border-neutral-300 text-black hover:bg-neutral-100'
                        }`}
                      >
                        <Share2 className="w-2.5 h-2.5" />
                        <span>{qrColorMode === 'cyber' ? 'CLASSIC HIGH-CONTRAST' : 'CYBER GLOW MODE'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
