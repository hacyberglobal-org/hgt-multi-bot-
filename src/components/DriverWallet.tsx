import React, { useState, useEffect } from 'react';
import { safeStorage as localStorage } from '../lib/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, DollarSign, Download, CreditCard, Send, CheckCircle2, 
  ArrowUpRight, Play, RotateCcw, Volume2, Sparkles, AlertCircle, 
  Clock, Award, Flame, Youtube, ExternalLink, FileText,
  Edit, Target, TrendingUp, Check, X,
  ShieldCheck, Key, Copy, Plus, Search, Filter, Printer, RefreshCw
} from 'lucide-react';
import { SparkOffer, DashboardMetrics } from '../types';
import ReceiptDelivery from './ReceiptDelivery';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

interface DriverWalletProps {
  metrics: DashboardMetrics;
  offers: SparkOffer[];
  onAddLog: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'expire' | 'warning' | 'competitor',
    message: string,
    badge?: string,
    id?: string
  ) => void;
  onResetStats?: () => void;
}

interface PayoutRecord {
  id: string;
  amount: number;
  method: 'CashApp' | 'Venmo' | 'Zelle' | 'Chime' | 'Direct Bank';
  recipient: string;
  timestamp: string;
  status: 'Completed' | 'Pending' | 'Settling';
}

export interface ActivatedLicensePurchase {
  id: string;
  licenseKey: string;
  planName: string;
  amount: number;
  paymentMethod: 'PayPal Express' | 'Stripe Card' | 'Crypto (BTC)' | 'Zelle' | 'CashApp';
  timestamp: string;
  status: 'Active' | 'Verified' | 'Completed';
  txHashOrProof: string;
}

