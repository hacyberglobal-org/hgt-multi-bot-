import React, { useState } from 'react';
import { Network, Database, Terminal, CheckCircle2, Copy, Trash2, Webhook, Box, Lock, Send, DollarSign } from 'lucide-react';

interface PayloaderProps {
  onAddLog: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'competitor' | 'expire' | 'warning', 
    message: string, 
    offerId?: string, 
    badge?: string
  ) => void;
  activeDomain: string;
}

export default function Payloader({ onAddLog, activeDomain }: PayloaderProps) {
  const [targetEndpoint, setTargetEndpoint] = useState<string>('https://example-bot-endpoint.com/webhook');
  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'PayPal' | 'CashApp' | 'Zelle' | 'Crypto'>('Stripe');
  const [payloadVersion, setPayloadVersion] = useState<'v1.0' | 'v2.1_stealth' | 'v3_bypass'>('v2.1_stealth');
  const [bypassHeaders, setBypassHeaders] = useState<boolean>(true);
  const [amount, setAmount] = useState<number>(300);
  const [buyerEmail, setBuyerEmail] = useState<string>('test-driver@example.com');
  const [generatedPayload, setGeneratedPayload] = useState<string>('');
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const handleGenerate = () => {
    const payload = {
      dispatcher_auth: bypassHeaders ? `eyJhbGciOiJIUzI1Ni... (Bypass)` : "Standard Token",
      bot_version_spoof: payloadVersion,
      client_host: activeDomain,
      payment_trigger: {
        method: paymentMethod,
        gross_amount_usd: amount,
        fee_deduction: Number((amount * 0.05).toFixed(2)),
        net_deposit: Number((amount * 0.95).toFixed(2)),
        status: "COMPLETED",
        buyer_identifier: buyerEmail,
        tx_hash: `0x${Math.random().toString(16).substring(2, 10)}...`
      },
      hooks: [
        "trigger_license_activate",
        "update_driver_tier",
        "inject_fcfs_priority"
      ],
      timestamp_utc: new Date().toISOString()
    };
    
    setGeneratedPayload(JSON.stringify(payload, null, 2));
    onAddLog(
      'info',
      `📦 Generated custom Payloader bot response for ${paymentMethod} gateway mapping ${activeDomain}.`,
      undefined,
      'PAYLOAD_GEN'
    );
  };

  const handleCopy = () => {
    if (!generatedPayload) return;
    navigator.clipboard.writeText(generatedPayload);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleFirePayload = () => {
    if (!generatedPayload) {
      onAddLog('warning', '❌ Cannot dispatch empty payload. Generate payload first.', undefined, 'PAYLOAD_ERR');
      return;
    }

    setIsDeploying(true);
    onAddLog('info', `📡 Initiating reverse Payloader injection sequence to ${targetEndpoint}...`, undefined, 'PAYLOAD_TX');
    
    setTimeout(() => {
      setIsDeploying(false);
      onAddLog('bot_accept', `✅ SUCCESS: Custom Payloader response successfully pierced external endpoint mapping for ${paymentMethod} unlock.`, undefined, 'PAYLOAD_OK');
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-1">
        <div>
          <span className="text-[10px] font-mono text-cyan-500 block">ADVANCED BOT MULTIPLEXER</span>
          <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
            <Box className="w-3.5 h-3.5 text-cyan-500" />
            Custom Payloader Engine
          </h3>
        </div>
        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-900/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
          V3.1 SECURE
        </span>
      </div>

      <p className="text-[9.5px] text-neutral-400 font-sans leading-relaxed">
        Map custom bot responses and trigger automated webhook payloads based on specific client payment methods. Spoof payment confirmations to instantly unlock HGT Multi-Bot software limits across connected devices.
      </p>

      {/* Configuration Grid */}
      <div className="space-y-3 p-3 bg-neutral-900/30 border border-neutral-850 rounded">
        
        <div>
          <label className="text-[8px] font-mono text-neutral-500 block mb-1 uppercase">Target Webhook Endpoint</label>
          <input
            type="text"
            value={targetEndpoint}
            onChange={(e) => setTargetEndpoint(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-200 py-1.5 px-2 rounded font-mono outline-none focus:border-cyan-500"
            placeholder="https://your-bot-api.com/v1/trigger"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[8px] font-mono text-neutral-500 block mb-1 uppercase text-cyan-400">Payment Gateway Response</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full bg-neutral-950 border border-cyan-800/40 text-[10px] text-neutral-200 p-1.5 rounded font-mono outline-none focus:border-cyan-500"
            >
              <option value="Stripe">Stripe / Credit Card</option>
              <option value="PayPal">PayPal (Direct)</option>
              <option value="CashApp">CashApp Signature</option>
              <option value="Zelle">Zelle Instant</option>
              <option value="Crypto">Crypto (BTC/USDT)</option>
            </select>
          </div>
          <div>
            <label className="text-[8px] font-mono text-neutral-500 block mb-1 uppercase">Injection Stealth Level</label>
            <select
              value={payloadVersion}
              onChange={(e) => setPayloadVersion(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-200 p-1.5 rounded font-mono outline-none focus:border-cyan-500"
            >
              <option value="v1.0">v1.0 (Standard Sync)</option>
              <option value="v2.1_stealth">v2.1 (Stealth Overide)</option>
              <option value="v3_bypass">v3.0 (WAF Bypass Hash)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[8px] font-mono text-neutral-500 block mb-1 uppercase text-emerald-400">Transaction Value ($)</label>
            <div className="relative">
              <span className="absolute left-1.5 top-1.5 font-mono text-[10px] text-neutral-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 text-[10px] text-green-300 py-1.5 pl-5 pr-2 rounded font-mono outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[8px] font-mono text-neutral-500 block mb-1 uppercase">Targeted User License</label>
            <input
              type="text"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-200 py-1.5 px-2 rounded font-mono outline-none focus:border-cyan-500"
              placeholder="license-key-or-email..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-neutral-850 mt-1">
          <input
            type="checkbox"
            id="bypassHeaders"
            checked={bypassHeaders}
            onChange={(e) => setBypassHeaders(e.target.checked)}
            className="accent-cyan-500 h-3 w-3"
          />
          <label htmlFor="bypassHeaders" className="text-[9px] font-mono text-neutral-400 cursor-pointer flex-1">
            Sign payload with HMAC bypass headers to spoof active license checks
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          className="flex-1 justify-center px-2 py-2 bg-neutral-850 border border-cyan-500/30 hover:bg-neutral-800 hover:border-cyan-400 text-cyan-300 font-mono font-bold text-[10px] rounded transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Database className="w-3 h-3" />
          <span>Compile Trigger Payload</span>
        </button>
      </div>

      {generatedPayload && (
        <div className="border border-neutral-850 rounded relative group overflow-hidden mt-1">
          <div className="bg-neutral-900 border-b border-neutral-850 p-1.5 flex justify-between items-center">
            <span className="text-[8px] font-mono text-neutral-400 block uppercase tracking-wider flex items-center gap-1">
              <Terminal className="w-3 h-3 text-cyan-500" />
              <span>Compiled Output (JSON)</span>
            </span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setGeneratedPayload('')}
                className="text-neutral-500 hover:text-rose-400 cursor-pointer p-0.5"
                title="Clear Payload"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button 
                onClick={handleCopy}
                className="text-neutral-400 hover:text-white cursor-pointer px-1 py-[1px] bg-neutral-950 border border-neutral-800 rounded flex items-center gap-1 text-[8px] font-mono"
              >
                {showCopied ? <><CheckCircle2 className="w-2.5 h-2.5 text-emerald-400"/> Copied</> : <><Copy className="w-2.5 h-2.5"/> Copy</>}
              </button>
            </div>
          </div>
          <pre className="p-2 bg-neutral-950 font-mono text-[8px] leading-relaxed text-neutral-300 overflow-x-auto max-h-[140px] scrollbar-thin select-all">
            {generatedPayload}
          </pre>
          <div className="p-2 bg-neutral-900/40 border-t border-neutral-850 flex justify-end">
             <button
                onClick={handleFirePayload}
                disabled={isDeploying}
                className={`px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-mono font-black text-[9px] rounded flex items-center gap-1 cursor-pointer transition-colors ${isDeploying ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Dispatch to endpoint"
             >
                {isDeploying ? 'INJECTING...' : 'DISPATCH PAYLOAD'}
                <Send className="w-3 h-3 ml-0.5 border-l border-neutral-950/20 pl-1" />
             </button>
          </div>
        </div>
      )}

    </div>
  );
}
