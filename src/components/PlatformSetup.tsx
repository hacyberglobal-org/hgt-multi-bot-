import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Laptop, 
  Smartphone, 
  Apple, 
  Terminal, 
  ShieldCheck, 
  Copy, 
  Check, 
  Code2, 
  Cpu, 
  Settings, 
  Layers, 
  RefreshCw,
  ExternalLink,
  Info,
  CheckCircle,
  Play,
  Chrome
} from 'lucide-react';
import { BotFilters } from '../types';

interface PlatformSetupProps {
  onAddLog: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'competitor' | 'expire' | 'warning', 
    message: string, 
    offerId?: string, 
    badge?: string
  ) => void;
  activeDomain: string;
  filters: BotFilters;
  isMaintenanceMode: boolean;
  setIsMaintenanceMode: (val: boolean) => void;
  isSystemIntegrityEnabled: boolean;
  setIsSystemIntegrityEnabled: (val: boolean) => void;
}

type TabType = 'ios' | 'mac' | 'pc';

export default function PlatformSetup({ 
  onAddLog, 
  activeDomain, 
  filters, 
  isMaintenanceMode, 
  setIsMaintenanceMode,
  isSystemIntegrityEnabled,
  setIsSystemIntegrityEnabled
}: PlatformSetupProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ios');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  
  // Simulated state for iOS configuration profile
  const [iosProfileStatus, setIosProfileStatus] = useState<'Not Installed' | 'Downloading' | 'Verified'>('Not Installed');
  // Simulated state for Mac/PC companion daemon process
  const [daemonActive, setDaemonActive] = useState<boolean>(false);
  const [macTermLog, setMacTermLog] = useState<string[]>([]);
  const [isCompilingMacScript, setIsCompilingMacScript] = useState<boolean>(false);

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    onAddLog('info', `Copied companion script chunk to clipboard (${id.toUpperCase()})`, undefined, 'COPY');
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 1500);
  };

  // iOS Profile installation simulation
  const handleInstallIosProfile = () => {
    setIosProfileStatus('Downloading');
    onAddLog('info', `Initiating .mobileconfig payload download for client domain ${activeDomain}...`, undefined, 'IOS_INIT');
    
    setTimeout(() => {
      onAddLog('info', `✅ Download complete. Awaiting user trust verification in iOS Settings -> General -> VPN & Device Management.`, undefined, 'IOS_PROV');
      setIosProfileStatus('Verified');
      onAddLog('info', `🚀 iOS Proxy Gateway registered. Outbound Spark API endpoints targeted of client driver app are now proxied.`, undefined, 'IOS_VERIFIED');
    }, 1500);
  };

  // Compile macOS companion binary
  const handleCompileMacScript = () => {
    setIsCompilingMacScript(true);
    setMacTermLog(['$ clang++ -O3 -std=c++17 -o hacyber_mac_companion main.cpp', 'Compiling modules for Apple Silicon architecture...']);
    onAddLog('info', `Compiling macOS native screen accessibility supervisor script matching filters...`, undefined, 'MAC_COMP_INIT');
    
    setTimeout(() => {
      setMacTermLog(prev => [
        ...prev,
        'Linking CoreBluetooth & CoreGraphics framework libraries...',
        `Checking integration domain mapping -> https://${activeDomain}/api/dispatch`,
        '✅ Compilation succeeded: ./hacyber_mac_companion ready.'
      ]);
      setIsCompilingMacScript(false);
      onAddLog('info', `✅ Success: macOS screen automation driver compiled and matched with dispatch filter schema.`, undefined, 'MAC_COMP_OK');
    }, 1800);
  };

  const toggleCompanionDaemon = () => {
    const nextState = !daemonActive;
    setDaemonActive(nextState);
    if (nextState) {
      onAddLog('info', `Started background WebSocket telemetry listener for multi-instance PC dispatchers.`, undefined, 'DAEMON_UP');
    } else {
      onAddLog('info', `Disconnected background telemetry companion daemon.`, undefined, 'DAEMON_DOWN');
    }
  };

  // Custom dynamically tailored macOS control command based on state
  const macCommandSnippet = `curl -sSL https://${activeDomain}/scripts/mac_install.sh | bash \\
  --domain="${activeDomain}" \\
  --min-pay=${filters.minTotalPay} \\
  --max-miles=${filters.maxDistance} \\
  --reaction=${filters.reactionSpeedMs}`;

  const iosProxyConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
  <key>PayloadDisplayName</key>
  <string>HACYBER-SPARK-PROXY-${activeDomain}</string>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>Rules</key>
  <array>
    <dict>
      <key>Host</key>
      <string>sparkchecker.walmart.com</string>
      <key>RedirectURL</key>
      <string>https://${activeDomain}/api/intercept</string>
    </dict>
  </array>
