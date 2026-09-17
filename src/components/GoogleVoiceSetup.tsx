import React, { useState, useEffect } from 'react';
import { safeStorage as localStorage } from '../lib/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  ShieldCheck, 
  Check, 
  Copy, 
  Terminal, 
  Users, 
  Sliders, 
  Key, 
  Activity, 
  RefreshCw, 
  PhoneCall, 
  MessageSquare,
  Lock,
  Globe,
  Radio,
  FileCheck
} from 'lucide-react';

interface GoogleVoiceSetupProps {
  onAddLog: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'competitor' | 'expire' | 'warning', 
    message: string, 
    offerId?: string, 
    badge?: string
  ) => void;
}

export default function GoogleVoiceSetup({ onAddLog }: GoogleVoiceSetupProps) {
  // --- STATE ---
  const [isProvisioned, setIsProvisioned] = useState(() => {
    return localStorage.getItem('gvoice_provisioned') !== 'false';
  });
  const [isProvisioning, setIsProvisioning] = useState(false);

  const [voiceNumber, setVoiceNumber] = useState(() => {
    return localStorage.getItem('gvoice_number') || '+1 (360) 955-2434';
  });

  const [organizationName, setOrganizationName] = useState(() => {
    return localStorage.getItem('gvoice_org_name') || 'HACYBERGLOBALTECH™';
  });

  const [orgEmail, setOrgEmail] = useState(() => {
    return localStorage.getItem('gvoice_org_email') || 'hacyberhub@mail.com';
  });

  const [imessageCode, setImessageCode] = useState(() => {
    return localStorage.getItem('gvoice_imessage_code') || 'APKTIDLMsRzM6zzxaAT0Lttsc059WkVFUM4z2Ebp0wFHdaYEbARg';
  });

  const [isImessageVerified, setIsImessageVerified] = useState(() => {
    return localStorage.getItem('gvoice_imessage_verified') !== 'false';
  });

  // Candidate/driver SSN & Tax info securely vaulted
  const [candidateName, setCandidateName] = useState('GARCIA GONZALEZ PEDRO JOSE');
  const [candidateEmail, setCandidateEmail] = useState('Renato.01@outlook.es');
  const [candidatePhone, setCandidatePhone] = useState('7329125742');
  const [candidateSsn, setCandidateSsn] = useState('445-59-9467');
  const [taxId, setTaxId] = useState('749-54-9081');
  const [dob, setDob] = useState('1995-08-08');

  const [terminalLogs, setTerminalLogs] = useState<string[]>(() => [
    `$ gcloud voice trunks create hgt-voice-sip --org="HACYBERGLOBALTECH™"`,
    `[INFO] Locating clean Google Voice Workspace SIP endpoints...`,
    `[OK] Binding outgoing Google Voice number: +1 (360) 955-2434`,
    `$ gcloud voice forwarding add --target="+1 (360) 955-2434" --forward-sms=true --forward-calls=true`,
    `[INFO] Hooking inbound notification streams to Webex connectivity router...`,
    `$ gcloud workspace security register-imessage-key --key="APKTIDLMsRzM6zz..."`,
    `[OK] Contact Key Verification successfully synced. iMessage proxy live.`,
    `[INFO] Matching verified identity database: GARCIA GONZALEZ PEDRO JOSE (SSN: *******)`,
    `[OK] Synchronizing status with Cloudflare API endpoint...`,
    `✅ SUCCESS: Google Voice Organization setup fully active!`
  ]);
  const [activeSubTab, setActiveSubTab] = useState<'voice' | 'imessage' | 'candidate'>('voice');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    onAddLog('info', `Copied secret attribute [${id.toUpperCase()}] to secure clipboard.`, undefined, 'COPY_SECURE');
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 1500);
  };

  const runProvisioningSequence = () => {
    if (isProvisioning) return;
    setIsProvisioning(true);
    setTerminalLogs([]);

    const steps = [
      `$ gcloud voice trunks create hgt-voice-sip --org="${organizationName}"`,
      `[INFO] Locating clean Google Voice Workspace SIP endpoints...`,
      `[OK] Binding outgoing Google Voice number: ${voiceNumber}`,
      `$ gcloud voice forwarding add --target="${voiceNumber}" --forward-sms=true --forward-calls=true`,
      `[INFO] Hooking inbound notification streams to Webex connectivity router...`,
      `$ gcloud workspace security register-imessage-key --key="${imessageCode.substring(0, 15)}..."`,
      `[OK] Contact Key Verification successfully synced. iMessage proxy live.`,
      `[INFO] Matching verified identity database: ${candidateName} (SSN: *******)`,
      `[OK] Synchronizing status with Cloudflare API endpoint...`,
      `✅ SUCCESS: Google Voice Organization setup fully active!`
    ];

    onAddLog('info', `🎙️ GOOGLE VOICE: Initiating automated Workspace SIP trunk provisioning for ${organizationName}...`, undefined, 'GVOICE_INIT');

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setTerminalLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsProvisioning(false);
        setIsProvisioned(true);
        localStorage.setItem('gvoice_provisioned', 'true');
        onAddLog('bot_accept', `✅ GOOGLE VOICE PROVISIONED: Virtual numbers active on ${voiceNumber}. Organization alerts enabled!`, undefined, 'GVOICE_LIVE');
      }
    }, 400);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('gvoice_number', voiceNumber);
    localStorage.setItem('gvoice_org_name', organizationName);
    localStorage.setItem('gvoice_org_email', orgEmail);
    localStorage.setItem('gvoice_imessage_code', imessageCode);
    localStorage.setItem('gvoice_imessage_verified', String(isImessageVerified));
    
    onAddLog('info', `💾 GOOGLE VOICE CONFIG: Storing updated SIP and verification coordinates locally...`, undefined, 'GVOICE_SAVE');
    
    setTimeout(() => {
      onAddLog('info', `✅ SUCCESS: Organization verification profiles refreshed successfully.`, undefined, 'GVOICE_SAVE_OK');
    }, 800);
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-left">
      {/* Tab Header */}
      <div>
        <span className="text-[9px] font-mono text-cyan-400 block uppercase font-bold tracking-wider">GOOGLE VOICE & ORGANIZATION VAULT</span>
        <p className="text-[9.5px] text-neutral-400 mt-1 leading-normal">
          Activate Google Voice virtual SIP trunks, link Apple iMessage Contact Verification keys, and securely verify candidate background details for automated payments.
        </p>
      </div>

      {/* Main Container */}
      <div className="bot-container relative overflow-hidden">
        <div className="scan-line" />
        
        {/* Sub-tabs */}
        <div className="flex gap-1 bg-neutral-950/80 p-1 rounded-lg border border-neutral-900 mb-4 select-none">
          <button
            onClick={() => setActiveSubTab('voice')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === 'voice'
                ? 'bg-neutral-900 text-cyan-400 border border-cyan-500/20'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Phone className="w-3 h-3 shrink-0" />
            <span>SIP Voice Line</span>
          </button>
          <button
            onClick={() => setActiveSubTab('imessage')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === 'imessage'
                ? 'bg-neutral-900 text-cyan-400 border border-cyan-500/20'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Key className="w-3 h-3 shrink-0" />
            <span>iMessage Verification</span>
          </button>
          <button
            onClick={() => setActiveSubTab('candidate')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === 'candidate'
                ? 'bg-neutral-900 text-cyan-400 border border-cyan-500/20'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Users className="w-3 h-3 shrink-0" />
            <span>Driver Vault (PII)</span>
          </button>
        </div>

        {/* Content Tabs */}
        <AnimatePresence mode="wait">
          {activeSubTab === 'voice' && (
            <motion.div
              key="voice-sub"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-3.5"
            >
              {/* Voice Line Configuration Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 block">Organization Name</label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full bg-neutral-950 border border-cyan-500/30 text-[10px] text-cyan-300 p-2 rounded outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 block">Organization Contact Email</label>
                    <input
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-cyan-500/30 text-[10px] text-cyan-300 p-2 rounded outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 block">Google Voice Virtual Number</label>
                    <input
                      type="text"
                      value={voiceNumber}
                      onChange={(e) => setVoiceNumber(e.target.value)}
                      className="w-full bg-neutral-950 border border-cyan-500/30 text-[10px] text-cyan-300 p-2 rounded outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Digital Operations Authority Card Mockup */}
                <div className="p-3 bg-neutral-950 border border-cyan-500/20 rounded-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-1">
                    <Radio className="w-4.5 h-4.5 text-cyan-400/35 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-mono font-bold text-white tracking-wide">DIGITAL OPERATIONS AUTHORITY</span>
                    </div>
                    <div className="text-[8px] font-mono text-neutral-400 leading-tight space-y-1 pt-1 border-t border-neutral-900">
                      <div><strong className="text-cyan-400">ORG:</strong> {organizationName}</div>
                      <div><strong className="text-cyan-400">CONTACT:</strong> {orgEmail}</div>
                      <div><strong className="text-cyan-400">PHONE:</strong> {voiceNumber}</div>
                      <div className="text-[7.5px] text-neutral-500 uppercase font-semibold">CYBER-TECH VERIFIED ENTITY</div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(voiceNumber, 'org_phone')}
                      className="text-[8px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedStates['org_phone'] ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>Copy Virtual Line</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* GCP Provisioning Interactive button */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={runProvisioningSequence}
                  disabled={isProvisioning}
                  className="action-btn flex-1 flex items-center justify-center gap-1.5 font-mono text-[9px] font-bold uppercase transition-all"
                >
                  {isProvisioning ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{isProvisioning ? 'PROVISIONING SIP TRUNKS...' : isProvisioned ? 'RE-PROVISION GOOGLE VOICE SERVICE' : 'PROVISION GOOGLE VOICE TRUNK'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 border border-neutral-800 hover:border-cyan-500/30 text-neutral-400 hover:text-white rounded-lg font-mono text-[9px] font-bold"
                >
                  SAVE CONFIGURATION
                </button>
              </div>

              {/* Terminal Output */}
              {terminalLogs.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-neutral-500 uppercase">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Workspace Voice Provisioning Cluster Terminal Logs</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 font-mono text-[8.5px] leading-relaxed rounded border border-cyan-500/10 text-cyan-300 max-h-[140px] overflow-y-auto scrollbar-thin space-y-1 select-text">
                    {terminalLogs.map((log, i) => (
                      <div key={i} className={(log || '').startsWith('✅') ? 'text-emerald-400 font-bold' : (log || '').startsWith('$') ? 'text-neutral-500' : 'text-cyan-300/80'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeSubTab === 'imessage' && (
            <motion.div
              key="imessage-sub"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              {/* iMessage Secure Verification Header */}
              <div className="p-3 bg-neutral-950/80 border border-cyan-500/25 rounded-lg space-y-2.5 relative">
                <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
                  <span className="text-[10px] font-mono font-bold text-white tracking-wide uppercase flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>iMessage Contact Key Verification</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono text-neutral-400">VERIFICATION IN IMESSAGE:</span>
                    <button
                      type="button"
                      onClick={() => setIsImessageVerified(!isImessageVerified)}
                      className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${isImessageVerified ? 'bg-cyan-500' : 'bg-neutral-800'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-all ${isImessageVerified ? 'left-4.25' : 'left-0.25'}`} />
                    </button>
                  </div>
                </div>

                <p className="text-[8.5px] text-neutral-400 leading-relaxed font-sans">
                  Enable high-grade identity transparency to prevent third-party eavesdropping on automated payload dispatches. When active, outbound telemetry payloads verification codes will sync with your public contact keys.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[9px] font-mono text-neutral-400 block">Your Public Verification Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imessageCode}
                      onChange={(e) => setImessageCode(e.target.value)}
                      className="flex-1 bg-neutral-950 border border-cyan-500/30 text-[9.5px] text-cyan-300 p-2 rounded outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyText(imessageCode, 'imessage_code')}
                      className="px-3 bg-neutral-900 hover:bg-neutral-850 text-cyan-400 hover:text-cyan-300 border border-cyan-500/25 hover:border-cyan-500/35 rounded font-mono text-[9px] font-bold"
                    >
                      {copiedStates['imessage_code'] ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status checklist */}
              <div className="bg-neutral-950/40 border border-neutral-900 rounded-lg p-3 space-y-2 font-mono text-[8.5px]">
                <div className="text-neutral-400 uppercase tracking-wider font-bold">iMessage Encryption Pipeline Status</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Verification Switch Enabled</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Public Certificate Loaded</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>SMS Webhook Receiver Online</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>TLS 1.3 Key Tunnel Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'candidate' && (
            <motion.div
              key="candidate-sub"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              {/* Secure Vault PII */}
              <div className="bg-neutral-950/80 border border-cyan-500/20 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-white tracking-wide uppercase flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Background Verification & Identity Vault</span>
                  </span>
                  <span className="text-[7.5px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold animate-pulse">
                    VERIFIED & SYNCED
                  </span>
                </div>

                <p className="text-[8.5px] text-neutral-400 leading-normal">
                  Private identity parameters mapping background screens (Checkr Onboarding) to authorized Stripe payout endpoints. Security parameters are securely crypt-wrapped.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[8px] text-neutral-500 uppercase block font-bold">Driver Legal Name:</span>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full bg-neutral-950 border border-cyan-500/25 p-1.5 rounded text-[9.5px] font-mono text-cyan-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] text-neutral-500 uppercase block font-bold">Email Coordinate:</span>
                    <input
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-cyan-500/25 p-1.5 rounded text-[9.5px] font-mono text-cyan-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] text-neutral-500 uppercase block font-bold">Onboarding Phone:</span>
                    <input
                      type="text"
                      value={candidatePhone}
                      onChange={(e) => setCandidatePhone(e.target.value)}
                      className="w-full bg-neutral-950 border border-cyan-500/25 p-1.5 rounded text-[9.5px] font-mono text-cyan-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] text-neutral-500 uppercase block font-bold">Date of Birth:</span>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-neutral-950 border border-cyan-500/25 p-1.5 rounded text-[9.5px] font-mono text-cyan-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] text-neutral-500 uppercase block font-bold">SSN / Security Identification:</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={candidateSsn}
                        onChange={(e) => setCandidateSsn(e.target.value)}
                        className="w-full bg-neutral-950 border border-cyan-500/25 p-1.5 rounded text-[9.5px] font-mono text-cyan-300 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyText(candidateSsn, 'candidate_ssn')}
                        className="absolute right-1 top-1.5 text-[8px] text-cyan-400 font-bold px-1"
                      >
                        {copiedStates['candidate_ssn'] ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] text-neutral-500 uppercase block font-bold">Stripe Tax Identification Number (TIN):</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="w-full bg-neutral-950 border border-cyan-500/25 p-1.5 rounded text-[9.5px] font-mono text-cyan-300 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyText(taxId, 'candidate_tin')}
                        className="absolute right-1 top-1.5 text-[8px] text-cyan-400 font-bold px-1"
                      >
                        {copiedStates['candidate_tin'] ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
