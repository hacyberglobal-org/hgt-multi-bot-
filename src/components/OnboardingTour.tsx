import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Sliders, 
  Terminal, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  Copy, 
  ExternalLink, 
  Key, 
  Zap,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface TourStep {
  targetId: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  tab?: 'domain' | 'paypal' | 'stripe' | 'deposit' | 'alerts' | 'devices' | 'orderRequest' | 'payloader' | 'clientHq' | 'wallet' | 'voice' | 'connect' | 'deploy';
  actionType?: 'paypal_link' | 'client_hq_key';
}

interface OnboardingTourProps {
  onComplete: () => void;
  onNavigateTab?: (tab: 'domain' | 'paypal' | 'stripe' | 'deposit' | 'alerts' | 'devices' | 'orderRequest' | 'payloader' | 'clientHq' | 'wallet' | 'voice' | 'connect' | 'deploy') => void;
}

export default function OnboardingTour({ onComplete, onNavigateTab }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState('hacybertech@gmail.com');
  const [receiptSent, setReceiptSent] = useState(false);
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);

  const paypalDirectUrl = 'https://paypal.me/hacyber-global/130';
  const demoLicenseKey = 'HGT-MULTIBOT-PRO';

  const handleSimulateReceipt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!receiptEmail || !receiptEmail.includes('@')) return;
    setIsSendingReceipt(true);
    setTimeout(() => {
      setIsSendingReceipt(false);
      setReceiptSent(true);
      setTimeout(() => setReceiptSent(false), 6000);
    }, 1000);
  };

  const steps: TourStep[] = [
    {
      targetId: '',
      badge: 'OVERVIEW',
      title: 'Welcome Student Pilot!',
      description: 'Welcome to the HGT Multi-Bot Dispatch Terminal! This interactive tour guides you through our real-time gig economy bot dispatcher simulator. Learn how to configure filters, monitor telemetry, complete the $130 activation payment, and verify your driver profile in Client HQ!',
      icon: <Sparkles className="w-5 h-5 text-[#00f2ff]" />,
      position: 'center'
    },
    {
      targetId: 'spark-filters-panel',
      badge: 'CONFIGURATION',
      title: 'Bot Parameters & Audio Guards',
      description: 'Configure your auto-grabbing filters here! Set minimum pay rates, maximum miles, and choose which platform feeds to listen to. Adjust reaction speed in milliseconds to simulate safe human behavior and prevent anti-bot detection bans!',
      icon: <Sliders className="w-5 h-5 text-amber-500" />,
      position: 'right'
    },
    {
      targetId: 'spark-logs-panel',
      badge: 'TELEMETRY',
      title: 'Live Telemetry Action Logs',
      description: 'Your command center feed! This console streams real-time connection status logs, ping handshakes, and active FCFS offers. It logs precisely when the bot evaluates, captures, or safely skips an offer based on your parameters.',
      icon: <Terminal className="w-5 h-5 text-[#00f2ff]" />,
      position: 'left'
    },
    {
      targetId: 'telegram-status-modal-toggle',
      badge: 'TELEGRAM BOT',
      title: 'Telegram Companion Integration',
      description: 'Tap this icon to open the Telegram companion bot status! Connect your dispatch hub to a Telegram bot, sending instant matching offer alerts, remote dispatch commands, and billing reports directly to your mobile phone.',
      icon: <Bot className="w-5 h-5 text-emerald-400" />,
      position: 'bottom'
    },
    {
      targetId: 'branding-tab-paypal-btn',
      tab: 'paypal',
      badge: 'ACTIVATION STEP 1 OF 2',
      title: 'Activation Step 1: $130 Payment Process',
      description: 'To lift the tapper throttle and activate permanent 1ms dispatch speed across all gig bots, complete the $130.00 Bot Activation fee. Process payment directly via the $130 PayPal Checkout link or select the $130 Bot Activation Plan in Order Request. Save your PayPal transaction proof or reference ID for instant clearing!',
      icon: <CreditCard className="w-5 h-5 text-amber-400" />,
      position: 'bottom',
      actionType: 'paypal_link'
    },
    {
      targetId: 'branding-tab-client-hq-btn',
      tab: 'clientHq',
      badge: 'ACTIVATION STEP 2 OF 2',
      title: 'Activation Step 2: Account Verification in Client HQ',
      description: 'Navigate to the Client HQ portal to complete driver account verification. Confirm your driver profile details, enter your $130 Serial License Key (HGT-MULTIBOT-PRO or HGT-SPARK-PRO), and link your delivery platform credentials (Walmart Spark / DoorDash) to verify your account and authorize live intercept channels!',
      icon: <ShieldCheck className="w-5 h-5 text-[#00f2ff]" />,
      position: 'top',
      actionType: 'client_hq_key'
    },
    {
      targetId: '',
      badge: 'SYSTEM READY',
      title: 'Ready for Takeoff!',
      description: 'You are now fully trained and verified on the HGT Dispatch Terminal! Your $130 activation and Client HQ account verification are confirmed. Keep an eye on device power and maintain low latency for immediate 1ms response speeds. Good luck!',
      icon: <Check className="w-5 h-5 text-emerald-400" />,
      position: 'center'
    }
  ];

  const step = steps[currentStep];

  // Auto-switch tabs when stepping through tour
  useEffect(() => {
    if (step.tab && onNavigateTab) {
      onNavigateTab(step.tab);
    }
  }, [currentStep, step.tab, onNavigateTab]);

  useEffect(() => {
    if (!step.targetId) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
        
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-[#00f2ff]', 'ring-offset-2', 'ring-offset-neutral-950', 'transition-all', 'duration-500');
      } else {
        setCoords(null);
      }
    };

    const timer = setTimeout(updateCoords, 200);
    window.addEventListener('resize', updateCoords);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCoords);
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          el.classList.remove('ring-2', 'ring-[#00f2ff]', 'ring-offset-2', 'ring-offset-neutral-950');
        }
      }
    };
  }, [currentStep, step.targetId]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const copyPaypalLink = () => {
    navigator.clipboard.writeText(paypalDirectUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyLicenseKey = () => {
    navigator.clipboard.writeText(demoLicenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getTooltipStyle = () => {
    if (step.position === 'center' || !coords) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
        zIndex: 100
      };
    }

    const margin = 15;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      return {
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'fixed' as const,
        zIndex: 100,
        width: 'calc(100% - 24px)',
        maxWidth: '420px'
      };
    }

    switch (step.position) {
      case 'right':
        return {
          top: `${Math.max(20, coords.top + coords.height / 2 - 140)}px`,
          left: `${coords.left + coords.width + margin}px`,
          position: 'absolute' as const,
          zIndex: 100
        };
      case 'left':
        return {
          top: `${Math.max(20, coords.top + coords.height / 2 - 140)}px`,
          left: `${Math.max(10, coords.left - 390 - margin)}px`,
          position: 'absolute' as const,
          zIndex: 100
        };
      case 'bottom':
        return {
          top: `${coords.top + coords.height + margin}px`,
          left: `${Math.max(10, coords.left + coords.width / 2 - 190)}px`,
          position: 'absolute' as const,
          zIndex: 100
        };
      case 'top':
      default:
        return {
          top: `${Math.max(20, coords.top - 280 - margin)}px`,
          left: `${Math.max(10, coords.left + coords.width / 2 - 190)}px`,
          position: 'absolute' as const,
          zIndex: 100
        };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99] overflow-y-auto">
        {/* Semi-transparent Backdrop with dynamic spotlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
          className="fixed inset-0 bg-neutral-950/75 backdrop-blur-sm"
        />

        {/* Dynamic Spotlight Cutout Frame */}
        {coords && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute border-[3px] border-[#00f2ff]/60 rounded-xl pointer-events-none z-[99] shadow-[0_0_35px_rgba(0,242,255,0.3)] transition-all duration-300"
            style={{
              top: `${coords.top - 4}px`,
              left: `${coords.left - 4}px`,
              width: `${coords.width + 8}px`,
              height: `${coords.height + 8}px`
            }}
          >
            <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#00f2ff]" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff]" />
            <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff]" />
            <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#00f2ff]" />
          </motion.div>
        )}

        {/* Tour Tooltip Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.4 }}
          style={getTooltipStyle()}
          className="w-[360px] xs:w-[390px] max-w-full bg-neutral-900/95 border border-[#00f2ff]/40 text-white rounded-xl p-5 shadow-[0_0_30px_rgba(0,242,255,0.2)] backdrop-blur-md select-none font-mono"
        >
          {/* Top Category Badge */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-800">
            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
              step.badge.includes('ACTIVATION')
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 animate-pulse'
                : 'bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff]'
            }`}>
              ⚡ {step.badge}
            </span>
            <span className="text-[8px] text-neutral-400 font-bold">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-100 tracking-wider uppercase leading-snug">
                  {step.title}
                </h3>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onComplete}
              className="p-1 rounded-full border border-neutral-800 hover:border-rose-500/40 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              title="Close Tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description Content */}
          <p className="text-[9.5px] text-neutral-300 leading-relaxed mb-4 font-sans">
            {step.description}
          </p>

          {/* Dedicated Interactive Panels for Activation Steps */}
          {step.actionType === 'paypal_link' && (
            <div className="mb-4 bg-neutral-950/80 border border-amber-500/30 rounded-lg p-3 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-[8px] text-amber-400 font-bold uppercase">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-amber-400" />
                  <span>$130.00 Direct Checkout Link</span>
                </span>
                <span className="text-[7.5px] bg-amber-500/20 text-amber-300 px-1 rounded">INSTANT</span>
              </div>

              <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1.5 rounded text-[8.5px]">
                <code className="text-[#00f2ff] truncate flex-1">{paypalDirectUrl}</code>
                <button
                  type="button"
                  onClick={copyPaypalLink}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[7.5px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="space-y-1 text-[8px] text-neutral-400 pt-1 border-t border-neutral-900 font-sans">
                <div className="flex items-center gap-1 text-neutral-300 font-bold">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span>Quick Process: 1. Send $130 → 2. Save PayPal Proof ID → 3. Activate in HQ</span>
                </div>
              </div>

              {/* Email Form Field for $130 Automated Receipt Delivery */}
              <form onSubmit={handleSimulateReceipt} className="space-y-1.5 pt-1.5 border-t border-neutral-900 font-mono">
                <label className="text-[7.5px] text-amber-400 uppercase font-bold block">
                  📧 Email Address for Automated $130 Receipt Delivery:
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="activation-step-1-email-input"
                    type="email"
                    required
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="your-email@domain.com"
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white rounded px-2 py-1 text-[8.5px] outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    id="activation-step-1-send-receipt-btn"
                    type="submit"
                    disabled={isSendingReceipt}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[7.5px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
                  >
                    {isSendingReceipt ? (
                      <span className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Dispatch Receipt</span>
                    )}
                  </button>
                </div>

                {receiptSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[7.5px] font-sans text-emerald-400 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span><strong>Automated $130 Receipt Dispatched!</strong> Delivered to {receiptEmail} (Tx: #TX-130-9842).</span>
                  </motion.div>
                )}
              </form>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('orderRequest')}
                  className="w-full py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[8px] font-bold cursor-pointer flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span>VIEW $130 PLAN IN ORDER REQUEST TAB</span>
                </button>
              )}
            </div>
          )}

          {step.actionType === 'client_hq_key' && (
            <div className="mb-4 bg-neutral-950/80 border border-[#00f2ff]/30 rounded-lg p-3 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-[8px] text-[#00f2ff] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-[#00f2ff]" />
                  <span>Client HQ Demo Serial Key</span>
                </span>
                <span className="text-[7.5px] bg-[#00f2ff]/20 text-[#00f2ff] px-1 rounded">PRO UNLOCK</span>
              </div>

              <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1.5 rounded text-[8.5px]">
                <code className="text-amber-400 font-bold truncate flex-1">{demoLicenseKey}</code>
                <button
                  type="button"
                  onClick={copyLicenseKey}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[7.5px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedKey ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>

              <div className="space-y-1 text-[8px] text-neutral-400 pt-1 border-t border-neutral-900 font-sans">
                <div className="flex items-center gap-1 text-neutral-300 font-bold">
                  <ShieldCheck className="w-2.5 h-2.5 text-[#00f2ff] shrink-0" />
                  <span>Verification: Enter Key → Link Driver Credentials → 1ms Scan Unlocked</span>
                </div>
              </div>

              {/* Email Form Field for $130 Automated Receipt Delivery */}
              <form onSubmit={handleSimulateReceipt} className="space-y-1.5 pt-1.5 border-t border-neutral-900 font-mono">
                <label className="text-[7.5px] text-[#00f2ff] uppercase font-bold block">
                  📧 Email Address for Automated Receipt Verification:
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="activation-step-2-email-input"
                    type="email"
                    required
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="your-email@domain.com"
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-white rounded px-2 py-1 text-[8.5px] outline-none focus:border-[#00f2ff] font-mono"
                  />
                  <button
                    id="activation-step-2-send-receipt-btn"
                    type="submit"
                    disabled={isSendingReceipt}
                    className="px-2 py-1 bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] border border-[#00f2ff]/40 rounded text-[7.5px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
                  >
                    {isSendingReceipt ? (
                      <span className="w-2.5 h-2.5 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Verify & Send Receipt</span>
                    )}
                  </button>
                </div>

                {receiptSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[7.5px] font-sans text-emerald-400 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span><strong>Automated $130 Receipt Dispatched!</strong> Delivered to {receiptEmail} (Tx: #TX-130-9842).</span>
                  </motion.div>
                )}
              </form>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('client-hq-license-section') || document.getElementById('client-hq-verification-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="w-full py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 rounded text-[8px] font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <Zap className="w-2.5 h-2.5 text-[#00f2ff]" />
                <span>SCROLL TO LICENSE ACTIVATION FORM</span>
              </button>
            </div>
          )}

          {/* Progress Pip indicators & Navigation */}
          <div className="flex justify-between items-center pt-3 border-t border-neutral-800">
            <div className="flex gap-1">
              {steps.map((s, i) => (
                <span
                  key={i}
                  title={`Step ${i + 1}: ${s.title}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep 
                      ? 'bg-[#00f2ff] w-3.5 shadow-[0_0_8px_rgba(0,242,255,0.6)]' 
                      : 'bg-neutral-800 w-1.5'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-1.5">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-2.5 py-1 text-[8.5px] font-bold border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded bg-neutral-950 hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>PREV</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1 text-[8.5px] font-extrabold bg-[#00f2ff] hover:bg-[#00d8e6] text-neutral-950 rounded transition-all cursor-pointer flex items-center gap-0.5 hover:shadow-[0_0_12px_rgba(0,242,255,0.4)]"
              >
                <span>{currentStep === steps.length - 1 ? 'START SIMULATOR' : 'NEXT'}</span>
                {currentStep < steps.length - 1 && <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