</dict>
</plist>`;

  const pcCompanionConfigJson = JSON.stringify({
    client_version: "2.4.1",
    credentials_bound: `auth.${activeDomain}`,
    listener_port: 8443,
    active_filters: {
      min_total_pay: filters.minTotalPay,
      max_distance: filters.maxDistance,
      min_pay_per_mile: filters.minPayPerMile,
      allowed_types: [
        filters.shopAndDeliver ? "ShopAndDeliver" : null,
        filters.curbsidePickup ? "CurbsidePickup" : null,
        filters.dotcomDelivery ? "DotcomDelivery" : null
      ].filter(Boolean)
    },
    use_low_level_tapper: true
  }, null, 2);

  return (
    <div className="flex flex-col gap-4 font-sans text-left">
      {/* Tab Header */}
      <div>
        <span className="text-[9px] font-mono text-neutral-500 block uppercase font-bold tracking-wider">4. COMPATIBILITY & CROSS-PLATFORM SETUPS</span>
        <p className="text-[9.5px] text-neutral-400 mt-1 leading-normal">
          Learn how to deploy and sync your dispatcher bot system on iPhones (iOS), macOS devices (Macs), and standard physical computers.
        </p>
      </div>

      {/* Maintenance Toggle */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-3 flex justify-between items-center gap-3">
        <div className="space-y-0.5">
          <span className="text-[9px] font-mono text-rose-300 uppercase block font-bold">MAINTENANCE MODE</span>
          <p className="text-[8px] text-rose-200/60 font-mono">Pauses offer spawning and alerts.</p>
        </div>
        <button
          onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
          className={`w-10 h-5 rounded-full flex items-center p-1 transition-all ${isMaintenanceMode ? 'bg-rose-500 justify-end' : 'bg-neutral-800 justify-start'}`}
        >
          <div className="w-3 h-3 bg-white rounded-full shadow" />
        </button>
      </div>

      {/* System Integrity Toggle */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3 flex justify-between items-center gap-3">
        <div className="space-y-0.5">
          <span className="text-[9px] font-mono text-emerald-300 uppercase block font-bold">SYSTEM INTEGRITY</span>
          <p className="text-[8px] text-emerald-200/60 font-mono">Runs real-time packet loss security audits.</p>
        </div>
        <button
          onClick={() => setIsSystemIntegrityEnabled(!isSystemIntegrityEnabled)}
          className={`w-10 h-5 rounded-full flex items-center p-1 transition-all ${isSystemIntegrityEnabled ? 'bg-emerald-500 justify-end' : 'bg-neutral-800 justify-start'}`}
        >
          <div className="w-3 h-3 bg-white rounded-full shadow" />
        </button>
      </div>

      {/* OS Toggle Buttons */}
      <div className="flex gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-900/60 select-none">
        <button
          onClick={() => setActiveTab('ios')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'ios'
              ? 'bg-neutral-900 text-amber-500 border border-amber-500/20 shadow'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Smartphone className="w-3 h-3 shrink-0" />
          <span>iOS (iPhone)</span>
        </button>
        <button
          onClick={() => setActiveTab('mac')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'mac'
              ? 'bg-neutral-900 text-amber-500 border border-amber-500/20 shadow'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Apple className="w-3 h-3 shrink-0" />
          <span>macOS (Mac)</span>
        </button>
        <button
          onClick={() => setActiveTab('pc')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'pc'
              ? 'bg-neutral-900 text-amber-500 border border-amber-500/20 shadow'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Laptop className="w-3 h-3 shrink-0" />
          <span>Computer (PC/Linux)</span>
        </button>
      </div>

      {/* Main OS setup panels */}
      <div className="space-y-3.5">
        <AnimatePresence mode="wait">
          {activeTab === 'ios' && (
            <motion.div
              key="ios-panel"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-3"
            >
              {/* Informational callout */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[9px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>HOW THE BOT WORKS ON iOS (IPHONE)</span>
                </div>
                <p className="text-[9px] text-neutral-400 font-sans leading-normal">
                  iOS doesn't permit standard Android tap overlays. Instead, the bot works by running a **Secure Local Redirect Proxy** via a **Mobile Config Profile (.mobileconfig)**. Outbound Spark API telemetry requests are securely rerouted to your integrated URL (<strong>{activeDomain}</strong>), evaluating and accepting payloads without requiring phone jailbreaking.
                </p>
              </div>

              {/* Install simulated mobile profile */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 flex justify-between items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-[7.5px] font-mono text-neutral-500 uppercase block">SIMULATED GATEWAY STATUS</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${iosProfileStatus === 'Verified' ? 'bg-emerald-400' : 'bg-neutral-700'} animate-pulse`} />
                    <span className="text-[9px] font-mono text-white font-bold uppercase">{iosProfileStatus}</span>
                  </div>
                </div>

                <button
                  onClick={handleInstallIosProfile}
                  disabled={iosProfileStatus === 'Downloading' || iosProfileStatus === 'Verified'}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-mono font-bold text-[9px] rounded-md transition-colors cursor-pointer"
                >
                  {iosProfileStatus === 'Not Installed' && 'Install Redirect Profile'}
                  {iosProfileStatus === 'Downloading' && 'Sending file...'}
                  {iosProfileStatus === 'Verified' && 'Connected & Enforced ✓'}
                </button>
              </div>

              {/* Mobileconfig Payload Preview */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase">iOS Mobileconfig XML Core Snippet</span>
                  <button 
                    onClick={() => handleCopyText(iosProxyConfigXml, 'ios_xml')}
                    className="text-[8px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 uppercase"
                  >
                    {copiedStates['ios_xml'] ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedStates['ios_xml'] ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-neutral-950 border border-neutral-900 rounded-lg p-2.5 text-neutral-400 text-[8px] font-mono leading-relaxed overflow-x-auto select-all max-h-[120px] scrollbar-thin">
                  {iosProxyConfigXml}
                </pre>
              </div>
            </motion.div>
          )}

          {activeTab === 'mac' && (
            <motion.div
              key="mac-panel"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-3"
            >
              <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[9px] font-bold">
                  <Terminal className="w-3.5 h-3.5 shrink-0" />
                  <span>HOW THE BOT WORKS ON macOS AND APPLET DEVICES</span>
                </div>
                <p className="text-[9px] text-neutral-400 font-sans leading-normal">
                  On a Mac, if you choose to connect an Android Emulator (like BlueStacks or MuMu) or run the Spark iOS App in Apple Silicon compatibility mode, you can control input and trigger rapid accept taps using a native compiled module. This module monitors order feeds through API event hooks and executes high-speed target clicks.
                </p>
              </div>

              {/* Compile C++ Script Button and Log panel */}
              <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-neutral-400 block uppercase">NATIVE MAC COMPILER</span>
                  <button
                    onClick={handleCompileMacScript}
                    disabled={isCompilingMacScript}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 hover:border-amber-500/30 border border-neutral-800 text-amber-500 font-mono text-[8.5px] font-bold rounded flex items-center gap-1"
                  >
                    {isCompilingMacScript && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                    <span>COMPILE MAC DAEMON SCRIPT</span>
                  </button>
                </div>

                {macTermLog.length > 0 && (
                  <div className="bg-neutral-950 p-2 font-mono text-[8.5px] leading-relaxed rounded border border-neutral-900 text-neutral-300 max-h-[110px] overflow-y-auto scrollbar-thin">
                    {macTermLog.map((logLine, idx) => (
                      <div key={idx} className={logLine && logLine.startsWith('✅') ? 'text-emerald-400' : logLine && logLine.startsWith('$') ? 'text-neutral-500' : 'text-neutral-350'}>
                        {logLine || ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom one-line curl installer command snippet */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase">One-Line Terminal Installer Command (Syncs Active Filters)</span>
                  <button 
                    onClick={() => handleCopyText(macCommandSnippet, 'mac_curl')}
                    className="text-[8px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 uppercase"
                  >
                    {copiedStates['mac_curl'] ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedStates['mac_curl'] ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-2.5 text-neutral-300 text-[8.5px] font-mono max-w-full break-all leading-normal relative select-all overflow-x-auto whitespace-pre">
                  {macCommandSnippet}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'pc' && (
            <motion.div
              key="pc-panel"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-3"
            >
              <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[9px] font-bold">
                  <Cpu className="w-3.5 h-3.5 shrink-0" />
                  <span>HOW THE BOT WORKS ON COMPUTERS (WINDOWS/LINUX)</span>
                </div>
                <p className="text-[9px] text-neutral-400 font-sans leading-normal">
                  On standard desktop computers, the bot is deployed either via a lightweight **Windows Companion Daemon (.exe)** or an integrated **Chrome DevTools Extension**. It acts as a client that establishes a continuous real-time WebSocket connection to your dispatch server, coordinating driver task notifications instantly.
                </p>
              </div>

              {/* PC Daemon control panel */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 flex justify-between items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-[7.5px] font-mono text-neutral-500 uppercase block">PC DESKTOP COMPANION DAEMON</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${daemonActive ? 'bg-emerald-400' : 'bg-neutral-700'} animate-pulse`} />
                    <span className="text-[9px] font-mono text-white font-bold uppercase">{daemonActive ? 'ACTIVE WEBSOCKET ON' : 'STOPPED'}</span>
                  </div>
                </div>

                <button
                  onClick={toggleCompanionDaemon}
                  className={`px-3 py-1.5 font-mono font-bold text-[9px] rounded-md transition-all cursor-pointer ${
                    daemonActive 
                      ? 'bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400' 
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                  }`}
                >
                  {daemonActive ? 'Stop Companion Connection' : 'Start Companion Integration'}
                </button>
              </div>

              {/* JSON companion config model */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase">Companion Configuration JSON</span>
                  <button 
                    onClick={() => handleCopyText(pcCompanionConfigJson, 'pc_json')}
                    className="text-[8px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 uppercase"
                  >
                    {copiedStates['pc_json'] ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedStates['pc_json'] ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-neutral-950 border border-neutral-900 rounded-lg p-2.5 text-neutral-400 text-[8px] font-mono leading-relaxed overflow-x-auto select-all max-h-[120px] scrollbar-thin">
                  {pcCompanionConfigJson}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/80 text-neutral-500 text-[8px] flex items-start gap-1.5 leading-normal">
        <Info className="w-3 h-3 text-amber-500/80 shrink-0 mt-0.5" />
        <span>By syncing active filter parameters, commands and scripts automatically mirror compliance thresholds: Accept orders with minimum $<strong>{filters.minTotalPay}</strong> pay, under <strong>{filters.maxDistance}</strong> miles, targeting selected categories.</span>
      </div>
    </div>
  );
}
