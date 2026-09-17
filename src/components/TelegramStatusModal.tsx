import React, { useState } from 'react';
import { Bot, Check, X, Loader2 } from 'lucide-react';
import { verifyConnection } from '../lib/telegramBilling';

export default function TelegramStatusModal({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'connected' | 'error'>('idle');

  const handleVerify = async () => {
    setStatus('verifying');
    const isConnected = await verifyConnection(token, chatId);
    setStatus(isConnected ? 'connected' : 'error');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-lg w-full max-w-sm space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#00f2ff]"/> Billing Bot Connection
        </h3>
        <input className="w-full" placeholder="Bot Token" value={token} onChange={e => setToken(e.target.value)} />
        <input className="w-full" placeholder="Chat ID" value={chatId} onChange={e => setChatId(e.target.value)} />
        
        <button onClick={handleVerify} className="action-btn w-full flex items-center justify-center gap-2" disabled={status === 'verifying'}>
            {status === 'verifying' ? <Loader2 className="animate-spin w-4 h-4"/> : 'Verify Connection'}
        </button>

        {status === 'connected' && <div className="text-green-500 font-mono text-sm flex items-center gap-2"><Check className="w-4 h-4"/> Connected</div>}
        {status === 'error' && <div className="text-red-500 font-mono text-sm flex items-center gap-2"><X className="w-4 h-4"/> Connection Failed</div>}
        
        <button onClick={onClose} className="text-neutral-500 text-xs hover:text-white">Close</button>
      </div>
    </div>
  );
}