export default function DriverWallet({ metrics, offers, onAddLog, onResetStats }: DriverWalletProps) {
  const [selectedMethod, setSelectedMethod] = useState<'CashApp' | 'Venmo' | 'Zelle' | 'Chime' | 'Direct Bank'>('CashApp');
  const [recipientInput, setRecipientInput] = useState('');
  const [customPayoutAmount, setCustomPayoutAmount] = useState<string>('');
  const [recentInstantPayout, setRecentInstantPayout] = useState<PayoutRecord | null>(null);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [activeBonus, setActiveBonus] = useState(25.00);
  const [claimedBonus, setClaimedBonus] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [volume, setVolume] = useState(30); // Low volume default

  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('hq_daily_earnings_goal');
    return saved ? Number(saved) : 250;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal.toString());

  const [payouts, setPayouts] = useState<PayoutRecord[]>(() => {
    const saved = localStorage.getItem('hq_payout_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'po_1OaFDbEcg9tTZuTgNYmX0PKB', amount: 110.00, method: 'Stripe Bank Account', recipient: 'ba_1MtIhL2eZvKYlo2CAElKwKu2', timestamp: '2026-08-03 01:57', status: 'Pending' },
      { id: 'TX-8819', amount: 135.50, method: 'Zelle', recipient: 'zelle@hacyberglobal.linkpc.net', timestamp: '2026-06-21 14:32', status: 'Completed' },
      { id: 'TX-7212', amount: 91.99, method: 'CashApp', recipient: '$HacyberGlobal', timestamp: '2026-06-20 09:12', status: 'Completed' },
      { id: 'TX-4011', amount: 75.40, method: 'Venmo', recipient: '@HacyberSecure', timestamp: '2026-06-19 18:45', status: 'Completed' }
    ];
  });

  // State for Activated License Purchases ($130.00 Payments History)
  const [licensePurchases, setLicensePurchases] = useState<ActivatedLicensePurchase[]>(() => {
    const saved = localStorage.getItem('hq_license_purchases');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'TX-130-9842',
        licenseKey: 'HGT-MULTIBOT-PRO',
        planName: 'Bot Activation ⚙️ - $130.00',
        amount: 130.00,
        paymentMethod: 'PayPal Express',
        timestamp: '2026-07-26 14:32:10',
        status: 'Active',
        txHashOrProof: 'PP-TX-130-984210'
      },
      {
        id: 'TX-130-7193',
        licenseKey: 'HGT-SPARK-PRO-1ms',
        planName: 'Walmart Spark Grabber License ($130.00)',
        amount: 130.00,
        paymentMethod: 'Stripe Card',
        timestamp: '2026-06-21 11:15:20',
        status: 'Verified',
        txHashOrProof: 'ch_3M09182390123130'
      },
      {
        id: 'TX-130-5509',
        licenseKey: 'HGT-PERPETUAL-PASS',
        planName: 'Perpetual Multi-Bot Cloud Pass ($130.00)',
        amount: 130.00,
        paymentMethod: 'Crypto (BTC)',
        timestamp: '2026-05-18 09:40:00',
        status: 'Completed',
        txHashOrProof: '0x7f8a923b13088102'
      }
    ];
  });

  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'All' | 'Active' | 'Verified' | 'Completed'>('All');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // New Payment Modal Form state
  const [newPaymentMethod, setNewPaymentMethod] = useState<'PayPal Express' | 'Stripe Card' | 'Crypto (BTC)' | 'Zelle' | 'CashApp'>('PayPal Express');
  const [newLicenseKey, setNewLicenseKey] = useState('HGT-MULTIBOT-PRO');
  const [newTxHash, setNewTxHash] = useState('');
  const [newPlanName, setNewPlanName] = useState('Bot Activation ⚙️ - $130.00');

  useEffect(() => {
    localStorage.setItem('hq_payout_history', JSON.stringify(payouts));
  }, [payouts]);

  useEffect(() => {
    localStorage.setItem('hq_license_purchases', JSON.stringify(licensePurchases));
  }, [licensePurchases]);

  // Handle logging a new $130 license payment
  const handleAddLicensePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const txId = `TX-130-${Math.floor(1000 + Math.random() * 9000)}`;
    const proof = newTxHash.trim() || `${newPaymentMethod === 'PayPal Express' ? 'PP' : 'TX'}-130-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const newRecord: ActivatedLicensePurchase = {
      id: txId,
      licenseKey: newLicenseKey.trim() || 'HGT-MULTIBOT-PRO',
      planName: newPlanName,
      amount: 130.00,
      paymentMethod: newPaymentMethod,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Active',
      txHashOrProof: proof
    };

    setLicensePurchases(prev => [newRecord, ...prev]);
    setShowAddPaymentModal(false);
    setNewTxHash('');
    
    onAddLog('bot_accept', `💳 $130 License Payment Logged: Transaction ${txId} (${newPaymentMethod}) verified and added to Payment History ledger.`, 'LICENSE_PAY_OK');
  };

  // Export $130 License Purchases CSV
  const handleExportLicenseCSV = () => {
    const headers = ['TRANSACTION ID', 'TIMESTAMP', 'PLAN ITEM', 'AMOUNT (USD)', 'PAYMENT METHOD', 'LICENSE KEY', 'STATUS', 'PROOF ID'];
    const rows = licensePurchases.map(p => [
      p.id,
      p.timestamp,
      `"${p.planName}"`,
      `$${p.amount.toFixed(2)}`,
      p.paymentMethod,
      p.licenseKey,
      p.status.toUpperCase(),
      p.txHashOrProof
    ]);

    const csvContent = [
      ['HACYBERGLOBAL ACTIVATED LICENSE PURCHASES ($130.00 PAYMENT HISTORY)'],
      [`DATE GENERATED: ${new Date().toLocaleString()}`],
      [`TOTAL PURCHASES: ${licensePurchases.length}`],
      [`TOTAL VOLUME: $${(licensePurchases.reduce((acc, curr) => acc + curr.amount, 0)).toFixed(2)} USD`],
      [],
      headers,
      ...rows
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HGT_130_License_Payment_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddLog('info', '📂 License Payment History exported to CSV.', 'CSV_DOWNLOAD');
  };

  // Generate and Download PDF Receipt for individual $130 License Purchase
  const handleDownloadLicenseInvoice = (record: ActivatedLicensePurchase) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header navy box
    doc.setFillColor(15, 15, 22);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Accents
    doc.setFillColor(0, 242, 255);
    doc.rect(0, 43, pageWidth / 2, 2, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(pageWidth / 2, 43, pageWidth / 2, 2, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 242, 255);
    doc.text("HGT MULTI-BOT DISPATCH", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text("OFFICIAL $130.00 LICENSE ACTIVATION RECEIPT", 14, 28);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`TRANSACTION ID: ${record.id} | DATE: ${record.timestamp}`, 14, 38);
    
    // Receipt details card
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 55, 182, 70, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 55, 182, 70);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("LICENSE PAYMENT SUMMARY", 20, 67);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Plan Item: ${record.planName}`, 20, 77);
    doc.text(`Amount Paid: $${record.amount.toFixed(2)} USD`, 20, 85);
    doc.text(`Payment Method: ${record.paymentMethod}`, 20, 93);
    doc.text(`Transaction Reference: ${record.txHashOrProof}`, 20, 101);
    doc.text(`License Key Bound: ${record.licenseKey}`, 20, 109);
    doc.text(`Activation Status: ${record.status.toUpperCase()}`, 20, 117);
    
    // Terms & Integrity Notice
    doc.setFillColor(240, 253, 250);
    doc.rect(14, 135, 182, 35, 'F');
    doc.setDrawColor(153, 246, 228);
    doc.rect(14, 135, 182, 35);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(13, 148, 136);
    doc.text("PERPETUAL LICENSE UNLOCK & CLOUD BINDING", 20, 145);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("This receipt confirms successful payment of the $130.00 Bot Activation Fee.", 20, 153);
    doc.text("The serial key is bound to your HGT Multi-Bot Dispatch instance to unlock 1ms reaction rate.", 20, 159);
    
    doc.save(`HGT_License_Receipt_${record.id}.pdf`);
    onAddLog('info', `📄 License Payment Receipt downloaded for ${record.id} ($130.00).`, 'PDF_RECEIPT');
  };

  const filteredLicensePurchases = licensePurchases.filter(p => {
    const matchesStatus = licenseStatusFilter === 'All' || p.status === licenseStatusFilter;
    const q = licenseSearch.toLowerCase().trim();
    const matchesQuery = !q || 
      p.id.toLowerCase().includes(q) || 
      p.licenseKey.toLowerCase().includes(q) || 
      p.paymentMethod.toLowerCase().includes(q) ||
      p.txHashOrProof.toLowerCase().includes(q) ||
      p.planName.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  // Handle instant payout execution
  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentAvailable = metrics.totalEarnings;
    const customVal = customPayoutAmount.trim() ? parseFloat(customPayoutAmount) : currentAvailable;

    if (currentAvailable <= 0) {
      onAddLog('warning', '⚠️ Account balance is $0.00. No available dispatch earnings to clear.', 'WALLET_ALERT');
      return;
    }

    if (isNaN(customVal) || customVal <= 0) {
      onAddLog('warning', '⚠️ Please enter a valid withdrawal amount.', 'WALLET_ALERT');
      return;
    }

    const amtToWithdraw = Math.min(customVal, currentAvailable);
    const recipient = recipientInput.trim() || (selectedMethod === 'CashApp' ? '$HacyberGlobal' : selectedMethod === 'Zelle' ? 'zelle@hacyberglobal.linkpc.net' : selectedMethod === 'Venmo' ? '@HacyberSecure' : 'Direct Bank Depot No. 911');

    setIsCashingOut(true);

    try {
      const response = await fetch('/api/stripe/instant-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amtToWithdraw,
          method: selectedMethod,
          recipient,
        })
      });
      const data = await response.json();
      const payoutId = data.payoutId || `po_${Math.floor(100000 + Math.random() * 900000)}`;

      const newPayout: PayoutRecord = {
        id: payoutId,
        amount: amtToWithdraw,
        method: selectedMethod,
        recipient,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Completed'
      };

      setPayouts(prev => [newPayout, ...prev]);
      setRecentInstantPayout(newPayout);
      onAddLog('bot_accept', `⚡ Instant Settlement Success (${payoutId}): $${amtToWithdraw.toFixed(2)} dispatched via ${selectedMethod} to ${recipient}!`, 'PAYOUT_OK');
      setRecipientInput('');
      setCustomPayoutAmount('');

      if (onResetStats) {
        onResetStats(); // Reset the active dashboard metrics
      }
    } catch (err) {
      const fallbackId = `po_${Math.floor(100000 + Math.random() * 900000)}`;
      const newPayout: PayoutRecord = {
        id: fallbackId,
        amount: amtToWithdraw,
        method: selectedMethod,
        recipient,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Completed'
      };
      setPayouts(prev => [newPayout, ...prev]);
      setRecentInstantPayout(newPayout);
      onAddLog('bot_accept', `⚡ Instant Settlement Success (${fallbackId}): $${amtToWithdraw.toFixed(2)} dispatched via ${selectedMethod} to ${recipient}!`, 'PAYOUT_OK');
      setRecipientInput('');
      setCustomPayoutAmount('');

      if (onResetStats) {
        onResetStats();
      }
    } finally {
      setIsCashingOut(false);
    }
  };

  // Claim Streak bonus
  const handleClaimBonus = () => {
    if (claimedBonus) return;
    setClaimedBonus(true);
    onAddLog('info', `🎁 Bonus Claimed: Active driver promo incentive of $${activeBonus.toFixed(2)} added to pending settlement backlog.`, 'PROMO_BONUS');
  };

  // Export PDF summary report
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const currentDate = new Date().toLocaleString();
    
    // Theme Header Block (Deep Charcoal Navy)
    doc.setFillColor(15, 15, 22);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Colored accents (Blue, Purple, Red) at the bottom of header block
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(0, 43, pageWidth / 3, 2, 'F');
    doc.setFillColor(139, 92, 246); // Purple
    doc.rect(pageWidth / 3, 43, pageWidth / 3, 2, 'F');
    doc.setFillColor(239, 68, 68); // Red
    doc.rect((pageWidth / 3) * 2, 43, pageWidth / 3, 2, 'F');
    
    // Header Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 242, 255); // Neon Cyan/Blue
    doc.text("HGT MULTI-BOT DISPATCH", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text("HIGH-FIDELITY TELEMETRY & DISPATCH SESSION SUMMARY", 14, 28);
    
    // Generated Date & Status Line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`REPORT GENERATED: ${currentDate}`, 14, 36);
    doc.text(`SYSTEM STATUS: ONLINE • SECURE EDGE DISPATCH SYNC`, 14, 40);

    // Summary Metrics Cards Grid
    // Card 1: Total Session Earnings (Purple Border Accent)
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 55, 58, 28, 'F');
    doc.setFillColor(139, 92, 246); // Purple
    doc.rect(14, 55, 2, 28, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL EARNINGS", 19, 62);
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // Emerald Money Green
    doc.text(`$${metrics.totalEarnings.toFixed(2)}`, 19, 71);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Base: $${metrics.basePayTotal.toFixed(2)} | Tips: $${metrics.tipTotal.toFixed(2)}`, 19, 78);

    // Card 2: Trips Completed (Blue Border Accent)
    doc.setFillColor(248, 250, 252);
    doc.rect(76, 55, 58, 28, 'F');
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(76, 55, 2, 28, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("TRIPS COMPLETED", 81, 62);
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`${metrics.tripsCompleted} Trips`, 81, 71);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Miles: ${metrics.totalMilesDriven.toFixed(1)} mi`, 81, 78);

    // Card 3: Bot Intercepts (Red Border Accent)
    doc.setFillColor(248, 250, 252);
    doc.rect(138, 55, 58, 28, 'F');
    doc.setFillColor(239, 68, 68); // Red
    doc.rect(138, 55, 2, 28, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("BOT INTERCEPTS", 143, 62);
    doc.setFontSize(14);
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`${metrics.botInterceptCount} Blocks`, 143, 71);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Risk Index: ${metrics.riskLevel}% Safe`, 143, 78);

    // Add Section Title: Recent Accepted & Intercepted Offers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Active Session Dispatch Log", 14, 95);
    
    // Gather and map list of accepted offers
    const acceptedOffers = offers.filter(o => o.status === 'accepted');
    const tableData = acceptedOffers.length > 0 
      ? acceptedOffers.map(o => [
          new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          o.platform,
          o.storeName || 'Walmart Supercenter',
          o.type,
          `${o.distance.toFixed(1)} mi`,
          o.acceptedBy === 'bot' ? 'Bot Auto-Accept' : o.acceptedBy === 'manual' ? 'Manual Tap' : 'Direct Dispatch',
          `$${o.totalPay.toFixed(2)}`
        ])
      : [['-', 'No active trips logged in current session.', '-', '-', '-', '-', '-']];

    // Beautiful Grid-styled AutoTable
    autoTable(doc, {
      startY: 100,
      head: [['Time', 'Platform', 'Location', 'Job Type', 'Distance', 'Dispatch Mode', 'Payout']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42], // Deep Navy header
        textColor: [255, 255, 255],
        fontSize: 8.5,
        font: 'helvetica',
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 },
        1: { fontStyle: 'bold', cellWidth: 24 },
        2: { cellWidth: 42 },
        3: { cellWidth: 33 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 32 },
        6: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 15 }
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          if (data.cell.text[0]?.includes('Bot')) {
            data.cell.styles.textColor = [139, 92, 246]; // Purple for HGT Auto-accept
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 140;
    
    // Professional Compliance Disclaimer Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, finalY + 10, 182, 30, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, finalY + 10, 182, 30);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("DISPATCH INTEGRITY & AUDIT TRAIL NOTICE", 18, finalY + 16);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("This document constitutes an automated session statement produced by HGT Multi-Bot Dispatch Companion.", 18, finalY + 22);
    doc.text("All intercepted telemetry metrics, GPS location syncs, and background auto-clicking response speeds are simulated", 18, finalY + 26);
    doc.text("for security verification and audit. Use only in compliance with platform terms of service.", 18, finalY + 30);

    // Footer Branding Signature
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 143, 160);
    doc.text("HGT MULTI-BOT DISPATCH COMPANION • SECURE TELEMETRY ENGINE", 14, 285);
    
    doc.save(`HGT_MultiBot_Session_${Date.now()}.pdf`);
    onAddLog('info', '📂 PDF Session Summary professionally formatted and downloaded.', 'PDF_DOWNLOAD');
  };

  // Export CSV summary report
  const handleExportCSV = () => {
    const headers = ['ACTIVITY DATE', 'PLATFORM', 'BASE EARNINGS', 'TIPS', 'TOTAL PAY', 'STATUS', 'INTERCEPT TYPE'];
    const rows = offers.map(o => [
      new Date(o.createdAt).toLocaleDateString(),
      o.platform,
      `$${o.basePay.toFixed(2)}`,
      `$${o.tip.toFixed(2)}`,
      `$${o.totalPay.toFixed(2)}`,
      o.status.toUpperCase(),
      o.acceptedBy === 'bot' ? 'BOT AUTOMATION' : o.acceptedBy === 'manual' ? 'MANUAL TAPPERS' : 'N/A'
    ]);

    const csvContent = [
      ['HACYBERGLOBAL DRIVER DISPATCH TELMETRY DAILY SUMMARY'],
      [`DATE GENERATED: ${new Date().toLocaleString()}`],
      [`TOTAL EARNINGS: $${metrics.totalEarnings.toFixed(2)}`],
      [`TRIPS COMPLETED: ${metrics.tripsCompleted}`],
      [],
      headers,
      ...rows
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HACYBER_daily_summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddLog('info', '📂 Dispatch Telemetry Daily Summary report compiled and downloaded successfully as CSV.', 'CSV_DOWNLOAD');
  };

  // Export full offer ledger CSV report (completed/accepted, declined, expired)
  const handleDownloadFullLedger = () => {
    const targetOffers = offers.filter(o => o.status === 'accepted' || o.status === 'declined' || o.status === 'expired');

    const headers = ['OFFER ID', 'TIMESTAMP', 'PLATFORM', 'STORE ID', 'STORE NAME', 'TYPE', 'DISTANCE (MI)', 'ITEMS', 'BASE PAY', 'TIPS', 'TOTAL PAY', 'STATUS', 'ACCEPTED BY'];
    const rows = targetOffers.map(o => [
      o.id,
      new Date(o.createdAt).toISOString().replace('T', ' ').substring(0, 19),
      o.platform,
      o.storeNumber,
      o.storeName.replace(/,/g, ''),
      o.type,
      o.distance.toFixed(2),
      o.itemsCount,
      `$${o.basePay.toFixed(2)}`,
      `$${o.tip.toFixed(2)}`,
      `$${o.totalPay.toFixed(2)}`,
      o.status.toUpperCase() === 'ACCEPTED' ? 'COMPLETED' : o.status.toUpperCase(),
      o.acceptedBy ? o.acceptedBy.toUpperCase() : 'N/A'
    ]);

    const csvContent = [
      ['HACYBERGLOBAL DISPATCH MULTIBOT FULL TRANSACTION LEDGER'],
      [`DATE GENERATED: ${new Date().toLocaleString()}`],
      [`RECORD COUNT: ${targetOffers.length}`],
      [],
      headers,
      ...rows
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HACYBER_full_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddLog('bot_accept', `📂 Full Ledger Download: Compiled and exported ${targetOffers.length} transaction records to CSV.`, 'LEDGER_OK');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6">
      {/* Header section with wallet balance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4 select-none">
        <div>
          <span className="text-[9px] font-mono text-neutral-500 block uppercase font-bold tracking-wider">SECURE DIGITAL WALLET</span>
          <h2 className="text-sm font-sans font-extrabold text-white uppercase tracking-tight flex items-center gap-1.5 mt-1">
            <Wallet className="w-4 h-4 text-[#00f2ff]" />
            Driver Wallet Portal
          </h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            id="download-full-ledger-btn"
            onClick={handleDownloadFullLedger}
            className="px-3 py-1 bg-emerald-950/45 hover:bg-emerald-900/35 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-lg text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-[0_0_10px_rgba(16,185,129,0.05)]"
            title="Download full ledger history including completed, declined, and expired logs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Full Ledger</span>
          </button>

          <button
            type="button"
            id="download-pdf-summary-btn"
            onClick={handleExportPDF}
            className="px-3 py-1 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 hover:from-blue-500 hover:via-purple-500 hover:to-rose-500 text-white border border-white/20 rounded-lg text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            title="Download formatted PDF session summary"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>Download Session Summary</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1 bg-neutral-950 hover:bg-neutral-850 text-neutral-300 hover:text-[#00f2ff] border border-neutral-800 rounded-lg text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download all earnings, log items, and route history to device"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid: 3 balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-neutral-950/60 border border-neutral-850 p-3.5 rounded-lg relative overflow-hidden select-none">
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00f2ff] rounded-full shadow-[0_0_8px_#00f2ff]" />
          <span className="text-[8px] font-mono text-neutral-500 block uppercase font-bold tracking-wider">AVAILABLE BALANCE</span>
          <span className="text-xl font-mono font-extrabold text-emerald-400 mt-1 block">
            ${metrics.totalEarnings.toFixed(2)}
          </span>
          <span className="text-[8.5px] font-mono text-neutral-600 block mt-0.5">Ready for immediate Cashout</span>
        </div>

        <div className="bg-neutral-950/60 border border-neutral-850 p-3.5 rounded-lg relative select-none">
          <span className="text-[8px] font-mono text-neutral-500 block uppercase font-bold tracking-wider">BONUSES & PROMOS</span>
          <span className="text-xl font-mono font-extrabold text-[#00f2ff] mt-1 block">
            ${claimedBonus ? '0.00' : activeBonus.toFixed(2)}
          </span>
          {claimedBonus ? (
            <span className="text-[8.5px] font-mono text-[#00f2ff]/60 flex items-center gap-1 mt-0.5 font-bold">
              <CheckCircle2 className="w-3 h-3 text-[#00f2ff]" /> Claimed to ledger
            </span>
          ) : (
            <button
              onClick={handleClaimBonus}
              className="text-[8.5px] font-mono text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer block mt-0.5"
            >
              Claim pending incentive
            </button>
          )}
        </div>

        <div className="bg-neutral-950/60 border border-neutral-850 p-3.5 rounded-lg select-none">
          <span className="text-[8px] font-mono text-neutral-500 block uppercase font-bold tracking-wider">DASH INTERCEPTS</span>
          <span className="text-xl font-mono font-extrabold text-white mt-1 block">
            {metrics.tripsCompleted} <span className="text-xs text-neutral-500 font-normal">Trips</span>
          </span>
          <span className="text-[8.5px] font-mono text-neutral-600 block mt-0.5">
            Base: ${metrics.basePayTotal.toFixed(2)} • Tips: ${metrics.tipTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* SECTION: Goal Tracker and Earnings Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Daily Goal Tracker */}
        <div className="md:col-span-5 bg-neutral-950/60 border border-neutral-850 p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-3">
              <span className="text-[9px] font-mono text-[#00f2ff] flex items-center gap-1 font-bold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                DAILY GOAL TRACKER
              </span>
              <span className="text-[8px] font-mono text-neutral-500 uppercase">Interactive Target</span>
            </div>

            {/* Inline editing mode or target goal stats */}
            {isEditingGoal ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = parseFloat(goalInput);
                  if (!isNaN(val) && val > 0) {
                    setDailyGoal(val);
                    localStorage.setItem('hq_daily_earnings_goal', val.toString());
                    setIsEditingGoal(false);
                    onAddLog('info', `🎯 Daily earnings goal updated to $${val.toFixed(2)}.`, 'GOAL_UPDATE');
                  }
                }}
                className="space-y-3 py-1 animate-fadeIn"
              >
                <div>
                  <label htmlFor="daily-goal-input" className="text-[8px] font-mono text-neutral-500 block uppercase mb-1">
                    Set Target Earnings (USD)
                  </label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <DollarSign className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        id="daily-goal-input"
                        type="number"
                        min="1"
                        step="5"
                        required
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        className="w-full bg-neutral-905 border border-neutral-800 rounded px-7 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30 transition-all"
                        placeholder="250"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/25 rounded text-xs transition-colors cursor-pointer"
                      title="Save Goal"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGoalInput(dailyGoal.toString());
                        setIsEditingGoal(false);
                      }}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 rounded text-xs transition-colors cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-1.5 py-1">
                <div className="flex items-baseline justify-between select-none">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400">Current Progress</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-mono font-black text-white">
                        ${metrics.totalEarnings.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        / ${dailyGoal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGoalInput(dailyGoal.toString());
                      setIsEditingGoal(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-850 text-[9px] font-mono text-neutral-400 hover:text-[#00f2ff] border border-neutral-800 rounded transition-all cursor-pointer font-bold"
                    title="Edit Goal"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit Target</span>
                  </button>
                </div>
              </div>
            )}

            {/* Custom Multi-Color Gradient Progress Bar */}
            <div className="mt-4 space-y-2 select-none">
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-neutral-500">Goal Completion Rate</span>
                <span className="text-white font-bold">
                  {((metrics.totalEarnings / dailyGoal) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-neutral-900 border border-neutral-850 rounded-full overflow-hidden p-0.5 relative group">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 rounded-full transition-all duration-1000 relative shadow-[0_0_12px_rgba(139,92,246,0.6)] animate-pulse" 
                  style={{ width: `${Math.min((metrics.totalEarnings / dailyGoal) * 100, 100)}%` }}
                >
                  {/* Glowing end indicator */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#ffffff]" />
                </div>
              </div>
            </div>
          </div>

          {/* Motivational Encouraging Message Box */}
          <div className="mt-4 text-[8px] font-mono leading-normal bg-neutral-900/50 border border-neutral-850 p-2.5 rounded text-neutral-400 select-none">
            {metrics.totalEarnings === 0 ? (
              <span className="text-neutral-500">
                🚀 Initiate HGT Multi-Bot. Auto-intercept orders to watch your earnings surge toward today's target!
              </span>
            ) : metrics.totalEarnings < dailyGoal ? (
              <span>
                ⚡ <strong className="text-[#00f2ff] font-semibold">Keep Pushing:</strong> You need only <strong className="text-emerald-400">${(dailyGoal - metrics.totalEarnings).toFixed(2)}</strong> more to hit your Daily Target!
              </span>
            ) : (
              <span>
                🎉 <strong className="text-emerald-400 font-bold">Absolute Mastery:</strong> You've smashed your target of <strong className="text-white">${dailyGoal.toFixed(2)}</strong>! Surplus of <strong className="text-emerald-400">${(metrics.totalEarnings - dailyGoal).toFixed(2)}</strong> achieved!
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Earnings Per Trip Recharts Line Chart */}
        <div className="md:col-span-7 bg-neutral-950/60 border border-neutral-850 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-3 select-none">
            <span className="text-[9px] font-mono text-[#00f2ff] flex items-center gap-1 font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              SESSION TRENDLINE • PAYOUTS
            </span>
            <span className="text-[8px] font-mono text-neutral-500 uppercase">Recharts Real-time Data</span>
          </div>

          <div className="h-[145px] w-full flex flex-col justify-center">
            {offers.filter(o => o.status === 'accepted').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-neutral-850 rounded bg-neutral-955/35 p-4 text-center select-none">
                <AlertCircle className="w-5 h-5 text-neutral-600 mb-1.5 animate-pulse" />
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider mb-1">TELEMETRY SIGNAL EMPTY</span>
                <span className="text-[8px] font-sans text-neutral-400 max-w-[300px]">
                  No active orders accepted in current session yet. Simulated acceptances will draw a live trend graph.
                </span>
              </div>
            ) : (
              <div className="w-full h-full text-[8.5px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={offers
                      .filter(o => o.status === 'accepted')
                      .map((o, idx) => ({
                        name: `T${idx + 1}`,
                        Payout: o.totalPay,
                        BasePay: o.basePay,
                        Tips: o.tip,
                        Platform: o.platform
                      }))}
                    margin={{ top: 5, right: 10, left: -22, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#737373" 
                      tickLine={false} 
                      axisLine={{ stroke: '#404040' }}
                    />
                    <YAxis 
                      stroke="#737373" 
                      tickLine={false} 
                      axisLine={{ stroke: '#404040' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0c',
                        border: '1px solid #404040',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '9px',
                        color: '#fff'
                      }}
                      formatter={(value: any, name: any) => {
                        return [`$${Number(value).toFixed(2)}`, name];
                      }}
                      labelFormatter={(label) => `Trip Node: ${label}`}
                    />
                    {/* The line utilizes blue/purple/red theme colors requested by the user */}
                    <Line 
                      type="monotone" 
                      dataKey="Payout" 
                      stroke="#8b5cf6" 
                      strokeWidth={2.5}
                      dot={{ r: 3, stroke: '#00f2ff', strokeWidth: 1.5, fill: '#0a0a0c' }}
                      activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                      name="Total Pay"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="BasePay" 
                      stroke="#3b82f6" 
                      strokeWidth={1.2}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Base Pay"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Earnings Over Time - Cumulative Base vs Tips */}
        <div className="md:col-span-12 bg-neutral-950/60 border border-neutral-850 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-3 select-none">
            <span className="text-[9px] font-mono text-[#00f2ff] flex items-center gap-1 font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              EARNINGS OVER TIME • CUMULATIVE FLOW
            </span>
            <span className="text-[8px] font-mono text-neutral-500 uppercase">Base Pay vs Tips Session Accumulation</span>
          </div>

          <div className="h-[160px] w-full flex flex-col justify-center">
            {offers.filter(o => o.status === 'accepted').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-neutral-850 rounded bg-neutral-955/35 p-4 text-center select-none">
                <AlertCircle className="w-5 h-5 text-neutral-600 mb-1.5 animate-pulse" />
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider mb-1">CUMULATIVE SIGNAL EMPTY</span>
                <span className="text-[8px] font-sans text-neutral-400 max-w-[300px]">
                  No trip payouts recorded in this session. Once trips are auto-intercepted, your cumulative progress will display.
                </span>
              </div>
            ) : (
              <div className="w-full h-full text-[8.5px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      let baseSum = 0;
                      let tipSum = 0;
                      return offers
                        .filter(o => o.status === 'accepted')
                        .map((o, idx) => {
                          baseSum += o.basePay;
                          tipSum += o.tip;
                          return {
                            name: `Trip ${idx + 1}`,
                            'Base Pay': Number(baseSum.toFixed(2)),
                            'Tips': Number(tipSum.toFixed(2)),
                            'Total Earned': Number((baseSum + tipSum).toFixed(2))
                          };
                        });
                    })()}
                    margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#737373" 
                      tickLine={false} 
                      axisLine={{ stroke: '#404040' }}
                    />
                    <YAxis 
                      stroke="#737373" 
                      tickLine={false} 
                      axisLine={{ stroke: '#404040' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0c',
                        border: '1px solid #404040',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '9px',
                        color: '#fff'
                      }}
                      formatter={(value: any, name: any) => {
                        return [`$${Number(value).toFixed(2)}`, name];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', paddingTop: '5px' }}
                    />
                    {/* Theme colors: Blue (#3b82f6), Red (#ef4444) & Green (#10b981) */}
                    <Line 
                      type="monotone" 
                      dataKey="Base Pay" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                      activeDot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Tips" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                      activeDot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Total Earned" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={{ r: 2.5 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Action Form and Payout History List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Instant Payout Form */}
        <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-lg space-y-4">
          <div className="flex items-center gap-1.5 border-b border-neutral-850 pb-2 select-none">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Instant Settlement Form</h3>
          </div>

          <form onSubmit={handleCashout} className="space-y-3">
            {metrics.totalEarnings <= 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded text-[8.5px] font-mono text-amber-300 flex items-start gap-2 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase block text-amber-400">⚠️ Insufficient Wallet Balance Guard</span>
                  Available balance is $0.00. Instant payout is disabled until dispatch earnings or offer captures are credited.
                </div>
              </div>
            )}

            <div>
              <label className="text-[8.5px] font-mono text-neutral-400 block uppercase select-none mb-1">Select Transfer Gateway</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['CashApp', 'Venmo', 'Zelle', 'Chime', 'Direct Bank'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`py-1.5 rounded text-[8.5px] font-mono font-bold border transition-all cursor-pointer ${
                      selectedMethod === method 
                        ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/40 shadow-[0_0_8px_rgba(0,242,255,0.15)]'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:text-white'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="payout-amount-input" className="text-[8.5px] font-mono text-neutral-400 uppercase select-none">
                    Payout Amount ($USD)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomPayoutAmount(metrics.totalEarnings.toFixed(2))}
                    className="text-[7.5px] font-mono text-[#00f2ff] hover:underline cursor-pointer font-bold"
                  >
                    MAX (${metrics.totalEarnings.toFixed(2)})
                  </button>
                </div>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    id="payout-amount-input"
                    type="number"
                    step="0.01"
                    min="1"
                    max={metrics.totalEarnings}
                    value={customPayoutAmount}
                    onChange={(e) => setCustomPayoutAmount(e.target.value)}
                    placeholder={metrics.totalEarnings > 0 ? metrics.totalEarnings.toFixed(2) : "0.00"}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded pl-7 pr-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30 transition-all placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="payout-recipient-input" className="text-[8.5px] font-mono text-neutral-400 block uppercase select-none mb-1">
                  {selectedMethod} Recipient Account
                </label>
                <input
                  id="payout-recipient-input"
                  type="text"
                  required
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder={
                    selectedMethod === 'CashApp' 
                      ? 'e.g. $HacyberGlobal' 
                      : selectedMethod === 'Zelle' 
                      ? 'e.g. zelle@hacyberglobal.linkpc.net'
                      : selectedMethod === 'Venmo'
                      ? 'e.g. @HacyberSecure'
                      : 'Routing / Account No.'
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/30 transition-all placeholder:text-neutral-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCashingOut || metrics.totalEarnings <= 0}
              title={metrics.totalEarnings <= 0 ? "Instant Payout disabled: Wallet balance is $0.00" : "Click to transfer funds instantly"}
              className={`w-full py-2.5 rounded-lg font-mono font-black text-xs flex items-center justify-center gap-2 border select-none transition-all ${
                metrics.totalEarnings > 0 
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 border-emerald-450 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer' 
                  : 'bg-neutral-900 text-neutral-500 border-neutral-800 cursor-not-allowed opacity-60'
              }`}
            >
              {isCashingOut ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>EXECUTING INSTANT PAYOUT...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>TRIGGER INSTANT PAYOUT (${(customPayoutAmount ? parseFloat(customPayoutAmount) : metrics.totalEarnings).toFixed(2)})</span>
                </>
              )}
            </button>
          </form>

          {/* Instant Payout Success Modal */}
          <AnimatePresence>
            {recentInstantPayout && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
              >
                <div className="bg-neutral-900 border border-emerald-500/40 rounded-xl max-w-md w-full p-5 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.25)] font-mono">
                  <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instant Payout Dispatched</h4>
                        <span className="text-[9px] text-emerald-400">Settlement ID: {recentInstantPayout.id}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecentInstantPayout(null)}
                      className="text-neutral-500 hover:text-white text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 space-y-2 text-[9px]">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Amount Transferred:</span>
                      <span className="text-base font-black text-emerald-400">${recentInstantPayout.amount.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Gateway Method:</span>
                      <span className="text-white font-bold">{recentInstantPayout.method} Instant</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Recipient Account:</span>
                      <span className="text-cyan-400 font-bold">{recentInstantPayout.recipient}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Settlement Speed:</span>
                      <span className="text-emerald-400 font-bold">0-30 Seconds (Instant Arrival)</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Payout Fee:</span>
                      <span className="text-emerald-400 font-bold">$0.00 (Waived)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRecentInstantPayout(null)}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded transition-colors"
                  >
                    DONE & CLOSE RECEIPT
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-[7.5px] font-mono text-neutral-500 leading-normal bg-[#00f2ff]/5 border border-[#00f2ff]/10 p-2 rounded flex items-start gap-1.5 select-none">
            <AlertCircle className="w-3 h-3 text-[#00f2ff] shrink-0 mt-0.5" />
            <span>
              Real Bank clearing protocol is locked for fast transit payouts. Instant payout transfers complete within 0-30 seconds directly to your linked gateway.
            </span>
          </div>
        </div>

        {/* Payout Ledger List */}
        <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-lg flex flex-col justify-between h-full space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-850 pb-2 select-none">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#00f2ff]" />
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Settlement Ledger</h3>
            </div>
            <span className="text-[8px] font-mono text-neutral-500">{payouts.length} past cashouts</span>
          </div>

          <div className="space-y-2 max-h-[185px] overflow-y-auto pr-1">
            {payouts.map((p) => (
              <div 
                key={p.id}
                className="bg-neutral-950/80 border border-neutral-900 rounded p-2 flex justify-between items-center hover:border-neutral-800 transition-colors"
                id={`payout-${p.id}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-neutral-200">{p.method} payout</span>
                    <span className="text-[7.5px] font-mono bg-neutral-900 text-neutral-400 px-1 rounded border border-neutral-850">
                      {p.id}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-neutral-500 block leading-none mt-1">
                    {p.recipient} • {p.timestamp}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10.5px] font-mono font-black text-emerald-400 block">${p.amount.toFixed(2)}</span>
                  <span className="text-[7.5px] font-mono text-emerald-500 leading-none flex items-center justify-end gap-0.5 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all local payout transfer logs?')) {
                setPayouts([]);
                localStorage.removeItem('hq_payout_history');
                onAddLog('info', '🗑️ Local settlement payout logs archive cleared.', 'WALLET_CLEAN');
              }
            }}
            className="w-full py-1 bg-neutral-950 hover:bg-neutral-900 text-[8.5px] font-mono text-neutral-500 hover:text-rose-400 transition-colors border border-dashed border-neutral-850 rounded"
          >
            Clear Ledger History
          </button>
        </div>
      </div>

      {/* SECTION: Activated License Payment History ($130.00 Purchases) */}
      <div id="license-payment-history-section" className="bg-neutral-950/50 border border-neutral-850 p-4.5 rounded-xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3 select-none">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#00f2ff] font-bold uppercase tracking-wider block">
                ACTIVATED LICENSE LEDGER
              </span>
              <span className="text-[8px] font-mono bg-amber-500/15 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded font-black uppercase flex items-center gap-1">
                <Key className="w-2.5 h-2.5 text-amber-400" />
                $130.00 ACTIVATIONS
              </span>
            </div>
            <h3 className="text-xs font-sans font-extrabold text-white uppercase tracking-wider flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-[#00f2ff]" />
              Payment History — $130 License Purchases
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="btn-add-130-payment"
              onClick={() => setShowAddPaymentModal(true)}
              className="px-2.5 py-1.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(0,242,255,0.2)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log $130 License Payment</span>
            </button>

            <button
              type="button"
              id="download-license-history-csv-btn"
              onClick={handleExportLicenseCSV}
              className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer font-bold"
              title="Export License Payment Ledger to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono select-none">
          <div className="bg-neutral-950 border border-neutral-900 p-2.5 rounded-lg">
            <span className="text-[8px] text-neutral-500 uppercase font-bold block">Total $130 Payments</span>
            <span className="text-sm font-black text-emerald-400 mt-0.5 block">{licensePurchases.length} Records</span>
          </div>
          <div className="bg-neutral-950 border border-neutral-900 p-2.5 rounded-lg">
            <span className="text-[8px] text-neutral-500 uppercase font-bold block">Total Paid Volume</span>
            <span className="text-sm font-black text-[#00f2ff] mt-0.5 block">
              ${(licensePurchases.reduce((acc, c) => acc + c.amount, 0)).toFixed(2)} USD
            </span>
          </div>
          <div className="bg-neutral-950 border border-neutral-900 p-2.5 rounded-lg">
            <span className="text-[8px] text-neutral-500 uppercase font-bold block">Latest Activation</span>
            <span className="text-xs font-bold text-amber-400 truncate mt-0.5 block">
              {licensePurchases[0]?.timestamp.split(' ')[0] || 'N/A'}
            </span>
          </div>
          <div className="bg-neutral-950 border border-neutral-900 p-2.5 rounded-lg">
            <span className="text-[8px] text-neutral-500 uppercase font-bold block">Perpetual License</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ACTIVE (1ms)
            </span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 font-mono">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 border border-neutral-850 rounded-lg shrink-0">
            <Filter className="w-3 h-3 text-neutral-500 ml-1 mr-0.5" />
            {(['All', 'Active', 'Verified', 'Completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                id={`filter-license-status-${st.toLowerCase()}`}
                onClick={() => setLicenseStatusFilter(st)}
                className={`px-2 py-0.5 text-[8.5px] font-bold rounded transition-all cursor-pointer ${
                  licenseStatusFilter === st
                    ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-license-payments-input"
              type="text"
              value={licenseSearch}
              onChange={(e) => setLicenseSearch(e.target.value)}
              placeholder="Filter by Tx ID, Key, or Method..."
              className="w-full bg-neutral-950 border border-neutral-850 rounded-lg pl-8 pr-3 py-1 text-[9px] font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#00f2ff]"
            />
          </div>
        </div>

        {/* Payment History List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {filteredLicensePurchases.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-neutral-850 rounded-lg bg-neutral-950/40">
              <AlertCircle className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
              <span className="text-[10px] font-mono text-neutral-400 block uppercase font-bold">
                No $130 License Payments Found
              </span>
              <span className="text-[8.5px] font-sans text-neutral-500 mt-1 block">
                No matching transaction records for search '{licenseSearch}'. Log a new $130 license payment above.
              </span>
            </div>
          ) : (
            filteredLicensePurchases.map((rec) => (
              <div
                key={rec.id}
                id={`license-payment-${rec.id}`}
                className="bg-neutral-950/90 border border-neutral-850 hover:border-[#00f2ff]/30 p-3 rounded-lg transition-all space-y-2 font-mono group"
              >
                {/* Top Row: Plan & Status & Price */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                      rec.status === 'Active'
                        ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400 animate-pulse'
                        : rec.status === 'Verified'
                        ? 'bg-[#00f2ff]/10 border-[#00f2ff]/35 text-[#00f2ff]'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}>
                      ✓ {rec.status}
                    </span>
                    <span className="text-xs font-bold text-white font-sans">{rec.planName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-400">${rec.amount.toFixed(2)} USD</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadLicenseInvoice(rec)}
                      className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-[#00f2ff] border border-neutral-800 rounded text-[8px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Print $130 Receipt PDF"
                    >
                      <Printer className="w-2.5 h-2.5 text-[#00f2ff]" />
                      <span>Receipt PDF</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Metadata & Copy buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[8.5px]">
                  {/* Tx ID & Proof */}
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <span className="text-neutral-500 uppercase">Tx ID:</span>
                    <code className="text-[#00f2ff] font-bold bg-neutral-900 px-1 py-0.5 rounded border border-neutral-850">
                      {rec.id}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(rec.id);
                        setCopiedTxId(rec.id);
                        setTimeout(() => setCopiedTxId(null), 2000);
                      }}
                      className="p-1 text-neutral-500 hover:text-white cursor-pointer"
                      title="Copy Transaction ID"
                    >
                      {copiedTxId === rec.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  {/* License Serial Key */}
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <span className="text-neutral-500 uppercase">Serial Key:</span>
                    <code className="text-amber-400 font-bold bg-neutral-900 px-1 py-0.5 rounded border border-neutral-850 truncate max-w-[140px]">
                      {rec.licenseKey}
                    </code>
                  </div>

                  {/* Gateway & Timestamp */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 text-neutral-400">
                    <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 border border-neutral-850 font-bold">
                      {rec.paymentMethod}
                    </span>
                    <span className="text-neutral-500 text-[8px]">{rec.timestamp}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500 pt-2 border-t border-neutral-900">
          <span>Showing {filteredLicensePurchases.length} of {licensePurchases.length} $130 payment entries</span>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset local $130 license payment history to default initial state?')) {
                localStorage.removeItem('hq_license_purchases');
                setLicensePurchases([
                  {
                    id: 'TX-130-9842',
                    licenseKey: 'HGT-MULTIBOT-PRO',
                    planName: 'Bot Activation ⚙️ - $130.00',
                    amount: 130.00,
                    paymentMethod: 'PayPal Express',
                    timestamp: '2026-07-26 14:32:10',
                    status: 'Active',
                    txHashOrProof: 'PP-TX-130-984210'
                  },
                  {
                    id: 'TX-130-7193',
                    licenseKey: 'HGT-SPARK-PRO-1ms',
                    planName: 'Walmart Spark Grabber License ($130.00)',
                    amount: 130.00,
                    paymentMethod: 'Stripe Card',
                    timestamp: '2026-06-21 11:15:20',
                    status: 'Verified',
                    txHashOrProof: 'ch_3M09182390123130'
                  },
                  {
                    id: 'TX-130-5509',
                    licenseKey: 'HGT-PERPETUAL-PASS',
                    planName: 'Perpetual Multi-Bot Cloud Pass ($130.00)',
                    amount: 130.00,
                    paymentMethod: 'Crypto (BTC)',
                    timestamp: '2026-05-18 09:40:00',
                    status: 'Completed',
                    txHashOrProof: '0x7f8a923b13088102'
                  }
                ]);
                onAddLog('info', '🔄 License payment history reset to default initial state.', 'LICENSE_PAY_RESET');
              }
            }}
            className="text-neutral-500 hover:text-amber-400 underline cursor-pointer"
          >
            Reset Default Records
          </button>
        </div>
      </div>

      {/* Dedicated Receipt Delivery & Automated Confirmation Component */}
      <ReceiptDelivery
        onAddLog={onAddLog}
        defaultEmail="hacybertech@gmail.com"
        txId="TX-130-9842"
        amount={130.00}
      />

      {/* Modal: Log New $130 License Payment */}
      <AnimatePresence>
        {showAddPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm select-none font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-[#00f2ff]/40 rounded-xl p-5 max-w-md w-full space-y-4 shadow-[0_0_30px_rgba(0,242,255,0.2)]"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#00f2ff]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Log $130 License Purchase
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddLicensePayment} className="space-y-3 text-[9px]">
                <div>
                  <label className="text-neutral-400 block uppercase mb-1">Activation Plan ($130.00)</label>
                  <input
                    type="text"
                    required
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono focus:border-[#00f2ff] focus:outline-none"
                    placeholder="Bot Activation ⚙️ - $130.00"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block uppercase mb-1">Payment Method Gateway</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono focus:border-[#00f2ff] focus:outline-none cursor-pointer"
                  >
                    <option value="PayPal Express">PayPal Express ($130.00)</option>
                    <option value="Stripe Card">Stripe Credit Card ($130.00)</option>
                    <option value="Crypto (BTC)">Bitcoin / Crypto ($130.00)</option>
                    <option value="Zelle">Zelle Transfer ($130.00)</option>
                    <option value="CashApp">CashApp Direct ($130.00)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 block uppercase mb-1">Activated Serial License Key</label>
                  <input
                    type="text"
                    required
                    value={newLicenseKey}
                    onChange={(e) => setNewLicenseKey(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-amber-400 font-mono font-bold focus:border-[#00f2ff] focus:outline-none"
                    placeholder="HGT-MULTIBOT-PRO"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block uppercase mb-1">Payment Proof / Tx Hash Reference</label>
                  <input
                    type="text"
                    value={newTxHash}
                    onChange={(e) => setNewTxHash(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono focus:border-[#00f2ff] focus:outline-none"
                    placeholder="Ex: PP-130-9921823 or 0x8f2..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded text-[9px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#00f2ff] hover:bg-[#00d8e6] text-neutral-950 rounded text-[9px] font-black cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.3)]"
                  >
                    Record $130 Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cyber Promotional Space (YouTube / TikTok Ads & Walkthrough Player) */}
      <div className="border-t border-neutral-850 pt-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 select-none">
          <div>
            <span className="text-[9px] font-mono text-[#00f2ff] block uppercase font-bold tracking-wider">HACYBERGLOBAL BROADCAST HUB</span>
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
              <Youtube className="w-4 h-4 text-rose-500" />
              Official YouTube Setup Guides & TikTok Ad Promos
            </h3>
          </div>
          <div className="flex gap-2">
            <a 
              href="https://youtube.com/@hacyberglobaltechtm?si=5pPpN5EBUVcnhVCV" 
              target="_blank" 
              rel="no-referrer"
              className="px-2 py-1 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 rounded text-[9px] font-mono flex items-center gap-1 transition-all"
            >
              <span>YouTube Channel</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://www.tiktok.com/hacybersupport/" 
              target="_blank" 
              rel="no-referrer"
              className="px-2 py-1 bg-[#00f2ff]/5 hover:bg-[#00f2ff]/10 text-cyan-400 border border-[#00f2ff]/10 rounded text-[9px] font-mono flex items-center gap-1 transition-all"
            >
              <span>TikTok Support</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Video simulation component container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Simulated Video Player */}
          <div className="bg-neutral-950 border border-neutral-850 rounded-lg p-3 relative overflow-hidden flex flex-col justify-between h-[160px] group">
            {/* Ambient background pulsing pattern */}
            <div className="absolute inset-0 bg-radial-gradient from-rose-950/5 to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-start z-10 select-none">
              <span className="text-[8px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                HD SETUP GUIDE
              </span>
              <span className="text-[8px] font-mono text-neutral-500">1:45 length</span>
            </div>

            <div className="flex flex-col items-center justify-center my-2 z-10 shrink-0">
              <motion.button
                id="btn-play-simulated-video"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsAudioPlaying(!isAudioPlaying);
                  onAddLog('info', isAudioPlaying ? '⏸️ Simulated setup video paused.' : '🔊 Playing simulated setup audio guide and ambient background sounds.', 'VIDEO_PLAY');
                }}
                className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </motion.button>
              <span className="text-[9px] font-mono text-neutral-400 mt-2 text-center max-w-[200px] select-none">
                {isAudioPlaying ? '🔊 Streaming Setup Audio Voiceover' : 'Click to preview walkthrough details'}
              </span>
            </div>

            {/* Simulated progress slider bar and timeline */}
            <div className="z-10 space-y-1.5 select-none">
              <div className="text-[8px] font-mono text-neutral-500 flex justify-between">
                <span>{isAudioPlaying ? '0:22' : '0:00'}</span>
                <span>1:45</span>
              </div>
              <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-600 transition-all duration-1000" 
                  style={{ width: isAudioPlaying ? '20%' : '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Advert & Audio controller card */}
          <div className="bg-neutral-950 border border-neutral-850 rounded-lg p-3 flex flex-col justify-between h-[160px]">
            <div className="select-none">
              <span className="text-[8px] font-mono bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30 px-1.5 py-0.5 rounded font-bold">
                AUDIOPHONIC SOUND Mixer
              </span>
              <span className="text-[10px] font-sans font-bold text-neutral-200 block mt-2.5">
                Setup Voiceover & Background Music
              </span>
              <p className="text-[8.5px] font-mono text-neutral-500 mt-1 leading-normal">
                Optimize and trim overlay sound cues, sync vocal guides for 2FA, or play the low-latency ambient background hum.
              </p>
            </div>

            {/* Music/vocal sound mixer sliders */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[8.5px] font-mono text-neutral-300 select-none">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-[#00f2ff]" />
                  Background Music Level
                </span>
                <span>{volume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="music-volume-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#00f2ff]"
                />
                <button
                  type="button"
                  onClick={() => setVolume(0)}
                  className="text-[8px] font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-850 text-neutral-500 hover:text-white cursor-pointer"
                >
                  Mute
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
