import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerSupportSuccessToast } from '../lib/supportToastManager';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Lock,
  Zap,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Building2,
  ExternalLink,
  HelpCircle,
  Clock,
  Sparkles,
  RefreshCw,
  FileCheck
} from 'lucide-react';

interface LeadIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadSubmitted?: (leadData: any) => void;
  initialNetwork?: string;
}

interface FormState {
  // Step 1: Client Profile
  fullName: string;
  email: string;
  mobile: string;
  streetAddress: string;
  zipCode: string;
  city: string;
  state: string;

  // Step 2: Device & Network Selection
  hardwareProfile: string;
  networks: string[];
  customNetworks: string;
  experienceLevel: string;

  // Step 3: Service Tier & Order Preferences
  orderPreference: string;
  serviceTier: 'standard' | 'priority' | 'enterprise';

  // Step 4: Secure Payment & Verification
  paymentMethod: 'Zelle' | 'Bitcoin' | 'Lead Bank Transfer' | 'USDT' | 'Ethereum';
  txProofText: string;
  fileName: string;
  agreedToTerms: boolean;
}

const INITIAL_FORM: FormState = {
  fullName: '',
  email: '',
  mobile: '',
  streetAddress: '',
  zipCode: '',
  city: '',
  state: '',
  hardwareProfile: 'iPhone (iOS)',
  networks: ['Walmart Spark', 'DoorDash'],
  customNetworks: '',
  experienceLevel: 'Experienced (1+ yrs)',
  orderPreference: 'High-Value Priority Orders ($30+)',
  serviceTier: 'priority',
  paymentMethod: 'Zelle',
  txProofText: '',
  fileName: '',
  agreedToTerms: true,
};

