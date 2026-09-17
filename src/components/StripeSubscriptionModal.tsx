import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, X, AlertCircle } from 'lucide-react';

interface StripeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, plan: string) => void;
}

export default function StripeSubscriptionModal({ isOpen, onClose, onSave }: StripeSubscriptionModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [plan, setPlan] = useState('Monthly - $50');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-neutral-950/80 z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 w-full max-w-md shadow-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              Stripe Subscription
            </h3>
            <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-400">Stripe Secret API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-400">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white"
              >
                <option value="Monthly - $50">Monthly - $50</option>
                <option value="Yearly - $500">Yearly - $500</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={() => onSave(apiKey, plan)}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-xs"
          >
            Activate Subscription
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
