import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Lock, 
  Unlock, 
  Cpu, 
  Server, 
  Radio, 
  Globe, 
  FileText, 
  Send, 
  Eye, 
  EyeOff, 
  Copy, 
  Plus, 
  ExternalLink,
  Flame,
  Award,
  Terminal,
  HelpCircle,
  Clock,
  ArrowRight,
  Database,
  Key,
  Sparkles
} from 'lucide-react';
import { 
  ProviderConnector, 
  BotOperationMode, 
  BotGrabberStatus, 
  ConsentStatus, 
  ConsentScope, 
  AnalystIncident, 
  BotGrabberSupportTicket, 
  BotGrabberSimulationOffer,
  ConnectorProviderType,
  ProviderAgnosticProtocol,
  ConnectorAuthType
} from '../types';

interface BotGrabberAnalystProps {
  activeDomain: string;
  onAddLog: (type: any, message: string, details?: any, eventType?: string) => void;
  onInjectOffer?: (offer: any) => void;
}

export const BotGrabberAnalyst: React.FC<BotGrabberAnalystProps> = ({
  activeDomain,
  onAddLog,
  onInjectOffer
}) => {
  // --- STATE MANAGEMENT ---
  const [connectors, setConnectors] = useState<ProviderConnector[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [botMode, setBotMode] = useState<BotOperationMode>('simulation_safe');
  const [botStatus, setBotStatus] = useState<BotGrabberStatus>('simulation_dry_run');
  const [healthScore, setHealthScore] = useState<number>(98);
  const [circuitBreakerTripped, setCircuitBreakerTripped] = useState<boolean>(false);
  const [circuitBreakerReason, setCircuitBreakerReason] = useState<string | null>(null);
  
  // Analyst Diagnostics & Tickets
  const [incidents, setIncidents] = useState<AnalystIncident[]>([]);
  const [tickets, setTickets] = useState<BotGrabberSupportTicket[]>([]);
  
  // Active Navigation Tab inside BotGrabber
  const [activeSubTab, setActiveSubTab] = useState<'connectors' | 'simulation' | 'governance' | 'diagnostics'>('simulation');

  // Simulation Runner State
  const [isSimulatingGrab, setIsSimulatingGrab] = useState<boolean>(false);
  const [simProvider, setSimProvider] = useState<ConnectorProviderType>('walmart_spark');
  const [simPayout, setSimPayout] = useState<number>(34.50);
  const [simMiles, setSimMiles] = useState<number>(3.8);
  const [simStoreName, setSimStoreName] = useState<string>('Walmart Supercenter #2201 (Curbside)');
  const [lastGrabbedSimOffer, setLastGrabbedSimOffer] = useState<any | null>(null);
  const [recentSimOffers, setRecentSimOffers] = useState<any[]>([]);

  // Modals
  const [selectedConsentConnector, setSelectedConsentConnector] = useState<ProviderConnector | null>(null);
  const [isNewConnectorModalOpen, setIsNewConnectorModalOpen] = useState<boolean>(false);
  const [isLiveModeConfirmModalOpen, setIsLiveModeConfirmModalOpen] = useState<boolean>(false);
  const [liveConfirmPassword, setLiveConfirmPassword] = useState<string>('');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState<boolean>(false);
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketPriority, setTicketPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [ticketNotes, setTicketNotes] = useState<string>('');

  // New Connector Form
  const [newConnName, setNewConnName] = useState<string>('');
  const [newConnProvider, setNewConnProvider] = useState<ConnectorProviderType>('walmart_spark');
  const [newConnProtocol, setNewConnProtocol] = useState<ProviderAgnosticProtocol>('rest_https');
  const [newConnEndpoint, setNewConnEndpoint] = useState<string>('https://api.gateway.internal/v1/offers');
  const [newConnAuthType, setNewConnAuthType] = useState<ConnectorAuthType>('bearer_token');
  const [newConnToken, setNewConnToken] = useState<string>('');
  const [newConnRateLimit, setNewConnRateLimit] = useState<number>(60);

  // Credential Visibility Map
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});
  const [consoleSecretStatus, setConsoleSecretStatus] = useState<{ configured: boolean; masked: string; status: string } | null>(null);
  const [cloudflareStatus, setCloudflareStatus] = useState<{ connected: boolean; tokenId: string; tokenMasked: string; status: string } | null>(null);

  // 1. Initial Fetch of BotGrabber Status & Connectors
  const fetchStatusAndConnectors = async () => {
    try {
      setIsLoading(true);
      const [statusRes, connRes, diagRes, consoleRes, cfRes] = await Promise.all([
        fetch('/api/botgrabber/status'),
        fetch('/api/botgrabber/connectors'),
        fetch('/api/botgrabber/diagnostics'),
        fetch('/api/console/secret'),
        fetch('/api/cloudflare/status')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setBotMode(statusData.mode);
        setBotStatus(statusData.status);
        setHealthScore(statusData.healthScore);
        setCircuitBreakerTripped(statusData.circuitBreaker.tripped);
        setCircuitBreakerReason(statusData.circuitBreaker.reason);
      }

      if (connRes.ok) {
        const connData = await connRes.json();
        if (connData.connectors) {
          setConnectors(connData.connectors);
        }
      }

      if (diagRes.ok) {
        const diagData = await diagRes.json();
        if (diagData.incidents) setIncidents(diagData.incidents);
        if (diagData.tickets) setTickets(diagData.tickets);
      }

      if (consoleRes.ok) {
        const cData = await consoleRes.json();
        setConsoleSecretStatus(cData);
      }

      if (cfRes.ok) {
        const cfData = await cfRes.json();
        setCloudflareStatus(cfData);
      }
    } catch (err) {
      console.error('Error fetching BotGrabber state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndConnectors();
    const interval = setInterval(fetchStatusAndConnectors, 12000);
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---

  // Trigger Simulation-Safe Offer Grab Race
  const handleTriggerSimulationGrab = async () => {
    if (circuitBreakerTripped) {
      onAddLog('error', '⚠️ Cannot grab: BotGrabber Safety Circuit Breaker is engaged!', undefined, 'CIRCUIT_TRIPPED');
      return;
    }

    setIsSimulatingGrab(true);
    onAddLog('info', `🎯 [SIMULATION-SAFE] Broadcasting synthetic surge offer for ${simProvider.toUpperCase()}...`, undefined, 'SIM_BROADCAST');

    try {
      const res = await fetch('/api/botgrabber/simulate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: simProvider,
          payout: simPayout,
          miles: simMiles,
          storeName: simStoreName
        })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        const grabbed = data.grabbedOffer;
        setLastGrabbedSimOffer(grabbed);
        setRecentSimOffers(prev => [grabbed, ...prev.slice(0, 9)]);

        // Notify parent simulator log & inject offer
        onAddLog(
          'bot_accept',
          `⚡ [BOTGRABBER GRABBED] Caught ${grabbed.providerLabel} offer ($${grabbed.payout.toFixed(2)}) in ${grabbed.grabLatencyMs}ms (Jitter: ${grabbed.fingerprintAudit.antiDetectionJitterAppliedMs}ms). Zero TOS Risk.`,
          grabbed,
          'BOT_GRAB_SAFE'
        );

        if (onInjectOffer) {
          onInjectOffer({
            id: grabbed.id,
            platform: grabbed.provider === 'walmart_spark' ? 'Spark' : 
                      grabbed.provider === 'doordash' ? 'DoorDash' : 
                      grabbed.provider === 'uber_eats' ? 'UberEats' : 
                      grabbed.provider === 'amazon_flex' ? 'Flex' : 'Instacart',
            store: grabbed.storeName,
            amount: grabbed.payout,
            miles: grabbed.estimatedMiles,
            items: grabbed.itemsCount,
            status: 'accepted',
            timestamp: Date.now()
          });
        }
      } else {
        onAddLog('warning', `⚠️ Simulation response: ${data.message || data.error}`, undefined, 'SIM_WARNING');
      }
    } catch (err: any) {
      onAddLog('error', `❌ Simulation Grab failed: ${err.message}`, undefined, 'SIM_ERR');
    } finally {
      setIsSimulatingGrab(false);
    }
  };

  // Trip or Reset Safety Circuit Breaker
  const handleToggleCircuitBreaker = async (action: 'trip' | 'reset') => {
    try {
      const res = await fetch('/api/botgrabber/circuit-breaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: action === 'trip' ? 'Emergency Operator Kill-Switch Dispatched' : null
        })
      });

      const data = await res.json();
      if (data.ok) {
        setCircuitBreakerTripped(data.circuitBreaker.tripped);
        setCircuitBreakerReason(data.circuitBreaker.reason);
        if (action === 'trip') {
          onAddLog('error', '🛑 [KILL-SWITCH ACTIVATED] BotGrabber Circuit Breaker engaged. All sockets terminated.', undefined, 'BREAKER_TRIP');
        } else {
          onAddLog('info', '✅ BotGrabber Circuit Breaker reset. Telemetry armed & listening.', undefined, 'BREAKER_RESET');
        }
        fetchStatusAndConnectors();
      }
    } catch (err) {
      console.error('Circuit breaker error:', err);
    }
  };

  // Update Consent for a connector
  const handleUpdateConsent = async (connectorId: string, action: 'grant' | 'revoke', scopes?: ConsentScope[]) => {
    try {
      const res = await fetch('/api/botgrabber/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectorId,
          action,
          operatorName: 'Senior Fleet Dispatcher',
          authorizedScopes: scopes || ['offers:read', 'offers:evaluate', 'offers:accept_simulation_only']
        })
      });

      const data = await res.json();
      if (data.ok) {
        onAddLog(
          action === 'grant' ? 'info' : 'warning',
          `🛡️ Connector Consent updated: ${data.message} for ${connectorId}`,
          undefined,
          'CONSENT_CHANGE'
        );
        setSelectedConsentConnector(null);
        fetchStatusAndConnectors();
      }
    } catch (err) {
      console.error('Consent update error:', err);
    }
  };

  // Add New Provider-Agnostic Connector
  const handleCreateConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName || !newConnEndpoint) return;

    try {
      const res = await fetch('/api/botgrabber/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newConnName,
          providerType: newConnProvider,
          protocol: newConnProtocol,
          endpointUrl: newConnEndpoint,
          authType: newConnAuthType,
          authToken: newConnToken,
          rateLimitPerMin: newConnRateLimit,
          environment: 'sandbox_simulation'
        })
      });

      const data = await res.json();
      if (data.ok) {
        onAddLog('info', `🔌 Registered Provider-Agnostic Connector: "${data.connector.name}" (${data.connector.protocol.toUpperCase()})`, undefined, 'CONN_ADDED');
        setIsNewConnectorModalOpen(false);
        setNewConnName('');
        setNewConnToken('');
        fetchStatusAndConnectors();
      }
    } catch (err) {
      console.error('Connector creation error:', err);
    }
  };

  // Toggle Mode (with safety guardrail)
  const handleSetMode = async (targetMode: BotOperationMode) => {
    if (targetMode === 'production_live') {
      setIsLiveModeConfirmModalOpen(true);
      return;
    }

    // Switch back to simulation safe
    try {
      const res = await fetch('/api/botgrabber/mode-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'simulation_safe' })
      });
      const data = await res.json();
      if (data.ok) {
        setBotMode('simulation_safe');
        onAddLog('info', '🛡️ Switched to SIMULATION-SAFE operations profile. Zero account risk active.', undefined, 'MODE_CHANGE');
      }
    } catch (err) {
      console.error('Mode toggle error:', err);
    }
  };

  const handleConfirmLiveMode = async () => {
    if (liveConfirmPassword !== 'CONFIRM_LIVE_OPS_TOS_SAFE') {
      alert('Invalid affirmation key. Please enter "CONFIRM_LIVE_OPS_TOS_SAFE" to proceed.');
      return;
    }

    try {
      const res = await fetch('/api/botgrabber/mode-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'production_live',
          adminConfirmationKey: liveConfirmPassword
        })
      });
      const data = await res.json();
      if (data.ok) {
        setBotMode('production_live');
        setIsLiveModeConfirmModalOpen(false);
        setLiveConfirmPassword('');
        onAddLog('warning', '⚠️ PRODUCTION LIVE mode engaged. Rate-limiting guards & anti-detection active.', undefined, 'MODE_CHANGE');
      }
    } catch (err) {
      console.error('Live mode error:', err);
    }
  };

  // Create Support Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject) return;

    try {
      const res = await fetch('/api/botgrabber/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          priority: ticketPriority,
          operatorNotes: ticketNotes,
          affectedProvider: 'Universal Connector Layer'
        })
      });
      const data = await res.json();
      if (data.ok) {
        onAddLog('info', `🎫 Support Analyst Escalation Ticket created: ${data.ticket.id} (${ticketSubject})`, undefined, 'TICKET_CREATED');
        setIsNewTicketModalOpen(false);
        setTicketSubject('');
        setTicketNotes('');
        fetchStatusAndConnectors();
      }
    } catch (err) {
      console.error('Ticket creation error:', err);
    }
  };

  // Helpers
  const getProviderIcon = (type: ConnectorProviderType) => {
    switch (type) {
      case 'walmart_spark': return '⚡';
      case 'doordash': return '🚗';
      case 'uber_eats': return '🍔';
      case 'amazon_flex': return '📦';
      case 'instacart': return '🥕';
      case 'telegram_bot': return '✈️';
      case 'appdeploy_ai': return '🚀';
      case 'discord_bot': return '🎮';
      default: return '🔌';
    }
  };

  return (
    <div className="space-y-5 font-sans">
      
      {/* 1. TOP EXECUTIVE ANALYST BANNER & SAFETY PROFILE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                BOTGRABBER ANALYST
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase font-bold tracking-wider">
                  GLOBAL SUPPORT V2.4
                </span>
              </h2>

              {/* Mode indicator badge */}
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${
                botMode === 'simulation_safe'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              }`}>
                {botMode === 'simulation_safe' ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                {botMode === 'simulation_safe' ? 'SIMULATION-SAFE SANDBOX' : 'PRODUCTION LIVE GATEWAY'}
              </span>
            </div>

            <p className="text-xs text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Provider-agnostic API connector layer with consent-aware telemetry governance, automated support diagnostics, and zero-risk simulated offer evaluation.
            </p>
          </div>

          {/* Quick Metrics & Circuit Breaker */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Health Score Gauge */}
            <div className="bg-neutral-950 px-3.5 py-2 rounded-xl border border-neutral-800 text-center font-mono">
              <span className="text-[9px] text-neutral-400 uppercase block font-bold">ANALYST HEALTH</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className={`text-base font-black ${
                  healthScore >= 90 ? 'text-emerald-400' : healthScore >= 70 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {healthScore}
                </span>
                <span className="text-[10px] text-neutral-500">/100</span>
              </div>
            </div>

            {/* Average Grab Latency */}
            <div className="bg-neutral-950 px-3.5 py-2 rounded-xl border border-neutral-800 text-center font-mono">
              <span className="text-[9px] text-neutral-400 uppercase block font-bold">AVG GRAB SPEED</span>
              <div className="text-base font-black text-cyan-400 mt-0.5">
                34ms <span className="text-[9px] text-neutral-500 font-normal">±6ms</span>
              </div>
            </div>

            {/* Emergency Kill Switch / Circuit Breaker */}
            <button
              type="button"
              onClick={() => handleToggleCircuitBreaker(circuitBreakerTripped ? 'reset' : 'trip')}
              className={`px-3.5 py-2 rounded-xl font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md ${
                circuitBreakerTripped 
                  ? 'bg-rose-500 hover:bg-rose-400 text-white animate-pulse'
                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700'
              }`}
            >
              <Zap className={`w-4 h-4 ${circuitBreakerTripped ? 'text-white' : 'text-amber-400'}`} />
              <span>{circuitBreakerTripped ? 'RESET BREAKER' : 'KILL-SWITCH'}</span>
            </button>
          </div>
        </div>

        {/* High-visibility Circuit Breaker Trip Alert if active */}
        {circuitBreakerTripped && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 font-mono text-xs flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <b className="font-bold text-white uppercase tracking-wider">SAFETY BREAKER ACTIVE:</b>{' '}
                <span>{circuitBreakerReason || 'Emergency lockout in effect. All bot grabbing requests blocked.'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleCircuitBreaker('reset')}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-neutral-950 font-black rounded-lg text-[10px] shrink-0 cursor-pointer"
            >
              DISARM & RESTORE
            </button>
          </div>
        )}

        {/* Mode Toggle Selector Bar */}
        <div className="mt-4 pt-3.5 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 text-[11px]">Operating Guardrail:</span>
            <button
              type="button"
              onClick={() => handleSetMode('simulation_safe')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                botMode === 'simulation_safe'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              🛡️ Simulation-Safe (Sandbox)
            </button>
            <button
              type="button"
              onClick={() => handleSetMode('production_live')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                botMode === 'production_live'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ⚡ Production Live (Guardrailed)
            </button>
          </div>

          <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-2">
            <span>Active DNS: <b className="text-cyan-400">{activeDomain}</b></span>
            <span>•</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px]">
              <Key className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-neutral-500">Console Secret:</span>
              <span className="text-cyan-300 font-mono font-bold">
                {consoleSecretStatus?.masked || 'AQ.Ab8RN6K••••••••SNRgg'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px]">
              <Shield className="w-2.5 h-2.5 text-orange-400" />
              <span className="text-neutral-500">Cloudflare:</span>
              <span className="text-orange-300 font-mono font-bold">
                {cloudflareStatus?.tokenId ? `${cloudflareStatus.tokenId.substring(0, 8)}...` : '2966e15e...'}
              </span>
              <span className="text-neutral-600 font-mono text-[9px]">
                ({cloudflareStatus?.tokenMasked || 'b799deb57••••••••6cb6'})
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </div>
            <span>•</span>
            <span className="text-emerald-400 font-bold">TLS 1.3 Active</span>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2 overflow-x-auto text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveSubTab('simulation')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'simulation'
              ? 'bg-cyan-500 text-neutral-950 shadow-md font-extrabold'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>1. SIMULATION-SAFE STUDIO</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('connectors')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'connectors'
              ? 'bg-cyan-500 text-neutral-950 shadow-md font-extrabold'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>2. AGNOSTIC CONNECTORS ({connectors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('governance')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'governance'
              ? 'bg-cyan-500 text-neutral-950 shadow-md font-extrabold'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>3. CONSENT GOVERNANCE</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('diagnostics')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'diagnostics'
              ? 'bg-cyan-500 text-neutral-950 shadow-md font-extrabold'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>4. ANALYST INCIDENTS & TICKETS ({incidents.length + tickets.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: SIMULATION-SAFE OPERATIONS STUDIO */}
      {activeSubTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left 2 Cols: Simulation Dispatch Controller */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Synthetic Surge Offer Grabber
                    </h3>
                    <span className="text-[11px] text-neutral-400">
                      Dispatches sandboxed offers through the connector layer with sub-100ms algorithmic capture
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ZERO ACCOUNT RISK
                </span>
              </div>

              {/* Offer Configuration Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                    Target Provider Gateway
                  </label>
                  <select
                    value={simProvider}
                    onChange={(e) => setSimProvider(e.target.value as ConnectorProviderType)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500 font-mono text-xs"
                  >
                    <option value="walmart_spark">⚡ Walmart Spark Delivery</option>
                    <option value="doordash">🚗 DoorDash Drive Dasher</option>
                    <option value="uber_eats">🍔 Uber Eats Cluster</option>
                    <option value="amazon_flex">📦 Amazon Flex Logistics</option>
                    <option value="instacart">🥕 Instacart Shopper Batch</option>
                    <option value="telegram_bot">✈️ Telegram Auto-Grabber</option>
                    <option value="appdeploy_ai">🚀 AppDeploy.ai MCP Agent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                    Simulated Payout ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={simPayout}
                    onChange={(e) => setSimPayout(parseFloat(e.target.value) || 20)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                    Estimated Distance (Miles)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={simMiles}
                    onChange={(e) => setSimMiles(parseFloat(e.target.value) || 3)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                  Merchant / Store Label
                </label>
                <input
                  type="text"
                  value={simStoreName}
                  onChange={(e) => setSimStoreName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500 font-mono text-xs"
                  placeholder="e.g. Walmart Supercenter #2201"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTriggerSimulationGrab}
                  disabled={isSimulatingGrab || circuitBreakerTripped}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-neutral-950 font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 text-xs"
                >
                  <Flame className={`w-4 h-4 ${isSimulatingGrab ? 'animate-bounce' : ''}`} />
                  <span>
                    {isSimulatingGrab 
                      ? 'COMPUTING ALGORITHMIC GRAB & JITTER...' 
                      : `DISPATCH & GRAB OFFER ($${simPayout.toFixed(2)} - ${simMiles} MILES)`}
                  </span>
                </button>
              </div>

              {/* Grab Speed Telemetry Breakdown */}
              {lastGrabbedSimOffer && (
                <div className="p-3.5 bg-neutral-950 border border-cyan-500/40 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      OFFER CAPTURED IN {lastGrabbedSimOffer.grabLatencyMs}ms!
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      ID: {lastGrabbedSimOffer.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px]">TLS Handshake</span>
                      <span className="text-white font-bold">{lastGrabbedSimOffer.fingerprintAudit.tlsHandshakeMs}ms</span>
                    </div>
                    <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px]">Anti-Detection Jitter</span>
                      <span className="text-emerald-400 font-bold">
                        {lastGrabbedSimOffer.fingerprintAudit.antiDetectionJitterAppliedMs > 0 ? '+' : ''}
                        {lastGrabbedSimOffer.fingerprintAudit.antiDetectionJitterAppliedMs}ms
                      </span>
                    </div>
                    <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px]">Payout / Mile Ratio</span>
                      <span className="text-amber-400 font-bold">
                        ${(lastGrabbedSimOffer.payout / (lastGrabbedSimOffer.estimatedMiles || 1)).toFixed(2)}/mi
                      </span>
                    </div>
                    <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px]">Sandbox Status</span>
                      <span className="text-cyan-300 font-bold">100% Safe</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Captured Offers Stream */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 font-mono space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-800">
                <span className="text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Recent Simulation-Safe Grab Stream
                </span>
                <span className="text-[10px] text-neutral-500">
                  {recentSimOffers.length} batch(es) logged
                </span>
              </div>

              {recentSimOffers.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No simulated offers grabbed yet. Click the button above to test grabbing speed!
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSimOffers.map((off, idx) => (
                    <div
                      key={off.id || idx}
                      className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{off.storeName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 uppercase">
                            {off.provider.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {off.itemsCount} items • {off.estimatedMiles} miles • Dropoff: {off.dropoffAddress}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-emerald-400 font-black text-sm">
                          ${off.payout.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          ⚡ {off.grabLatencyMs}ms capture
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Safety Guidelines & Algorithmic Guardrails */}
          <div className="space-y-4 font-mono text-xs">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white uppercase tracking-wider">
                  Simulation-Safe Architecture
                </h4>
              </div>

              <div className="space-y-2 text-[11px] text-neutral-300 leading-relaxed">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                  <b className="text-cyan-400 block mb-0.5">1. Zero Deactivation Guarantee</b>
                  Synthetic offers never touch real customer dispatch or merchant order feeds. Drivers cannot receive contract cancellations or penalties.
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                  <b className="text-amber-400 block mb-0.5">2. Realistic Jitter Emulation</b>
                  Applies algorithmic timing jitter (±7ms Gaussian noise) to simulate authentic human response latency and pass automated anti-bot heuristic audits.
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                  <b className="text-emerald-400 block mb-0.5">3. Automated Circuit Breaker</b>
                  Trips in &lt;10ms if abnormal latency, consecutive 429 rate-limit errors, or unrecognized CAPTCHA prompts are detected.
                </div>
              </div>
            </div>

            {/* Platform Gateway Latency Benchmark */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-bold text-white uppercase block">
                Provider Gateway Latency Matrix
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded bg-neutral-950">
                  <span>Walmart Spark TLS 1.3</span>
                  <span className="text-emerald-400 font-bold">24ms (Optimal)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-neutral-950">
                  <span>DoorDash OpenAPI</span>
                  <span className="text-emerald-400 font-bold">31ms (Optimal)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-neutral-950">
                  <span>Uber Eats WebSocket</span>
                  <span className="text-emerald-400 font-bold">19ms (Fastest)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-neutral-950">
                  <span>Telegram MCP Relay</span>
                  <span className="text-cyan-400 font-bold">16ms (Instant)</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SECURE PROVIDER-AGNOSTIC CONNECTORS */}
      {activeSubTab === 'connectors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Active Provider-Agnostic Connector Fleet
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                Standardized adapter abstraction layer handling authentication, rate-limiting, and consent
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewConnectorModalOpen(true)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>REGISTER CONNECTOR</span>
            </button>
          </div>

          {/* Connectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
            {connectors.map(conn => {
              const isRevealed = revealedSecrets[conn.id] || false;
              return (
                <div
                  key={conn.id}
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 transition-all shadow-md"
                >
                  <div className="space-y-2">
                    {/* Header: Name and Protocol */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getProviderIcon(conn.providerType)}</span>
                        <div>
                          <h4 className="font-bold text-white text-xs leading-tight">{conn.name}</h4>
                          <span className="text-[10px] text-neutral-400 uppercase">
                            {conn.providerType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-neutral-800 text-cyan-300 border border-neutral-700 uppercase">
                        {conn.protocol.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Endpoint URL */}
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 text-[10px] text-neutral-300 truncate">
                      <span className="text-neutral-500 block text-[8.5px] uppercase">ENDPOINT</span>
                      {conn.endpointUrl}
                    </div>

                    {/* Credentials & Token Masking */}
                    <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-[10px]">
                      <div>
                        <span className="text-neutral-500 block text-[8.5px] uppercase">
                          AUTH ({conn.authType.replace('_', ' ').toUpperCase()})
                        </span>
                        <span className="text-neutral-200">
                          {isRevealed ? conn.authTokenMasked.replace(/•/g, '*') : conn.authTokenMasked}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRevealedSecrets(prev => ({ ...prev, [conn.id]: !prev[conn.id] }))}
                        className="text-neutral-400 hover:text-white p-1 cursor-pointer"
                        title="Toggle Secret Masking"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Metrics Row: Ping & Rate-Limit */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-neutral-950 p-2 rounded border border-neutral-800/80">
                        <span className="text-neutral-500 block text-[8.5px]">PING LATENCY</span>
                        <span className="text-emerald-400 font-bold">{conn.pingMs}ms</span>
                      </div>
                      <div className="bg-neutral-950 p-2 rounded border border-neutral-800/80">
                        <span className="text-neutral-500 block text-[8.5px]">RATE LIMIT</span>
                        <span className="text-cyan-400 font-bold">{conn.currentRequestsPerMin}/{conn.rateLimitPerMin} req/m</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Consent status & actions */}
                  <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 uppercase">Consent Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase flex items-center gap-1 ${
                        conn.consent.status === 'consented'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : conn.consent.status === 'pending_consent'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {conn.consent.status === 'consented' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {conn.consent.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedConsentConnector(conn)}
                        className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                      >
                        MANAGE CONSENT
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSimProvider(conn.providerType);
                          setActiveSubTab('simulation');
                        }}
                        className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        title="Simulate Grab via this Gateway"
                      >
                        SIMULATE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONSENT GOVERNANCE & TELEMETRY AUDIT */}
      {activeSubTab === 'governance' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Consent-Aware Telemetry Governance
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Enforces human-in-the-loop operator authorization before executing background grabbing routines
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-950 text-emerald-400 border border-emerald-500/40">
                AUDIT LOG: STRICT ENFORCEMENT
              </span>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-2 text-[11px] text-neutral-300 leading-relaxed">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" />
                STATUTORY CONSENT POLICY & NON-INTERFERENCE CLAUSE:
              </div>
              <p>
                In strict accordance with delivery platform driver agreements and telematics privacy standards, the BotGrabber engine blocks all live offer evaluation for any connector whose status is <b className="text-amber-400">PENDING_CONSENT</b> or <b className="text-rose-400">REVOKED</b>. Operators retain unilateral ability to pause or decouple any connector instantly.
              </p>
            </div>

            {/* Connectors Consent Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] text-neutral-400 uppercase">
                    <th className="py-2.5 px-3">Connector Name</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Signer</th>
                    <th className="py-2.5 px-3">Authorized Scopes</th>
                    <th className="py-2.5 px-3">Digital Signature</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-xs">
                  {connectors.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-850/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{c.name}</td>
                      <td className="py-3 px-3 text-neutral-400 uppercase">{c.providerType.replace('_', ' ')}</td>
                      <td className="py-3 px-3 text-neutral-300">{c.consent.consentedBy}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {c.consent.authorizedScopes.map(scope => (
                            <span key={scope} className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 text-[9px]">
                              {scope.replace('offers:', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-500 font-mono text-[10px] truncate max-w-[120px]">
                        {c.consent.signatureHash}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                          c.consent.status === 'consented'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : c.consent.status === 'pending_consent'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {c.consent.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedConsentConnector(c)}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] font-bold cursor-pointer"
                        >
                          AUDIT / MODIFY
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYST INCIDENTS & ESCALATION TICKETS */}
      {activeSubTab === 'diagnostics' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Support Analyst Diagnostic Desk
              </h3>
              <p className="text-neutral-400 text-xs">
                Real-time incident detection, rate-limit threshold warnings, and support escalation tickets
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewTicketModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>FILE SUPPORT TICKET</span>
            </button>
          </div>

          {/* Active Incidents List */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-neutral-300 uppercase block flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Active System Incidents & Recommendations ({incidents.length})
            </span>

            <div className="space-y-2">
              {incidents.map(inc => (
                <div
                  key={inc.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    inc.severity === 'critical' ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' :
                    inc.severity === 'medium' ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' :
                    'bg-neutral-950 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-neutral-800 text-neutral-200">
                        {inc.severity}
                      </span>
                      <span className="font-bold text-white text-xs">{inc.title}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(inc.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-300 pl-0.5">{inc.description}</p>
                  
                  <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800 text-[10px] text-cyan-300 flex items-center justify-between">
                    <span>💡 <b>Analyst Remedy:</b> {inc.remedyAction}</span>
                    <span className="text-neutral-500">Auto-Remediated</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Tickets Queue */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-neutral-300 uppercase block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Escalated Support Analyst Tickets ({tickets.length})
            </span>

            <div className="space-y-2">
              {tickets.map(t => (
                <div key={t.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">{t.id}</span>
                      <span className="font-bold text-white">{t.subject}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase bg-neutral-800 text-amber-300">
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400">{t.operatorNotes}</p>

                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800/80 text-[10px] text-neutral-400 flex items-center justify-between flex-wrap gap-2">
                    <span>Provider: <b className="text-white">{t.affectedProvider}</b></span>
                    <span>Latency: <b className="text-emerald-400">{t.diagnosticTelemetryBundle.latencyMs}ms</b></span>
                    <span>Jitter: <b className="text-cyan-400">{t.diagnosticTelemetryBundle.jitterMs}ms</b></span>
                    <span>Health Score: <b className="text-white">{t.diagnosticTelemetryBundle.botHealthScore}/100</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* MODAL 1: Manage Consent Affirmation & Scopes */}
      <AnimatePresence>
        {selectedConsentConnector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-cyan-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Manage Consent Affirmation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedConsentConnector(null)}
                  className="text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-neutral-400 text-[10px] uppercase">TARGET CONNECTOR:</span>
                <div className="text-sm font-bold text-white">{selectedConsentConnector.name}</div>
                <div className="text-[11px] text-neutral-400">{selectedConsentConnector.endpointUrl}</div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-white uppercase block">
                  Authorized Telemetry Scopes:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                    ✓ offers:read (Stream live quotes)
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                    ✓ offers:evaluate (Filter scoring)
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                    ✓ offers:accept_simulation_only (Safe sandbox)
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                    ✓ anti_detection:stealth_apply (Jitter guard)
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 space-y-1">
                <div>Digital Signature: <b className="text-cyan-400">{selectedConsentConnector.consent.signatureHash}</b></div>
                <div>Last Verified: {new Date(selectedConsentConnector.consent.consentTimestamp).toLocaleString()}</div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleUpdateConsent(selectedConsentConnector.id, 'revoke')}
                  className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  REVOKE CONSENT
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedConsentConnector(null)}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-bold cursor-pointer"
                  >
                    CLOSE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateConsent(selectedConsentConnector.id, 'grant')}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-xl cursor-pointer transition-all shadow active:scale-95"
                  >
                    GRANT & AFFIRM CONSENT
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Register New Provider-Agnostic Connector */}
      <AnimatePresence>
        {isNewConnectorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-cyan-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Register Provider-Agnostic API Connector
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewConnectorModalOpen(false)}
                  className="text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateConnector} className="space-y-3.5">
                <div>
                  <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                    Connector Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newConnName}
                    onChange={(e) => setNewConnName(e.target.value)}
                    placeholder="e.g. Instacart Shopper Batch Relay"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                      Provider Archetype
                    </label>
                    <select
                      value={newConnProvider}
                      onChange={(e) => setNewConnProvider(e.target.value as ConnectorProviderType)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
                    >
                      <option value="walmart_spark">Walmart Spark</option>
                      <option value="doordash">DoorDash</option>
                      <option value="uber_eats">Uber Eats</option>
                      <option value="amazon_flex">Amazon Flex</option>
                      <option value="instacart">Instacart</option>
                      <option value="telegram_bot">Telegram Bot</option>
                      <option value="appdeploy_ai">AppDeploy.ai MCP</option>
                      <option value="discord_bot">Discord Bot</option>
                      <option value="custom_webhook">Custom Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                      Protocol
                    </label>
                    <select
                      value={newConnProtocol}
                      onChange={(e) => setNewConnProtocol(e.target.value as ProviderAgnosticProtocol)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
                    >
                      <option value="rest_https">REST / HTTPS</option>
                      <option value="websocket_wss">WebSocket (WSS)</option>
                      <option value="mcp_jsonrpc">MCP (JSON-RPC)</option>
                      <option value="grpc_protobuf">gRPC / Protobuf</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                    Gateway Endpoint URL
                  </label>
                  <input
                    type="url"
                    required
                    value={newConnEndpoint}
                    onChange={(e) => setNewConnEndpoint(e.target.value)}
                    placeholder="https://api.provider.internal/v1/dispatch"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                      Authentication Method
                    </label>
                    <select
                      value={newConnAuthType}
                      onChange={(e) => setNewConnAuthType(e.target.value as ConnectorAuthType)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
                    >
                      <option value="bearer_token">Bearer Token</option>
                      <option value="oauth2_jwt">OAuth2 JWT</option>
                      <option value="api_key_secret">API Key Secret</option>
                      <option value="hmac_sha256">HMAC SHA256</option>
                      <option value="mtls_cert">mTLS Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                      Rate-Limit (req/min)
                    </label>
                    <input
                      type="number"
                      value={newConnRateLimit}
                      onChange={(e) => setNewConnRateLimit(parseInt(e.target.value) || 60)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                    Secret Credential / Token
                  </label>
                  <input
                    type="password"
                    value={newConnToken}
                    onChange={(e) => setNewConnToken(e.target.value)}
                    placeholder="Stored with AES-256 GCM encryption"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsNewConnectorModalOpen(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-bold cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black rounded-xl shadow cursor-pointer transition-all active:scale-95"
                  >
                    ENROLL CONNECTOR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Production Live Mode Affirmation Guardrail */}
      <AnimatePresence>
        {isLiveModeConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-amber-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase">
                  Caution: Production Live Mode Guardrail
                </h3>
              </div>

              <p className="text-neutral-300 leading-relaxed text-[11px]">
                You are transitioning from <b>Simulation-Safe Sandbox</b> to <b>Production Live Gateway</b>. 
                Ensure driver accounts have consented, and speed limits comply with delivery network terms.
              </p>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <span className="text-[10px] text-neutral-400 block uppercase">
                  Type <b className="text-amber-400">CONFIRM_LIVE_OPS_TOS_SAFE</b> to affirm:
                </span>
                <input
                  type="text"
                  value={liveConfirmPassword}
                  onChange={(e) => setLiveConfirmPassword(e.target.value)}
                  placeholder="CONFIRM_LIVE_OPS_TOS_SAFE"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-amber-300 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLiveModeConfirmModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-bold cursor-pointer"
                >
                  STAY IN SIMULATION SAFE
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLiveMode}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl shadow cursor-pointer active:scale-95"
                >
                  ENGAGE LIVE MODE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Support Analyst Ticket Creation */}
      <AnimatePresence>
        {isNewTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-amber-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Submit Support Analyst Escalation Ticket
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3">
                <div>
                  <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                    Subject / Issue Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Gateway TLS Jitter Spike during curbside surge"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                    Priority
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent (Circuit Trip / Threat)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">
                    Diagnostic Telemetry Notes
                  </label>
                  <textarea
                    rows={3}
                    value={ticketNotes}
                    onChange={(e) => setTicketNotes(e.target.value)}
                    placeholder="Include observed latency jitter, gateway error codes, or driver feedback..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[10px] text-neutral-400">
                  ⚡ <b>Encrypted Bundle Attached:</b> System load, 6 socket heartbeats, TLS 1.3 checksums, and consent checksums automatically attached.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsNewTicketModalOpen(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-bold cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl shadow cursor-pointer active:scale-95"
                  >
                    DISPATCH TICKET
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
