import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Lock,
  RefreshCw,
  XCircle,
  FileCheck,
  AlertTriangle,
  Radio,
  Car,
  Zap,
  Box,
  KeyRound,
  FileText,
  UserCheck,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ArgyleVerificationState,
  ArgyleTargetPlatformKey,
  ArgylePlatformMetadata,
  VerificationRequest
} from '../types';

interface AuthorizedIntegrationsProps {
  onLogEvent?: (type: string, message: string, component?: string) => void;
  currentUserId?: string;
}

export const AuthorizedIntegrations: React.FC<AuthorizedIntegrationsProps> = ({
  onLogEvent,
  currentUserId = 'usr_hgt_operator_01'
}) => {
  const [platforms, setPlatforms] = useState<ArgylePlatformMetadata[]>([]);
  const [activeVerifications, setActiveVerifications] = useState<VerificationRequest[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState<boolean>(true);
  const [isStartingVerification, setIsStartingVerification] = useState<boolean>(false);
  const [syncingCoverage, setSyncingCoverage] = useState<boolean>(false);

  // Modal state for Voluntary Consent & Verification Launch
  const [consentModalOpen, setConsentModalOpen] = useState<boolean>(false);
  const [targetPlatformKey, setTargetPlatformKey] = useState<ArgyleTargetPlatformKey>('spark_driver');
  const [userConsentChecked, setUserConsentChecked] = useState<boolean>(false);
  const [operatorUserId, setOperatorUserId] = useState<string>(currentUserId);
  const [consentError, setConsentError] = useState<string | null>(null);

  // Link SDK simulation / status modal
  const [linkSdkModalOpen, setLinkSdkModalOpen] = useState<boolean>(false);
  const [sdkActiveToken, setSdkActiveToken] = useState<string>('');

  // Argyle environment configuration info
  const [envConfig, setEnvConfig] = useState<{
    environment: string;
    isConfigured: boolean;
    hasWebhookSecret: boolean;
  }>({
    environment: 'sandbox',
    isConfigured: false,
    hasWebhookSecret: false
  });

  // Fetch Argyle platforms and current verification records
  const loadData = async (sync: boolean = false) => {
    try {
      if (sync) setSyncingCoverage(true);

      // Load config
      const cfgRes = await fetch('/api/argyle/config');
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setEnvConfig(cfg);
      }

      // Load platforms
      const pRes = await fetch(`/api/argyle/platforms${sync ? '?sync=true' : ''}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPlatforms(pData.platforms || []);
      }

      // Load verification status
      const vRes = await fetch('/api/argyle/verification/status');
      if (vRes.ok) {
        const vData = await vRes.json();
        const list: VerificationRequest[] = vData.verifications || [];
        setActiveVerifications(list);
        if (list.length > 0 && !selectedVerification) {
          setSelectedVerification(list[0]);
        } else if (selectedVerification) {
          const fresh = list.find(v => v.verification_request_id === selectedVerification.verification_request_id);
          if (fresh) setSelectedVerification(fresh);
        }
      }
    } catch (err) {
      console.error('Failed to load Argyle platform data:', err);
    } finally {
      setIsLoadingPlatforms(false);
      setSyncingCoverage(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 8000);
    return () => clearInterval(interval);
  }, []);

  // Open consent dialog
  const handleInitiateClick = (pKey: ArgyleTargetPlatformKey) => {
    setTargetPlatformKey(pKey);
    setUserConsentChecked(false);
    setConsentError(null);
    setConsentModalOpen(true);
  };

  // Launch Verification Workflow
  const handleLaunchArgyleLink = async () => {
    if (!userConsentChecked) {
      setConsentError('You must explicitly authorize Argyle to connect to your account before proceeding.');
      return;
    }

    setIsStartingVerification(true);
    setConsentError(null);

    try {
      const res = await fetch('/api/argyle/verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerUserId: operatorUserId.trim() || 'usr_hgt_operator_01',
          platformKey: targetPlatformKey,
          userConsentAccepted: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to initialize Argyle verification session.');
      }

      const newRequest: VerificationRequest = data.request;
      setConsentModalOpen(false);
      setSelectedVerification(newRequest);
      setSdkActiveToken(data.userToken || 'sandbox_token');

      if (onLogEvent) {
        onLogEvent('info', `Argyle voluntary verification requested for ${newRequest.platform} [ID: ${newRequest.verification_request_id}]`, 'ARGYLE');
      }

      // Check if Argyle Link SDK is loaded on window
      const win = window as any;
      if (win.Argyle && typeof win.Argyle.create === 'function') {
        try {
          // Official Argyle Link initialization
          const link = win.Argyle.create({
            userToken: data.userToken,
            onAccountConnected: async (payload: any) => {
              console.log('Argyle onAccountConnected:', payload);
              await fetch('/api/argyle/verification/state-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  requestId: newRequest.verification_request_id,
                  state: 'CONNECTED',
                  details: `Argyle Link account ${payload?.accountId || ''} authorized.`
                })
              });
              loadData();
            },
            onAccountError: async (payload: any) => {
              console.warn('Argyle onAccountError:', payload);
              await fetch('/api/argyle/verification/state-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  requestId: newRequest.verification_request_id,
                  state: 'CONNECTION_FAILED',
                  details: payload?.error || 'Platform authorization refused.'
                })
              });
              loadData();
            },
            onClose: async () => {
              console.log('Argyle Link closed by user');
              loadData();
            }
          });

          // State transition: LINK_OPENED
          await fetch('/api/argyle/verification/state-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: newRequest.verification_request_id,
              state: 'LINK_OPENED',
              details: 'Argyle Link SDK web modal opened for user authentication.'
            })
          });

          link.open();
        } catch (linkInitErr) {
          console.warn('Direct Argyle.create execution trapped; opening sandbox simulator:', linkInitErr);
          setLinkSdkModalOpen(true);
        }
      } else {
        // In dev preview / sandbox where external iframe cross-origins might block popups, show interactive sandbox connector
        setLinkSdkModalOpen(true);
      }

      await loadData();
    } catch (err: any) {
      setConsentError(err.message || 'Failed to start verification workflow.');
    } finally {
      setIsStartingVerification(false);
    }
  };

  // Sandbox simulation trigger
  const handleSimulateState = async (targetState: ArgyleVerificationState) => {
    if (!selectedVerification) return;
    try {
      const res = await fetch('/api/argyle/sandbox/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedVerification.verification_request_id,
          targetState
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedVerification(data.verification);
        if (onLogEvent) {
          onLogEvent('info', `Argyle sandbox simulated state: ${targetState} on ${data.verification.platform}`, 'ARGYLE');
        }
        loadData();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  const getPlatformIcon = (key: ArgyleTargetPlatformKey) => {
    switch (key) {
      case 'uber': return <Car className="w-5 h-5 text-neutral-200" />;
      case 'lyft': return <Radio className="w-5 h-5 text-pink-400" />;
      case 'doordash': return <Zap className="w-5 h-5 text-red-400" />;
      case 'instacart': return <Box className="w-5 h-5 text-emerald-400" />;
      case 'spark_driver': return <ShieldCheck className="w-5 h-5 text-blue-400" />;
      default: return <Car className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStateBadge = (state: ArgyleVerificationState) => {
    switch (state) {
      case 'REQUESTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">REQUESTED</span>;
      case 'LINK_OPENED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">LINK_OPENED</span>;
      case 'CONNECTING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">CONNECTING</span>;
      case 'CONNECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">CONNECTED</span>;
      case 'DATA_RETRIEVING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">DATA_RETRIEVING</span>;
      case 'DATA_AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">DATA_AVAILABLE</span>;
      case 'VERIFICATION_READY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> VERIFICATION_READY</span>;
      case 'CONNECTION_FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" /> CONNECTION_FAILED</span>;
      case 'USER_CANCELLED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-500/20 text-neutral-300 border border-neutral-500/30">USER_CANCELLED</span>;
      case 'REQUIRES_RECONNECT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> REQUIRES_RECONNECT</span>;
      case 'PLATFORM_UNAVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900/40 text-red-300 border border-red-700/50">PLATFORM_UNAVAILABLE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-400">{state}</span>;
    }
  };

  const targetPlatform = platforms.find(p => p.platformKey === targetPlatformKey);

  return (
    <div className="w-full space-y-6 text-neutral-100">
      {/* Top Banner & Security Standards */}
      <div className="bg-neutral-900/80 border border-blue-500/30 rounded-xl p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded">
                Official Argyle Integration
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                envConfig.environment === 'production'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {envConfig.environment.toUpperCase()} ENVIRONMENT
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                Webhook HMAC: {envConfig.hasWebhookSecret ? 'ARMED' : 'READY (SANDBOX)'}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              Authorized Gig-Platform Verification Center
            </h2>
            <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
              Voluntary, credential-free gig worker verification powered by Argyle's official employment API. 
              Zero passwords, OTPs, or session tokens are ever intercepted or stored. All data transfers occur 
              strictly within Argyle’s authorized consent framework.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              id="argyle-sync-coverage-btn"
              onClick={() => loadData(true)}
              disabled={syncingCoverage}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-xs font-mono font-semibold rounded-lg border border-neutral-700 text-neutral-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingCoverage ? 'animate-spin text-blue-400' : ''}`} />
              <span>{syncingCoverage ? 'Querying Argyle...' : 'Sync Coverage API'}</span>
            </button>
          </div>
        </div>

        {/* Security & Strict Compliance Notice */}
        <div className="mt-4 pt-3 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-neutral-300">
          <div className="flex items-start gap-2 bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-200 block">No Password/OTP Handling</span>
              HACYBER never touches user passwords, 2FA codes, or session cookies.
            </div>
          </div>
          <div className="flex items-start gap-2 bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-200 block">Voluntary Worker Consent</span>
              Access is initiated exclusively when the worker signs the voluntary Argyle grant.
            </div>
          </div>
          <div className="flex items-start gap-2 bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80">
            <FileCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-200 block">Minimum Necessary Data</span>
              Only identity verification and verified standing attributes are displayed.
            </div>
          </div>
        </div>
      </div>

      {/* Target Platforms & Coverage Verification Grid (Requirement 9 & 21) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <span>Supported Gig Platforms & Field Coverage</span>
              <span className="text-[10px] font-normal lowercase text-neutral-400">
                (Item ID and supported dataset coverage confirmed per platform)
              </span>
            </h3>
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            Active Targets: 5 Platforms
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {platforms.map((platform) => {
            const hasConfirmed = platform.isCoverageConfirmed;
            return (
              <div
                key={platform.platformKey}
                className={`bg-neutral-900/90 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                  hasConfirmed
                    ? 'border-neutral-750 hover:border-blue-500/50 hover:shadow-lg'
                    : 'border-neutral-800/80 bg-neutral-900/50 opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="p-2 rounded-lg bg-neutral-800/90 border border-neutral-700">
                      {getPlatformIcon(platform.platformKey)}
                    </div>
                    {hasConfirmed ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> COVERAGE VERIFIED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> PENDING CONFIG
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-white">{platform.displayName}</h4>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-2">
                    {platform.category.replace('_', ' ')}
                  </div>

                  {/* Coverage details note */}
                  <p className="text-[11px] text-neutral-400 mb-3 leading-snug">
                    {platform.coverageDetailsNote}
                  </p>

                  {/* Supported DataSets */}
                  <div className="space-y-1 mb-3 bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
                    <span className="text-[9px] font-mono uppercase text-neutral-400 block font-semibold">
                      Field Coverage Checklist:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <span className={platform.supportedDataSets?.identities ? 'text-emerald-400' : 'text-neutral-400'}>
                        • Identity {platform.supportedDataSets?.identities ? '✓' : '—'}
                      </span>
                      <span className={platform.supportedDataSets?.gigs ? 'text-emerald-400' : 'text-neutral-400'}>
                        • Gigs/Trips {platform.supportedDataSets?.gigs ? '✓' : '—'}
                      </span>
                      <span className={platform.supportedDataSets?.vehicles ? 'text-emerald-400' : 'text-neutral-400'}>
                        • Vehicles {platform.supportedDataSets?.vehicles ? '✓' : '—'}
                      </span>
                      <span className={platform.supportedDataSets?.payouts ? 'text-emerald-400' : 'text-neutral-400'}>
                        • Payouts {platform.supportedDataSets?.payouts ? '✓' : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id={`argyle-connect-btn-${platform.platformKey}`}
                  onClick={() => handleInitiateClick(platform.platformKey)}
                  className="w-full mt-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify via Argyle</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Active Verification Status & Minimum Verified Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: Verifications List & Pipeline Status (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                Active Verification Orders
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {activeVerifications.length} Records
              </span>
            </div>

            {activeVerifications.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs font-mono">
                No active verification requests found. Click "Verify via Argyle" on any supported platform above.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {activeVerifications.map((v) => {
                  const isSelected = selectedVerification?.verification_request_id === v.verification_request_id;
                  return (
                    <div
                      key={v.verification_request_id}
                      onClick={() => setSelectedVerification(v)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-white">{v.platform}</span>
                          <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                            ID: <span className="text-neutral-300">{v.verification_request_id}</span>
                          </div>
                        </div>
                        {getStateBadge(v.verification_status)}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                        <span>User: {v.customer_user_id}</span>
                        <span>{new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sandbox Testing & State Simulator (Requirement 16 & 17) */}
          {selectedVerification && (
            <div className="bg-neutral-900/90 border border-purple-500/30 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Sandbox State Simulator
                </h4>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
                  TEST BENCH
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-3">
                Simulate official Argyle webhook and Link lifecycle events safely without making production calls:
              </p>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono font-semibold">
                <button
                  type="button"
                  onClick={() => handleSimulateState('LINK_OPENED')}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-sky-300 rounded border border-neutral-700 text-left transition-colors"
                >
                  ▶ 1. LINK_OPENED
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('CONNECTING')}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-purple-300 rounded border border-neutral-700 text-left transition-colors"
                >
                  ▶ 2. CONNECTING
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('CONNECTED')}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-blue-300 rounded border border-neutral-700 text-left transition-colors"
                >
                  ▶ 3. CONNECTED
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('DATA_RETRIEVING')}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 rounded border border-neutral-700 text-left transition-colors"
                >
                  ▶ 4. DATA_RETRIEVING
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('DATA_AVAILABLE')}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-teal-300 rounded border border-neutral-700 text-left transition-colors"
                >
                  ▶ 5. DATA_AVAILABLE
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('VERIFICATION_READY')}
                  className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 rounded border border-emerald-700/50 text-left transition-colors"
                >
                  ✓ 6. VERIFICATION_READY
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('USER_CANCELLED')}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 text-left transition-colors"
                >
                  ✕ USER_CANCELLED
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('CONNECTION_FAILED')}
                  className="p-1.5 bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 rounded border border-rose-700/50 text-left transition-colors"
                >
                  ! CONNECTION_FAILED
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('REQUIRES_RECONNECT')}
                  className="p-1.5 bg-orange-950/50 hover:bg-orange-900/50 text-orange-300 rounded border border-orange-700/50 text-left transition-colors"
                >
                  ↻ REQUIRES_RECONNECT
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateState('PLATFORM_UNAVAILABLE')}
                  className="p-1.5 bg-red-950/50 hover:bg-red-900/50 text-red-300 rounded border border-red-700/50 text-left transition-colors"
                >
                  ⚠ PLATFORM_UNAVAILABLE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Selected Verification Inspector & Minimum Verified Data (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedVerification ? (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 shadow-md space-y-5">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {getPlatformIcon(selectedVerification.platform_key)}
                      {selectedVerification.platform}
                    </h3>
                    {getStateBadge(selectedVerification.verification_status)}
                  </div>
                  <div className="text-xs font-mono text-neutral-400 mt-0.5">
                    Order Ref: <span className="text-neutral-200">{selectedVerification.verification_request_id}</span> • Customer ID: <span className="text-neutral-200">{selectedVerification.customer_user_id}</span>
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-neutral-400">
                  <div>Created: {new Date(selectedVerification.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedVerification.updated_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Requirement 14: Display only minimum necessary data */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Authorized Verification Record (Minimum Data)
                </h4>

                {selectedVerification.verified_data ? (
                  <div className="bg-neutral-950/70 border border-emerald-500/30 rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase block">Verified Legal Name</span>
                        <span className="text-base font-bold text-white">
                          {selectedVerification.verified_data.verifiedLegalName || 'Provided by Worker'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase block">Platform Worker Status</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          {selectedVerification.verified_data.platformWorkerStatus || 'ACTIVE_STANDBY_ELIGIBLE'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase block">Masked Mobile</span>
                        <span className="font-mono text-neutral-200">{selectedVerification.verified_data.maskedPhone || 'Not Shared'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase block">Masked Email</span>
                        <span className="font-mono text-neutral-200">{selectedVerification.verified_data.maskedEmail || 'Not Shared'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase block">Completed Deliveries</span>
                        <span className="font-mono text-neutral-200 font-bold">
                          {selectedVerification.verified_data.completedTripsCount !== undefined ? selectedVerification.verified_data.completedTripsCount.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {selectedVerification.verified_data.verifiedVehicle && (
                      <div className="pt-2 border-t border-neutral-800 text-xs">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase block">Authorized Fleet Vehicle</span>
                        <span className="font-mono text-neutral-200">{selectedVerification.verified_data.verifiedVehicle}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span>Verification Level: Tier 1 Direct Argyle Attestation</span>
                      <span>Synced: {selectedVerification.verified_data.lastSyncTimestamp ? new Date(selectedVerification.verified_data.lastSyncTimestamp).toLocaleTimeString() : 'Recent'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-6 text-center space-y-2">
                    <Clock className="w-8 h-8 text-amber-400/80 mx-auto animate-pulse" />
                    <h5 className="font-bold text-sm text-neutral-200">Verification in Progress or Pending Link</h5>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      Authorized data attributes will display here as soon as the customer authorizes Argyle and datasets are indexed.
                    </p>
                  </div>
                )}
              </div>

              {/* Requirement 18: Audit Trail (zero secrets logged) */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  Compliance Audit Trail (Zero Authentication Secrets)
                </h4>
                <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-3 max-h-[160px] overflow-y-auto space-y-1.5 text-[11px] font-mono">
                  {selectedVerification.audit_trail.map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-neutral-300">
                      <span className="text-neutral-400 shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-blue-400 font-bold shrink-0">[{entry.event}]</span>
                      <span className="text-neutral-400 truncate">{entry.details || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 space-y-3">
              <ShieldCheck className="w-12 h-12 text-neutral-400 mx-auto" />
              <h4 className="font-bold text-base text-neutral-300">Select a Verification Order</h4>
              <p className="text-xs max-w-sm mx-auto">
                Choose a verification record on the left to inspect authorized field coverage, verification states, and the zero-secret audit trail.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Voluntary User Consent Modal (Requirement 15) */}
      {consentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-blue-500/40 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
                  {getPlatformIcon(targetPlatformKey)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Voluntary Account Authorization
                  </h3>
                  <div className="text-xs font-mono text-neutral-400">
                    Platform: <span className="text-blue-300 font-bold">{targetPlatform?.displayName}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="text-neutral-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Clear User Consent Language (Requirement 15) */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300 space-y-3 leading-relaxed">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="font-semibold text-white">
                  Explicit Worker Consent & Data Privacy Disclosure:
                </div>
              </div>

              <p className="text-neutral-300">
                By clicking "Launch Official Argyle Link", you voluntarily authorize <span className="text-white font-semibold">Argyle Inc.</span> to securely connect to your <span className="text-white font-semibold">{targetPlatform?.displayName}</span> account on behalf of <span className="text-white font-semibold">HACYBERGLOBATECH</span>.
              </p>

              <ul className="list-disc pl-5 space-y-1.5 text-neutral-400 text-[11px]">
                <li>HACYBERGLOBATECH does <strong className="text-white">NOT</strong> collect, store, intercept, or request your platform passwords, OTPs, or 2FA codes.</li>
                <li>All authentication occurs directly and securely inside Argyle's official modal.</li>
                <li>Argyle will share only permitted verification data (e.g. verified identity, account standing, trip counts) as authorized by you.</li>
                <li>You may revoke or reconnect this authorization at any time.</li>
              </ul>
            </div>

            {/* Operator/Customer ID Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-neutral-300 block uppercase">
                Customer / Operator Account ID:
              </label>
              <input
                type="text"
                value={operatorUserId}
                onChange={(e) => setOperatorUserId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                placeholder="usr_hgt_operator_01"
              />
            </div>

            {/* Checkbox Consent */}
            <label className="flex items-start gap-3 p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:bg-neutral-950">
              <input
                type="checkbox"
                checked={userConsentChecked}
                onChange={(e) => setUserConsentChecked(e.target.checked)}
                className="mt-0.5 rounded border-neutral-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-neutral-200">
                I understand and voluntarily authorize Argyle to connect to my account and share permitted verification information with HACYBERGLOBATECH.
              </span>
            </label>

            {consentError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{consentError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="argyle-launch-link-btn"
                onClick={handleLaunchArgyleLink}
                disabled={isStartingVerification || !userConsentChecked}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isStartingVerification ? 'Initiating...' : 'Launch Official Argyle Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Argyle Sandbox / Simulation Modal */}
      {linkSdkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-blue-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Argyle Link Authorization Window</h3>
                  <p className="text-[11px] font-mono text-neutral-400">Sandbox Environment • Token Active</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkSdkModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs space-y-2">
              <div className="text-neutral-300">
                Target Platform: <span className="font-bold text-white">{selectedVerification?.platform}</span>
              </div>
              <div className="text-neutral-300">
                User Token: <span className="font-mono text-neutral-400 text-[10px] break-all">{sdkActiveToken.substring(0, 32)}...</span>
              </div>
              <p className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
                In this sandbox simulator, select the worker response below to simulate the Argyle Link completion:
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={async () => {
                  setLinkSdkModalOpen(false);
                  await handleSimulateState('CONNECTED');
                  setTimeout(() => handleSimulateState('DATA_RETRIEVING'), 1000);
                  setTimeout(() => handleSimulateState('VERIFICATION_READY'), 2500);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Successful Authorization</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setLinkSdkModalOpen(false);
                  await handleSimulateState('USER_CANCELLED');
                }}
                className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Simulate Worker Closed Link (USER_CANCELLED)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setLinkSdkModalOpen(false);
                  await handleSimulateState('CONNECTION_FAILED');
                }}
                className="w-full py-2 px-4 bg-neutral-800 hover:bg-rose-950 text-rose-300 font-mono text-xs font-semibold rounded-lg border border-neutral-700 hover:border-rose-700/50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Simulate Authorization Refusal (CONNECTION_FAILED)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