export default function LeadIntakeModal({ isOpen, onClose, onLeadSubmitted, initialNetwork }: LeadIntakeModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<FormState>(() => {
    const saved = localStorage.getItem('hgt_saved_lead_draft');
    if (saved) {
      try {
        return { ...INITIAL_FORM, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return INITIAL_FORM;
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeBotLink, setActiveBotLink] = useState('https://t.me/multi_grabber_system_bot');

  useEffect(() => {
    fetch('/api/telegram/bot-info')
      .then(res => res.json())
      .then(data => {
        if (data && data.botLink) {
          setActiveBotLink(data.botLink);
        }
      })
      .catch(() => {});
  }, []);

  // If initialNetwork is passed, ensure it is selected
  useEffect(() => {
    if (initialNetwork && !formData.networks.includes(initialNetwork)) {
      setFormData(prev => ({
        ...prev,
        networks: [...prev.networks, initialNetwork]
      }));
    }
  }, [initialNetwork]);

  // Save progress automatically
  useEffect(() => {
    if (!submissionResult) {
      localStorage.setItem('hgt_saved_lead_draft', JSON.stringify(formData));
    }
  }, [formData, submissionResult]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleNetwork = (net: string) => {
    setFormData(prev => {
      const exists = prev.networks.includes(net);
      return {
        ...prev,
        networks: exists ? prev.networks.filter(n => n !== net) : [...prev.networks, net]
      };
    });
  };

  // Validation rules per step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full legal name is required';
      if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = 'Valid email address is required';
      if (!formData.mobile.trim() || formData.mobile.length < 7) newErrors.mobile = 'Mobile phone number is required';
      if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Delivery service street address is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP / Postal code is required';
    } else if (step === 2) {
      if (!formData.hardwareProfile) newErrors.hardwareProfile = 'Please select your primary hardware device';
      if (formData.networks.length === 0 && !formData.customNetworks.trim()) {
        newErrors.networks = 'Select at least one delivery platform';
      }
    } else if (step === 3) {
      if (!formData.orderPreference) newErrors.orderPreference = 'Please select your order dispatch preference';
    } else if (step === 4) {
      if (!formData.agreedToTerms) newErrors.terms = 'You must confirm and acknowledge the support terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (Math.min(prev + 1, 4) as any));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (Math.max(prev - 1, 1) as any));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        streetAddress: `${formData.streetAddress}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}`,
        zipCode: formData.zipCode,
        hardwareProfile: formData.hardwareProfile,
        networks: formData.networks,
        orderPreference: formData.orderPreference,
        paymentMethod: formData.paymentMethod,
        txHashOrProof: formData.fileName 
          ? `File: ${formData.fileName}${formData.txProofText ? ` | Ref: ${formData.txProofText}` : ''}`
          : (formData.txProofText || 'Pending manual verification in portal'),
        notes: `Tier: ${formData.serviceTier.toUpperCase()} | Exp: ${formData.experienceLevel} | Custom: ${formData.customNetworks || 'None'}`
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.ok) {
        setSubmissionResult({
          leadId: data.leadId,
          lead: data.lead,
          paymentMethod: formData.paymentMethod,
          fullName: formData.fullName,
          email: formData.email
        });
        localStorage.removeItem('hgt_saved_lead_draft');
        
        // Trigger glassmorphic success toast animation
        triggerSupportSuccessToast({
          ticketId: data.leadId || 'HGT-LEAD-QUEUED',
          title: 'Support Request Submitted',
          clientName: formData.fullName,
          serviceTier: formData.serviceTier.toUpperCase(),
          platform: formData.networks.slice(0, 3).join(', ') + (formData.networks.length > 3 ? '...' : ''),
          message: `Your activation support request has been logged. Queued for admin verification.`,
          botLink: activeBotLink
        });

        if (onLeadSubmitted) onLeadSubmitted(data);
      } else {
        alert(data.error || 'Submission failed. Please check your inputs.');
      }
    } catch (err: any) {
      console.error('Lead submission failed:', err);
      alert('Network communication error. Please retry or contact Telegram support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Identity & Market', subtitle: 'Driver Profile' },
    { num: 2, title: 'Hardware & Apps', subtitle: 'Ecosystem' },
    { num: 3, title: 'Preferences', subtitle: 'Speed & Tiers' },
    { num: 4, title: 'Verification', subtitle: 'Activation Proof' }
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-neutral-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00f2ff] via-blue-600 to-purple-600" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Activation & Verification Support Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Intake
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                HACYBERGLOBATECH Authorized Driver Assistance & Dispatch Queue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors text-sm font-mono"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Multi-step Progress Bar (2026 UX Best Practice) */}
        {!submissionResult && (
          <div className="bg-neutral-950/40 border-b border-neutral-800 px-6 py-3">
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {stepsList.map((step) => {
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => {
                      if (step.num < currentStep) setCurrentStep(step.num as any);
                    }}
                    disabled={step.num > currentStep}
                    className={`flex items-center gap-2 text-left transition-all ${
                      isActive
                        ? 'opacity-100'
                        : isCompleted
                        ? 'opacity-80 hover:opacity-100 cursor-pointer'
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-neutral-950'
                          : isActive
                          ? 'bg-[#00f2ff] text-neutral-950 ring-2 ring-[#00f2ff]/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
                    </div>
                    <div className="hidden sm:block truncate">
                      <div className="text-[11px] font-semibold text-neutral-200 truncate">{step.title}</div>
                      <div className="text-[9px] font-mono text-neutral-400 truncate">{step.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Progress line */}
            <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden mt-3">
              <div
                className="bg-gradient-to-r from-[#00f2ff] to-blue-500 h-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {submissionResult ? (
            // Confirmation Screen
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <FileCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Lead Intake & Verification Ticket Created
                </h3>
                <p className="text-xs text-neutral-400">
                  Your dispatch authorization dossier has been submitted and queued for verification.
                </p>
              </div>

              {/* Reference Card */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-left max-w-lg mx-auto space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                  <span className="text-neutral-500">TICKET IDENTIFIER:</span>
                  <span className="text-[#00f2ff] font-bold select-all">{submissionResult.leadId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">CLIENT:</span>
                  <span className="text-neutral-200">{submissionResult.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">EMAIL:</span>
                  <span className="text-neutral-200">{submissionResult.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">PAYMENT CHANNEL:</span>
                  <span className="text-amber-400 font-bold">{submissionResult.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">STATUS:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> QUEUED FOR REVIEW
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#00f2ff] to-blue-600 text-neutral-950 font-bold text-xs rounded-xl hover:opacity-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  View Support Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionResult(null);
                    setCurrentStep(1);
                    setFormData(INITIAL_FORM);
                  }}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs rounded-xl transition-all cursor-pointer"
                >
                  Submit Another Lead
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: IDENTITY & REGION */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="border-b border-neutral-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <span className="text-[#00f2ff]">01.</span> Driver Identity & Geographic Market
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Enter your legal driver profile and active delivery region.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-neutral-300 flex justify-between">
                        Full Legal Name *
                        {errors.fullName && <span className="text-rose-400 text-[10px]">{errors.fullName}</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Marcus Joshua Vance"
                        className={`w-full bg-neutral-950 border ${
                          errors.fullName ? 'border-rose-500' : 'border-neutral-800'
                        } focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300 flex justify-between">
                        Email Address *
                        {errors.email && <span className="text-rose-400 text-[10px]">{errors.email}</span>}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="driver@logistics-network.com"
                        className={`w-full bg-neutral-950 border ${
                          errors.email ? 'border-rose-500' : 'border-neutral-800'
                        } focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300 flex justify-between">
                        Mobile Phone (SMS & Verification) *
                        {errors.mobile && <span className="text-rose-400 text-[10px]">{errors.mobile}</span>}
                      </label>
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="+1 (555) 019-2834"
                        className={`w-full bg-neutral-950 border ${
                          errors.mobile ? 'border-rose-500' : 'border-neutral-800'
                        } focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all`}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-neutral-300 flex justify-between">
                        Service Delivery Address *
                        {errors.streetAddress && <span className="text-rose-400 text-[10px]">{errors.streetAddress}</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.streetAddress}
                        onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                        placeholder="1420 Commerce Boulevard, Suite 300"
                        className={`w-full bg-neutral-950 border ${
                          errors.streetAddress ? 'border-rose-500' : 'border-neutral-800'
                        } focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300">City / Metropolitan Area</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Dallas-Fort Worth"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300 flex justify-between">
                        Postal / ZIP Code *
                        {errors.zipCode && <span className="text-rose-400 text-[10px]">{errors.zipCode}</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="75201"
                        className={`w-full bg-neutral-950 border ${
                          errors.zipCode ? 'border-rose-500' : 'border-neutral-800'
                        } focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all`}
                      />
                    </div>
                  </div>

                  {/* Trust indicator */}
                  <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-center gap-2.5 text-[11px] text-neutral-400">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Zero credential collection policy: We never ask for platform passwords, PINs, or 2FA codes. All data is encrypted via TLS 1.3.
                    </span>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: HARDWARE & PLATFORMS */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="border-b border-neutral-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <span className="text-[#00f2ff]">02.</span> Hardware Device & Delivery Platforms
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Select which platforms and mobile operating environments you need support for.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-neutral-300 block">
                      Primary Mobile Operating System *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'iPhone (iOS)', label: 'iPhone (iOS)', icon: '🍏' },
                        { id: 'Android Smartphone', label: 'Android Phone', icon: '🤖' },
                        { id: 'Dedicated Tablet', label: 'Delivery Tablet', icon: '📱' },
                        { id: 'Dual Device Setup', label: 'Dual Device', icon: '⚡' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, hardwareProfile: item.id })}
                          className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                            formData.hardwareProfile === item.id
                              ? 'border-[#00f2ff] bg-[#00f2ff]/10 text-white'
                              : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <span className="text-base">{item.icon}</span>
                          <span className="text-xs font-semibold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-medium text-neutral-300 flex justify-between">
                      Active Delivery Networks to Assist *
                      {errors.networks && <span className="text-rose-400 text-[10px]">{errors.networks}</span>}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        'Walmart Spark',
                        'DoorDash',
                        'Instacart',
                        'Amazon Flex',
                        'Uber Eats',
                        'Shipt',
                        'Roadie',
                        'Veho',
                        'GoPuff',
                        'Lyft',
                        'Curri',
                        'SkipTheDishes'
                      ].map((net) => {
                        const isSelected = formData.networks.includes(net);
                        return (
                          <button
                            key={net}
                            type="button"
                            onClick={() => toggleNetwork(net)}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                              isSelected
                                ? 'border-[#00f2ff] bg-[#00f2ff]/10 text-white'
                                : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <span>{net}</span>
                            <span
                              className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] border ${
                                isSelected
                                  ? 'bg-[#00f2ff] text-neutral-950 border-[#00f2ff]'
                                  : 'border-neutral-700'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-medium text-neutral-300">
                      Other Regional Delivery Platforms (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.customNetworks}
                      onChange={(e) => setFormData({ ...formData, customNetworks: e.target.value })}
                      placeholder="e.g. DeliverThat, Point Pickup, Bungii"
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PREFERENCES & SERVICE TIERS */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="border-b border-neutral-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <span className="text-[#00f2ff]">03.</span> Order Profile & Support Level
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Configure your preferred order thresholds and service SLA tier.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-300">
                      Primary Dispatch Target Profile *
                    </label>
                    <select
                      value={formData.orderPreference}
                      onChange={(e) => setFormData({ ...formData, orderPreference: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="High-Value Priority Orders ($30+)">High-Value Priority Orders ($30+)</option>
                      <option value="Express Batch / Multi-Stop Orders">Express Batch / Multi-Stop Orders</option>
                      <option value="Instant Direct Delivery Blocks">Instant Direct Delivery Blocks</option>
                      <option value="Grocery & Large Retail Batches">Grocery & Large Retail Batches</option>
                      <option value="Balanced Route Optimization (Standard)">Balanced Route Optimization (Standard)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-medium text-neutral-300 block">
                      Assistance Tier & Setup Package
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'standard',
                          name: 'Standard Pilot',
                          price: '$130',
                          fee: '$130.00 setup',
                          desc: 'Single-zone assistance & driver intake guidance'
                        },
                        {
                          id: 'priority',
                          name: 'Priority Pro',
                          price: '$130',
                          fee: '$130.00 setup',
                          desc: 'Multi-app tracking + priority Telegram response',
                          popular: true
                        },
                        {
                          id: 'enterprise',
                          name: 'Fleet Operator',
                          price: '$130',
                          fee: '$130.00 setup',
                          desc: 'Full multi-platform monitoring & customized telemetry'
                        }
                      ].map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, serviceTier: pkg.id as any })}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                            formData.serviceTier === pkg.id
                              ? 'border-[#00f2ff] bg-[#00f2ff]/10 text-white shadow-[0_0_15px_rgba(0,242,255,0.1)]'
                              : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          {pkg.popular && (
                            <span className="absolute -top-2.5 right-3 text-[9px] font-mono font-bold bg-gradient-to-r from-[#00f2ff] to-blue-500 text-neutral-950 px-2 py-0.5 rounded-full">
                              MOST POPULAR
                            </span>
                          )}
                          <div>
                            <div className="font-bold text-xs text-white">{pkg.name}</div>
                            <div className="text-[11px] text-neutral-400 mt-1 leading-snug">{pkg.desc}</div>
                          </div>
                          <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-baseline justify-between">
                            <span className="text-lg font-bold text-white font-mono">{pkg.price}</span>
                            <span className="text-[10px] text-neutral-500">{pkg.fee}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>One-Time System Integration & Account Verification:</span>
                      <span className="text-white font-mono font-bold">$130.00 USD</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Live Assistance SLA (Telegram Support Bot):</span>
                      <span className="text-emerald-400 font-mono font-bold">Included</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-white font-bold">
                      <span>Total Balance Due:</span>
                      <span className="text-[#00f2ff] text-base font-mono">$130.00 USD</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: VERIFICATION & PAYMENT ROUTING */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="border-b border-neutral-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <span className="text-[#00f2ff]">04.</span> Payment Routing & Proof Submission
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Select your authorized payment method and provide proof of transfer to complete intake.
                    </p>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'Zelle', label: 'Zelle' },
                      { id: 'Bitcoin', label: 'Bitcoin' },
                      { id: 'Lead Bank Transfer', label: 'Lead Bank' },
                      { id: 'USDT', label: 'USDT' },
                      { id: 'Ethereum', label: 'Ethereum' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: method.id as any })}
                        className={`py-2 px-1 rounded-lg text-xs font-semibold text-center border transition-all ${
                          formData.paymentMethod === method.id
                            ? 'border-[#00f2ff] bg-[#00f2ff]/15 text-[#00f2ff]'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Instructions Card */}
                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                    {formData.paymentMethod === 'Zelle' && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                            <Zap className="w-3.5 h-3.5 text-[#00f2ff]" /> Zelle Payee Routing
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Instant Verification
                          </span>
                        </div>
                        <div className="text-xs text-neutral-300">
                          <div><strong>Payee Name:</strong> Godfrey N Joshua</div>
                          <div className="mt-1"><strong>Zelle Account Address:</strong></div>
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg font-mono text-xs text-emerald-400">
                          <span>zelle@hacyberglobal.dpdns.org</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('zelle@hacyberglobal.dpdns.org', 'zelle')}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            {copiedKey === 'zelle' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedKey === 'zelle' ? 'COPIED' : 'COPY'}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Transfer exactly <strong>$130.00 USD</strong> via your mobile banking app's Zelle feature.
                        </p>
                      </div>
                    )}

                    {formData.paymentMethod === 'Bitcoin' && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white font-mono">
                            🪙 Bitcoin (BTC) Dedicated Vault
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Crypto Settlement
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg font-mono text-xs text-amber-400 break-all">
                          <span className="select-all">3QJ8yE7wU1fKAnF5sWpDHezB39P4Jp8YgD</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('3QJ8yE7wU1fKAnF5sWpDHezB39P4Jp8YgD', 'btc')}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ml-2"
                          >
                            {copiedKey === 'btc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedKey === 'btc' ? 'COPIED' : 'COPY'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href="https://exchange.mercuryo.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded text-[10px] font-mono flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Buy with Mercuryo Card
                          </a>
                        </div>
                      </div>
                    )}

                    {formData.paymentMethod === 'Lead Bank Transfer' && (
                      <div className="space-y-2 text-xs text-neutral-300">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400" /> Lead Bank ACH / Wire Details
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Account and routing credentials will be dispatched to your registered email (<strong>{formData.email || 'your email'}</strong>) upon submission.
                        </p>
                      </div>
                    )}

                    {(formData.paymentMethod === 'USDT' || formData.paymentMethod === 'Ethereum') && (
                      <div className="space-y-2 text-xs text-neutral-300">
                        <div className="font-bold text-white">
                          🌐 {formData.paymentMethod} Smart Contract Endpoint
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Transfer $130.00 equivalent valuation. Destination address details will be sent or verified instantly via the Telegram support bot.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Proof Submission Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300">
                        Reference / Transaction ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.txProofText}
                        onChange={(e) => setFormData({ ...formData, txProofText: e.target.value })}
                        placeholder="e.g. Zelle Ref #9920194 or TX Hash"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#00f2ff] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-300">
                        Receipt / Proof Screenshot
                      </label>
                      <label className="w-full bg-neutral-950 border border-dashed border-neutral-700 hover:border-[#00f2ff] rounded-xl px-3.5 py-2 text-xs text-neutral-400 flex items-center justify-between cursor-pointer transition-colors">
                        <span className="truncate">
                          {formData.fileName ? `📎 ${formData.fileName}` : 'Upload receipt screenshot (.png, .jpg)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData({ ...formData, fileName: file.name });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Mandatory Terms & Disclaimer Checkbox (Project Rules) */}
                  <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.agreedToTerms}
                        onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                        className="mt-0.5 rounded border-neutral-700 text-[#00f2ff] focus:ring-0 focus:outline-none"
                      />
                      <span className="text-[11px] text-neutral-400 leading-snug">
                        I understand and confirm that HACYBERGLOBATECH provides <strong className="text-neutral-200">support and guidance only</strong>. Final decisions regarding account verification or platform standings are made exclusively by the relevant gig platforms.
                      </span>
                    </label>
                    {errors.terms && <p className="text-rose-400 text-[10px] pl-6">{errors.terms}</p>}
                  </div>
                </motion.div>
              )}

              {/* Navigation Footer */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#00f2ff] to-blue-600 hover:opacity-95 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-[#00f2ff] hover:opacity-95 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting Request...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete Lead Registration
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
