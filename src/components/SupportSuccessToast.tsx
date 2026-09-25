import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ShieldCheck, Copy, Check, ExternalLink, X, Ticket } from 'lucide-react';

export interface SupportToastData {
  id: string;
  ticketId: string;
  title?: string;
  clientName?: string;
  serviceTier?: string;
  platform?: string;
  message?: string;
  botLink?: string;
  duration?: number; // ms, default 6500
}

interface SupportSuccessToastProps {
  toast: SupportToastData | null;
  onDismiss: () => void;
}

export default function SupportSuccessToast({ toast, onDismiss }: SupportSuccessToastProps) {
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setCopied(false);
    setProgress(100);

    const duration = toast.duration || 6500;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, onDismiss]);

  const handleCopyTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!toast?.ticketId) return;
    navigator.clipboard.writeText(toast.ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed top-5 right-5 z-[200] max-w-md w-full px-3 sm:px-0 pointer-events-none">
          <motion.div
            id="support-request-success-toast"
            initial={{ opacity: 0, y: -25, scale: 0.94, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -18, scale: 0.94, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="pointer-events-auto relative overflow-hidden rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-neutral-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(0,242,255,0.12)] p-4 sm:p-5"
          >
            {/* Ambient Glass Highlight Line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent opacity-80" />
            
            {/* Subtle Neon Radial Glow Backdrop */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#00f2ff]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start gap-3.5">
              {/* Animated Check Badge */}
              <div className="relative shrink-0">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.08 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-[#00f2ff]/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </motion.div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neutral-950 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff]">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* Toast Body */}
              <div className="flex-1 min-w-0 pr-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <h4 className="text-xs font-semibold text-white tracking-tight truncate">
                      {toast.title || 'Support Request Submitted'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="text-neutral-500 hover:text-neutral-300 p-1 rounded-md hover:bg-neutral-850/60 transition-colors cursor-pointer shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-neutral-300 leading-snug">
                  {toast.message || 'Your support dossier has been recorded and dispatched to the verification queue.'}
                </p>

                {/* Glass Meta Capsule */}
                <div className="mt-2 pt-2 border-t border-neutral-850/70 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Ticket className="w-3 h-3 text-[#00f2ff]" />
                      ID:
                    </span>
                    <span className="text-[#00f2ff] font-bold tracking-wider select-all">
                      {toast.ticketId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTicket}
                      className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:border-[#00f2ff]/50 text-neutral-400 hover:text-[#00f2ff] transition-all flex items-center gap-0.5 cursor-pointer text-[9px]"
                      title="Copy Ticket ID"
                    >
                      {copied ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {toast.clientName && (
                    <span className="text-neutral-400 text-[9.5px] truncate max-w-[120px]">
                      {toast.clientName}
                    </span>
                  )}
                </div>

                {/* Live Status Tag */}
                <div className="pt-1.5 flex items-center justify-between">
                  <span className="text-[9.5px] text-neutral-500 font-mono">Status: <span className="text-emerald-400 font-medium">QUEUED FOR VERIFICATION</span></span>
                  <span className="text-[9.5px] text-[#00f2ff] font-mono font-medium">Active Ticket</span>
                </div>
              </div>
            </div>

            {/* Bottom Glass Progress Line */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-neutral-900 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00f2ff] to-emerald-400"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
