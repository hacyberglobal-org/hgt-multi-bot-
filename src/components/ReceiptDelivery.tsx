import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, RefreshCw, ShieldCheck, Sparkles, Clock, FileText, AlertCircle, Edit3, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReceiptDeliveryProps {
  onAddLog?: (type: string, message: string, detail?: string, code?: string) => void;
  defaultEmail?: string;
  txId?: string;
  amount?: number;
}

export default function ReceiptDelivery({
  onAddLog,
  defaultEmail = 'hacybertech@gmail.com',
  txId = 'TX-130-9842',
  amount = 130.00
}: ReceiptDeliveryProps) {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('hgt_receipt_delivery_email') || defaultEmail;
  });
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState(email);
  const [isResending, setIsResending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dispatchHistory, setDispatchHistory] = useState<Array<{ id: string; timestamp: string; email: string; status: string }>>([
    {
      id: txId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      email: localStorage.getItem('hgt_receipt_delivery_email') || defaultEmail,
      status: 'DELIVERED'
    }
  ]);

  useEffect(() => {
    localStorage.setItem('hgt_receipt_delivery_email', email);
  }, [email]);

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail || !tempEmail.includes('@')) return;
    setEmail(tempEmail);
    setIsEditingEmail(false);
    if (onAddLog) {
      onAddLog('info', `📧 Receipt Delivery Email updated to: ${tempEmail}`, undefined, 'EMAIL_UPDATED');
    }
  };

  const handleResendReceipt = () => {
    if (isResending) return;
    setIsResending(true);
    
    setTimeout(() => {
      setIsResending(false);
      const newTxRef = `TX-130-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Add to dispatch history
      setDispatchHistory(prev => [
        {
          id: newTxRef,
          timestamp: nowStr,
          email: email,
          status: 'DELIVERED'
        },
        ...prev
      ]);

      // Show confirmation toast
      setToastMessage(`Automated $${amount.toFixed(2)} License Receipt successfully dispatched to ${email}! (Ref: #${newTxRef})`);
      setShowToast(true);

      if (onAddLog) {
        onAddLog('bot_accept', `📧 RECEIPT RESENT: $${amount.toFixed(2)} License activation receipt sent to ${email} (Tx: #${newTxRef}).`, undefined, 'RCPT_RESENT_OK');
      }

      // Auto dismiss toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }, 1200);
  };

  return (
    <div id="receipt-delivery-component" className="bg-neutral-950/80 border border-neutral-850 hover:border-[#00f2ff]/40 rounded-xl p-4 sm:p-5 space-y-4 font-mono shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all relative overflow-hidden">
      {/* Background Cyber Accent Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00f2ff]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-850 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#00f2ff]/10 border border-[#00f2ff]/30 rounded-lg text-[#00f2ff]">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#00f2ff] font-bold uppercase tracking-wider block">
                AUTOMATED DISPATCH LEDGER
              </span>
              <span className="text-[8px] bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 px-1.5 py-0.2 rounded font-black uppercase flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                VERIFIED $130
              </span>
            </div>
            <h3 className="text-xs font-sans font-extrabold text-white uppercase tracking-wider mt-0.5">
              Receipt Delivery & Email Confirmation
            </h3>
          </div>
        </div>

        {/* Resend Action Button */}
        <button
          id="btn-resend-receipt-trigger"
          type="button"
          onClick={handleResendReceipt}
          disabled={isResending}
          className="px-3 py-1.5 bg-[#00f2ff] hover:bg-[#00d8e6] text-neutral-950 font-black text-[10px] rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.25)] cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          {isResending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-950" />
              <span>DISPATCHING RECEIPT...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-neutral-950" />
              <span>Resend Receipt</span>
            </>
          )}
        </button>
      </div>

      {/* Saved Email Address Display & Edit Box */}
      <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 flex-1">
          <span className="text-[8px] text-neutral-400 uppercase font-bold block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            Registered License Recipient Email
          </span>
          
          {isEditingEmail ? (
            <form onSubmit={handleSaveEmail} className="flex gap-2 items-center max-w-md mt-1">
              <input
                id="edit-receipt-email-input"
                type="email"
                required
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                className="flex-1 bg-neutral-950 border border-[#00f2ff] text-white rounded px-2.5 py-1 text-[10px] outline-none font-mono"
                placeholder="your-email@domain.com"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-[9px] rounded flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingEmail(false);
                  setTempEmail(email);
                }}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px] rounded cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <code className="text-xs font-bold text-[#00f2ff] bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                {email}
              </code>
              <button
                id="edit-saved-email-btn"
                type="button"
                onClick={() => setIsEditingEmail(true)}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Edit saved delivery email"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="text-right font-mono text-[8.5px] text-neutral-400 border-t sm:border-t-0 sm:border-l border-neutral-800 pt-2 sm:pt-0 sm:pl-3 shrink-0">
          <span className="text-neutral-500 block uppercase font-bold">Default Plan Fee</span>
          <span className="text-emerald-400 font-extrabold text-xs block">${amount.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Dispatch History Log */}
      <div className="space-y-1.5">
        <span className="text-[8px] text-neutral-500 uppercase font-bold block flex items-center justify-between">
          <span>Recent Dispatch Audit Logs ({dispatchHistory.length})</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Auto-Sync Active
          </span>
        </span>

        <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
          {dispatchHistory.map((log, index) => (
            <div
              key={`${log.id}-${index}`}
              className="bg-neutral-950 p-2 rounded border border-neutral-850 flex items-center justify-between gap-2 text-[8.5px]"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3 h-3 text-[#00f2ff] shrink-0" />
                <span className="text-white font-bold truncate">#{log.id}</span>
                <span className="text-neutral-500 truncate">→ {log.email}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-neutral-500 text-[7.5px]">{log.timestamp}</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded text-[7.5px]">
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated Email Confirmation Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[200] max-w-md bg-neutral-900 border-2 border-[#00f2ff] p-4 rounded-xl shadow-[0_0_25px_rgba(0,242,255,0.4)] flex items-start gap-3 font-mono"
          >
            <div className="p-2 bg-[#00f2ff]/20 border border-[#00f2ff]/50 rounded-lg text-[#00f2ff] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#00f2ff] uppercase tracking-wider block">
                  EMAIL RECEIPT CONFIRMATION
                </span>
                <button
                  type="button"
                  onClick={() => setShowToast(false)}
                  className="text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[9.5px] font-sans text-neutral-200 font-semibold leading-snug">
                {toastMessage}
              </p>
              <div className="pt-1 flex items-center justify-between text-[8px] text-neutral-400">
                <span>PDF Attachment Generated</span>
                <span className="text-emerald-400 font-bold">100% VERIFIED</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
