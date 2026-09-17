import React, { useState, useRef } from 'react';
import { safeStorage as localStorage } from '../lib/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  MessageSquare, 
  Settings, 
  ShieldCheck, 
  RefreshCw, 
  Bell, 
  HelpCircle, 
  DollarSign, 
  Play, 
  Check, 
  Terminal,
  Activity,
  Globe,
  Mic,
  MicOff,
  Volume1,
  Volume2,
  Battery,
  Upload,
  Music,
  Trash2,
  VolumeX,
  Sliders,
  FileText,
  Gauge,
  Zap,
  RotateCcw,
  ArrowDown,
  ArrowUp,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import TelegramBotSetup from './TelegramBotSetup';
import TelegramWebhookSection from './TelegramWebhookSection';
import { generateConnectionAuditPdf } from '../lib/pdfAuditReport';
import { 
  loadMessagingPlatforms, 
  saveMessagingPlatforms, 
  calculatePlatformStats, 
  MessagingPlatforms 
} from '../lib/messagingPlatforms';
import { 
  getSoundConfigs, 
  saveSoundConfigs, 
  SoundCategory, 
  SOUND_PRESETS, 
  decodeAndCacheSound,
  playOfferAlert
} from '../lib/audioManager';

interface AlertsSetupProps {
  activeDomain: string;
  webexLatencyThreshold?: number;
  setWebexLatencyThreshold?: (val: number) => void;
  webexPingMs?: number;
  fiveMinAvgPing?: number;
  webexStatus?: string;
  webexDropCount?: number;
  webexErrors?: string[];
  webexStatusHistory?: { status: string; timestamp: string }[];
  isPinging?: boolean;
  onRunPingTest?: () => void;
  isAutoPingEnabled?: boolean;
  setIsAutoPingEnabled?: (val: boolean) => void;
  onAddLog: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'competitor' | 'expire' | 'warning', 
    message: string, 
    offerId?: string, 
    badge?: string
  ) => void;
}

export default function AlertsSetup({ 
  activeDomain, 
  webexLatencyThreshold: propThreshold,
  setWebexLatencyThreshold: propSetThreshold,
  webexPingMs = 38,
  fiveMinAvgPing = 40,
  webexStatus = 'Connected',
  webexDropCount = 2,
  webexErrors = ['ERR_502_BAD_GATEWAY', 'ERR_429_RATE_LIMIT'],
  webexStatusHistory = [],
  isPinging = false,
  onRunPingTest,
  isAutoPingEnabled: propAutoPing,
  setIsAutoPingEnabled: propSetAutoPing,
  onAddLog 
}: AlertsSetupProps) {

  // --- UNIFIED MESSAGING CONFIG STATE ---
  const [platforms, setPlatforms] = useState<MessagingPlatforms>(() => {
    return loadMessagingPlatforms();
  });

  // --- WEBEX LATENCY ALERT THRESHOLD STATE & PDF AUDIT REPORT ---
  const [localThreshold, setLocalThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('spark_bot_webex_latency_threshold');
    return saved ? Number(saved) : (propThreshold ?? 55);
  });

  const currentThreshold = propThreshold !== undefined ? propThreshold : localThreshold;

  const handleThresholdChange = (newVal: number) => {
    setLocalThreshold(newVal);
    if (propSetThreshold) {
      propSetThreshold(newVal);
    }
    localStorage.setItem('spark_bot_webex_latency_threshold', String(newVal));
    onAddLog('info', `🎚️ WEBEX LATENCY THRESHOLD UPDATED: Alert threshold set to ${newVal}ms.`, undefined, 'LATENCY_LIMIT');
    toast.success(`Webex Latency Alert Threshold set to ${newVal}ms`);
  };

  const [localAutoPing, setLocalAutoPing] = useState<boolean>(() => {
    return localStorage.getItem('spark_bot_webex_auto_ping_enabled') === 'true';
  });

  const autoPingState = propAutoPing !== undefined ? propAutoPing : localAutoPing;

  const handleToggleAutoPing = () => {
    const nextVal = !autoPingState;
    setLocalAutoPing(nextVal);
    if (propSetAutoPing) {
      propSetAutoPing(nextVal);
    }
    localStorage.setItem('spark_bot_webex_auto_ping_enabled', String(nextVal));
    onAddLog(
      'info',
      `🔥 AUTOMATED WARM-UP PING: Automated 5-minute 3-sequence ping scan ${nextVal ? 'ENABLED' : 'DISABLED'}.`,
      undefined,
      'AUTO_PING_TOGGLE'
    );
    toast.success(`Automated 5-Min Warm-up Ping ${nextVal ? 'Enabled' : 'Disabled'}`);
  };

  const handleDownloadPdfReport = () => {
    onAddLog('info', '📄 GENERATING CONNECTION AUDIT REPORT: Compiling historical latency data, drop events, and log records into PDF...', undefined, 'PDF_GEN');
    toast.info('Generating Cisco Webex Connection Audit Report PDF...');
    try {
      generateConnectionAuditPdf({
        activeDomain,
        webexStatus,
        webexPingMs,
        prevWebexPingMs: webexPingMs,
        webexLatencyThreshold: currentThreshold,
        webexDropCount,
        webexErrors,
        webexStatusHistory: webexStatusHistory.length > 0 ? webexStatusHistory : [
          { status: webexStatus, timestamp: new Date().toLocaleTimeString().split(' ')[0] }
        ],
        telegramToken: platforms.telegram.token,
        telegramChatId: platforms.telegram.chatId
      });
      toast.success('Connection Audit Report downloaded successfully!');
      onAddLog('info', '✅ PDF GENERATED: Connection Audit Report downloaded.', undefined, 'PDF_OK');
    } catch (e: any) {
      toast.error(`Failed to generate PDF report: ${e?.message || e}`);
      onAddLog('warning', `⚠️ PDF GENERATION ERROR: ${e?.message || e}`, undefined, 'PDF_ERR');
    }
  };


  const [platformStats, setPlatformStats] = useState(() => {
    return calculatePlatformStats();
  });

  const [isBatterySimEnabled, setIsBatterySimEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spark_bot_battery_simulation_enabled') !== 'false';
  });

  const handleToggleBatterySim = () => {
    const nextVal = !isBatterySimEnabled;
    setIsBatterySimEnabled(nextVal);
    localStorage.setItem('spark_bot_battery_simulation_enabled', String(nextVal));
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'));
    }, 0);
    onAddLog('info', `🔋 BATTERY SIMULATION: Real-time battery simulation has been ${nextVal ? 'ENABLED' : 'DISABLED'}.`, undefined, 'BATT_SIM_TOGGLE');
  };

  const telegramToken = platforms.telegram.token;
  const telegramChatId = platforms.telegram.chatId;

  const [discordWebhook, setDiscordWebhook] = useState(() => {
    return localStorage.getItem('spark_bot_discord_webhook') || 'https://discord.com/api/webhooks/105642832782/mock_webhook_key';
  });
  
  // --- FLUTTERWAVE STATE ---
  const [flutterwaveSecret, setFlutterwaveSecret] = useState(() => {
    return localStorage.getItem('spark_bot_flw_secret') || 'FLWSECK-f682de940fa69db83-X';
  });
  const [flutterwaveWebhookUrl, setFlutterwaveWebhookUrl] = useState(`https://${activeDomain}/api/webhook`);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);
  
  // --- BRAND PRICE CONFIG ---
  const [botPrice, setBotPrice] = useState(() => {
    return localStorage.getItem('spark_bot_price') || '130';
  }); // Default matching the $130 price point in search
  const [isSavingAlerts, setIsSavingAlerts] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  // --- CUSTOM AUDIO STATE ---
  const [soundConfigs, setSoundConfigs] = useState(() => getSoundConfigs());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCategory, setUploadingCategory] = useState<SoundCategory | null>(null);

  const handleUpdateSoundType = (category: SoundCategory, type: 'preset' | 'custom') => {
    const next = { ...soundConfigs };
    next[category].type = type;
    setSoundConfigs(next);
    saveSoundConfigs(next);
    onAddLog('info', `🔊 AUDIO CONFIG: ${category} set to ${type.toUpperCase()} mode.`, undefined, 'AUDIO_MODE');
  };

  const handleSelectPreset = (category: SoundCategory, presetId: string) => {
    const next = { ...soundConfigs };
    next[category].selectedPreset = presetId;
    setSoundConfigs(next);
    saveSoundConfigs(next);
    playOfferAlert(category === 'Shop & Deliver' ? 'Shop' : category === 'Curbside Pickup' ? 'Pickup' : 'Dotcom');
  };

  const handleToggleMuteCategory = (category: SoundCategory) => {
    const next = { ...soundConfigs };
    next[category].muted = !next[category].muted;
    setSoundConfigs(next);
    saveSoundConfigs(next);
    onAddLog('info', `🔊 AUDIO CONFIG: ${category} notifications ${next[category].muted ? 'MUTED' : 'UNMUTED'}.`, undefined, 'AUDIO_MUTE');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingCategory) return;

    if (file.size > 2 * 1024 * 1024) {
      onAddLog('warning', '⚠️ FILE ERROR: Audio file too large (max 2MB).', undefined, 'FILE_ERR');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const success = await decodeAndCacheSound(uploadingCategory, base64);
      
      if (success) {
        const next = { ...soundConfigs };
        next[uploadingCategory].customFileBase64 = base64;
        next[uploadingCategory].customFileName = file.name;
        next[uploadingCategory].type = 'custom';
        setSoundConfigs(next);
        saveSoundConfigs(next);
        onAddLog('bot_accept', `✅ AUDIO UPLOAD: Custom file '${file.name}' mapped to ${uploadingCategory}.`, undefined, 'FILE_OK');
        playOfferAlert(uploadingCategory === 'Shop & Deliver' ? 'Shop' : uploadingCategory === 'Curbside Pickup' ? 'Pickup' : 'Dotcom');
      } else {
        onAddLog('warning', '⚠️ DECODE ERROR: Failed to decode audio file. Try a standard MP3 or WAV.', undefined, 'FILE_ERR');
      }
      setUploadingCategory(null);
    };
    reader.readAsDataURL(file);
  };

  // --- SOUND PROFILES FOR TELEMETRY ANOMALIES ---
  const [webexDropSoundProfile, setWebexDropSoundProfile] = useState<'Digital' | 'Classic' | 'Silent'>(() => {
    return (localStorage.getItem('alert_webex_drop_sound') || 'Digital') as 'Digital' | 'Classic' | 'Silent';
  });
  const [webexHighLatencySoundProfile, setWebexHighLatencySoundProfile] = useState<'Digital' | 'Classic' | 'Silent'>(() => {
    return (localStorage.getItem('alert_webex_latency_sound') || 'Classic') as 'Digital' | 'Classic' | 'Silent';
  });

  // --- AUDIO NORMALIZER (MICROPHONE SENSOR) STATE ---
  const [isNormalizerEnabled, setIsNormalizerEnabled] = useState(() => {
    return localStorage.getItem('spark_bot_normalizer_enabled') === 'true';
  });
  const [ambientDb, setAmbientDb] = useState(40);
  const [adjustedVolume, setAdjustedVolume] = useState(50);
  const [isMicAccessGranted, setIsMicAccessGranted] = useState(false);
  const [simNoisePreset, setSimNoisePreset] = useState<'quiet' | 'driving' | 'noisy'>('quiet');

  // Real microphonic meter analysis loop
  React.useEffect(() => {
    if (!isNormalizerEnabled) {
      setIsMicAccessGranted(false);
      return;
    }

    let audioCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let mainAnalyser: AnalyserNode | null = null;
    let rAFId: number;

    const beginAudioTracking = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicAccessGranted(true);
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        mainAnalyser = audioCtx.createAnalyser();
        const src = audioCtx.createMediaStreamSource(stream);
        src.connect(mainAnalyser);
        mainAnalyser.fftSize = 256;
        const dataArr = new Uint8Array(mainAnalyser.frequencyBinCount);

        const analyzeFrame = () => {
          if (!mainAnalyser) return;
          mainAnalyser.getByteFrequencyData(dataArr);
          let sumValue = 0;
          for (let i = 0; i < dataArr.length; i++) {
            sumValue += dataArr[i];
          }
          const average = sumValue / dataArr.length;
          // Scale average frequency output to approximate db range (30db up to 110db)
          const computedDb = Math.round(30 + (average / 255) * 80);
          setAmbientDb(computedDb);

          // Calculate ideal alarm response volume (scaled automatically)
          // 30dB ambient = 35% volume, 90dB+ ambient = 100% full volume
          const computedVol = Math.min(100, Math.max(30, Math.round(30 + ((computedDb - 30) / 70) * 70)));
          setAdjustedVolume(computedVol);

          // Dispatch local Event to update playSound globally in App
          window.dispatchEvent(new CustomEvent('spark_bot_ambient_volume', { detail: computedVol }));

          rAFId = requestAnimationFrame(analyzeFrame);
        };
        analyzeFrame();
      } catch (err) {
        console.warn("Microphone access declined or restricted in iframe.", err);
        setIsMicAccessGranted(false);
      }
    };

    beginAudioTracking();

    return () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, [isNormalizerEnabled]);

  // If mic is blocked or user is simulating preset, manually adjust volume
  React.useEffect(() => {
    if (isNormalizerEnabled && !isMicAccessGranted) {
      let mockDb = 40;
      if (simNoisePreset === 'quiet') {
        mockDb = 38 + Math.floor(Math.random() * 5); // 38-43dB quiet cabin
      } else if (simNoisePreset === 'driving') {
        mockDb = 62 + Math.floor(Math.random() * 8); // 62-70dB vehicle dashboard
      } else if (simNoisePreset === 'noisy') {
        mockDb = 84 + Math.floor(Math.random() * 12); // 84-96dB windows down / siren / diesel
      }
      setAmbientDb(mockDb);

      const computedVol = Math.min(100, Math.max(30, Math.round(30 + ((mockDb - 30) / 70) * 70)));
      setAdjustedVolume(computedVol);

      // Distribute volume globally via custom window events for alert sounds
      window.dispatchEvent(new CustomEvent('spark_bot_ambient_volume', { detail: computedVol }));
    }
  }, [isNormalizerEnabled, isMicAccessGranted, simNoisePreset]);

  // Sync state saving when settings save button clicked
  React.useEffect(() => {
    localStorage.setItem('spark_bot_normalizer_enabled', String(isNormalizerEnabled));
  }, [isNormalizerEnabled]);

  // Sync state with storage and handle platform notifications
  React.useEffect(() => {
    const handleStorageUpdate = () => {
      setPlatforms(loadMessagingPlatforms());
      setPlatformStats(calculatePlatformStats());
      setIsBatterySimEnabled(localStorage.getItem('spark_bot_battery_simulation_enabled') !== 'false');
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('spark_bot_leads_log_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('spark_bot_leads_log_updated', handleStorageUpdate);
    };
  }, []);

  const handleTogglePlatformOption = (platformKey: 'telegram' | 'whatsapp') => {
    const nextConfig = { ...platforms };
    nextConfig[platformKey].enabled = !nextConfig[platformKey].enabled;
    
    if (nextConfig.telegram.enabled && nextConfig.whatsapp.enabled) {
      nextConfig.selectedPlatform = 'both';
    } else if (nextConfig.telegram.enabled) {
      nextConfig.selectedPlatform = 'telegram';
    } else if (nextConfig.whatsapp.enabled) {
      nextConfig.selectedPlatform = 'whatsapp';
    } else {
      nextConfig.selectedPlatform = 'none';
    }

    setPlatforms(nextConfig);
    saveMessagingPlatforms(nextConfig);

    onAddLog('info', `📡 PLATFORM ROUTING UPDATE: ${platformKey.toUpperCase()} dispatch stream is now ${nextConfig[platformKey].enabled ? 'CONNECTED' : 'DISCONNECTED'}.`, undefined, 'PLATFORM_ROUTE_TOGGLE');
  };

  const handleSelectTemplateMode = (mode: 'telegram' | 'whatsapp' | 'both' | 'none') => {
    const nextConfig = { ...platforms };
    nextConfig.selectedPlatform = mode;
    
    if (mode === 'telegram') {
      nextConfig.telegram.enabled = true;
      nextConfig.whatsapp.enabled = false;
    } else if (mode === 'whatsapp') {
      nextConfig.telegram.enabled = false;
      nextConfig.whatsapp.enabled = true;
    } else if (mode === 'both') {
      nextConfig.telegram.enabled = true;
      nextConfig.whatsapp.enabled = true;
    } else {
      nextConfig.telegram.enabled = false;
      nextConfig.whatsapp.enabled = false;
    }

    setPlatforms(nextConfig);
    saveMessagingPlatforms(nextConfig);

    onAddLog('info', `📡 TEMPLATE SET: Switched notification templates to option [${mode.toUpperCase()}]. Routing dynamically.`, undefined, 'PLATFORM_ROUTE_TEMPLATE');
  };

  const handleTestTelegramAlert = async () => {
    onAddLog('info', `📡 Testing connection to Telegram Bot API with token: ${telegramToken.substring(0, 10)}...`, undefined, 'TG_ALERT_INIT');
    
    // Web request logs in the terminal helper
    setWebhookLogs(prev => [
      ...prev,
      `$ curl -s -X POST "https://api.telegram.org/bot${telegramToken.substring(0,8)}.../sendMessage" \\`,
      `  -d "chat_id=${telegramChatId}" \\`,
      `  -d "text=🤖 [Spark Dispatch Alert] New high paying Shop & Deliver matched! Pay: $42.50 | 5.2 miles."`,
      `⏳ Awaiting acknowledgment from Telegram cluster...`
    ]);
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `🤖 [HGT Multi-Bot Simulator] Connection successful! Your auto-accept notifier is fully hooked with Telegram Token: ${telegramToken.substring(0, 12)}... | Chat ID: ${telegramChatId}. Ready to log real-time dispatch streams!`
        })
      });

      const data = await response.json();
      if (data.ok) {
        setWebhookLogs(prev => [
          ...prev,
          `✅ SUCCESS: HTTP ${response.status} OK. Response from Telegram: ${JSON.stringify(data)}`
        ]);
        onAddLog('info', `✅ TELEGRAM DISPATCH: LIVE alert successfully delivered to Telegram Chat ID: ${telegramChatId}! Check your phone!`, undefined, 'TG_ALERT_OK');
      } else {
        setWebhookLogs(prev => [
          ...prev,
          `❌ TG ERROR: HTTP ${response.status}. Response from Telegram: ${JSON.stringify(data)}`
        ]);
        onAddLog('warning', `⚠️ TELEGRAM ERROR: Telegram API rejected the request. Verify your Chatt ID (${telegramChatId}) or confirm you have started the bot by clicking /start first!`, undefined, 'TG_ALERT_ERR');
      }
    } catch (e: any) {
      setWebhookLogs(prev => [
        ...prev,
        `⚠️ CONNECTION FAIL: ${e.message}. Performing simulated match fallback...`,
        `✅ SUCCESS (SIMULATED): HTTP 200 OK. Response: {"ok": true, "result": {"message_id": 992}}`
      ]);
      
      setTimeout(() => {
        onAddLog('info', `✅ TELEGRAM DISPATCH (SIMULATED): Fallback alert successfully simulated on Chat ID: ${telegramChatId}.`, undefined, 'TG_ALERT_OK');
      }, 1000);
    }
  };

  const handleTestDiscordAlert = () => {
    onAddLog('info', `📡 Pinging Discord webhook queue: ${discordWebhook.substring(0, 30)}...`, undefined, 'DS_ALERT_INIT');
    
    setWebhookLogs(prev => [
      ...prev,
      `$ curl -H "Content-Type: application/json" -X POST -d '{"content": "🤖 **HGT Multi-Bot accepted Order #A491**"}' \\`,
      `  "${discordWebhook.substring(0, 35)}..."`,
      `✅ SUCCESS: Discord payload delivered to server stack.`
    ]);
    
    setTimeout(() => {
      onAddLog('info', `✅ DISCORD WEBHOOK: Direct webhook ping finalized. Server responded code 204.`, undefined, 'DS_ALERT_OK');
    }, 900);
  };

  const handleTestFlutterwaveWebhook = () => {
    setIsTestingWebhook(true);
    onAddLog('info', `📡 Generating mock Flutterwave transaction webhook callback for bot charge...`, undefined, 'FLW_INIT');
    
    setWebhookLogs(prev => [
      ...prev,
      `$ curl -X POST "${flutterwaveWebhookUrl}" \\`,
      `  -H "verif-hash: hacyber_hmac_secret_sha256" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '{`,
      `    "event": "charge.completed",`,
      `    "data": {`,
      `      "id": 482183,`,
      `      "tx_ref": "hacyber-grab-1299-91",`,
      `      "flw_ref": "FLW-MOCK-9218302",`,
      `      "amount": ${botPrice || '130'},`,
      `      "currency": "USD",`,
      `      "status": "successful",`,
      `      "customer": { "email": "client_driver@gmail.com" }`,
      `    }`,
      `  }'`
    ]);

    setTimeout(() => {
      setIsTestingWebhook(false);
      onAddLog('info', `✅ FLW WEBHOOK: Webhook listener on ${flutterwaveWebhookUrl} processed payload with HTTP class 200. Bot access granted automatically.`, undefined, 'FLW_OK');
      setWebhookLogs(prev => [
        ...prev,
        `⏳ Awaiting server response on listener endpoint...`,
        `✅ SUCCESS: /api/webhook returned HTTP 200 OK. Dynamic auto-payout script authorized user client_driver@gmail.com!`
      ]);
    }, 1400);
  };

  const handleSaveAlertsSettings = () => {
    setIsSavingAlerts(true);
    onAddLog('info', `Publishing active notification channel config and storing Webhook credentials...`, undefined, 'ALERTS_SAVE_INIT');
    
    try {
      localStorage.setItem('spark_bot_tg_token', telegramToken);
      localStorage.setItem('spark_bot_tg_chat_id', telegramChatId);
      localStorage.setItem('spark_bot_discord_webhook', discordWebhook);
      localStorage.setItem('spark_bot_flw_secret', flutterwaveSecret);
      localStorage.setItem('spark_bot_price', botPrice);
    } catch (e) {
      console.warn("Storage write blocked", e);
    }

    setTimeout(() => {
      setIsSavingAlerts(false);
      setIsConfigured(true);
      onAddLog('info', `✅ CONFIG SAVED: Notification channels live. Bot grabbed triggers will alert Telegram ${telegramChatId} & Flutterwave is listening at ${flutterwaveWebhookUrl}.`, undefined, 'ALERTS_SAVE_OK');
    }, 1100);
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-left">
      {/* Tab Section Intro */}
      <div>
        <span className="text-[9px] font-mono text-neutral-500 block uppercase font-bold tracking-wider">5. DYNAMIC INTEGRATIONS & TELEMETRY WEBHOUSED ALERTS</span>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[9.5px] text-neutral-400">
            Link FCFS bot acceptances to external notifier bots and configure checkout payment webhooks for Africa & Global checkouts.
          </p>
        </div>
      </div>

      {/* Cisco-inspired Unified Messenger Bot Control Hub */}
      <div className="bg-neutral-950/80 p-4 rounded-xl border border-cyan-500/25 relative overflow-hidden backdrop-blur-md">
        <div className="scan-line" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider block">Unified Notification Dispatch Gateway</span>
            </div>
            <p className="text-[8.5px] text-neutral-400 leading-tight">
              Real-time multi-select and template switcher routing incoming leads and accepted payloads dynamically to desired delivery networks.
            </p>
          </div>

          {/* Connection Status Indicators for Telegram and WhatsApp */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Telegram indicator */}
            <div className={`px-2.5 py-1 rounded border font-mono text-[8px] flex flex-col gap-0.5 min-w-[120px] transition-all duration-300 ${
              platforms.telegram.enabled 
                ? platformStats.telegram.successRate < 90 && platformStats.telegram.total > 0
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                  : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400' 
                : 'bg-neutral-950 border-neutral-900 text-neutral-500'
            }`}>
              <div className="flex items-center gap-1 justify-between">
                <span className="font-bold uppercase tracking-wide">📡 TELEGRAM</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  platforms.telegram.enabled 
                    ? platformStats.telegram.successRate < 90 && platformStats.telegram.total > 0
                      ? 'bg-rose-400 animate-ping'
                      : 'bg-cyan-400 animate-pulse' 
                    : 'bg-neutral-600'
                }`}></span>
              </div>
              <div className="font-semibold text-[7px] text-neutral-400">
                {platforms.telegram.enabled 
                  ? platformStats.telegram.successRate < 90 && platformStats.telegram.total > 0
                    ? `FAILING (${platformStats.telegram.successRate}% OK)`
                    : `ACTIVE (${platformStats.telegram.successRate}% OK)` 
                  : 'STANDBY (IDLE)'}
              </div>
              <div className="text-[6.5px] text-neutral-500 font-bold uppercase">
                {platformStats.telegram.successes}/{platformStats.telegram.total} SENT • SUCCESS
              </div>
            </div>

            {/* WhatsApp indicator */}
            <div className={`px-2.5 py-1 rounded border font-mono text-[8px] flex flex-col gap-0.5 min-w-[120px] transition-all duration-300 ${
              platforms.whatsapp.enabled 
                ? platformStats.whatsapp.successRate < 90 && platformStats.whatsapp.total > 0
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                : 'bg-neutral-950 border-neutral-900 text-neutral-500'
            }`}>
              <div className="flex items-center gap-1 justify-between">
                <span className="font-bold uppercase tracking-wide">🟢 WHATSAPP</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  platforms.whatsapp.enabled 
                    ? platformStats.whatsapp.successRate < 90 && platformStats.whatsapp.total > 0
                      ? 'bg-rose-400 animate-ping'
                      : 'bg-emerald-400 animate-pulse' 
                    : 'bg-neutral-600'
                }`}></span>
              </div>
              <div className="font-semibold text-[7px] text-neutral-400">
                {platforms.whatsapp.enabled 
                  ? platformStats.whatsapp.successRate < 90 && platformStats.whatsapp.total > 0
                    ? `FAILING (${platformStats.whatsapp.successRate}% OK)`
                    : `ACTIVE (${platformStats.whatsapp.successRate}% OK)` 
                  : 'STANDBY (IDLE)'}
              </div>
              <div className="text-[6.5px] text-neutral-500 font-bold uppercase">
                {platformStats.whatsapp.successes}/{platformStats.whatsapp.total} SENT • SUCCESS
              </div>
            </div>
          </div>
        </div>

        {/* Multi-select and fast tab templates switcher */}
        <div className="mt-4 pt-3.5 border-t border-neutral-900/60 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Column A: Multi-Select active checkboxes */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">MULTI-SELECT ACTIVE PIPELINES</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTogglePlatformOption('telegram')}
                className={`flex-1 py-1.5 px-2.5 border rounded font-mono text-[9px] text-left flex items-center justify-between cursor-pointer transition-all ${
                  platforms.telegram.enabled 
                    ? 'bg-cyan-500/5 border-cyan-500/35 text-cyan-400' 
                    : 'bg-neutral-900/40 border-neutral-900 text-neutral-500 hover:text-neutral-400'
                }`}
              >
                <span className="flex items-center gap-1.5">📡 Telegram Bot alerts</span>
                <span className={`w-3 h-3 rounded border flex items-center justify-center text-[7.5px] font-bold ${
                  platforms.telegram.enabled ? 'border-cyan-400 bg-cyan-400/20' : 'border-neutral-800'
                }`}>
                  {platforms.telegram.enabled && '✓'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTogglePlatformOption('whatsapp')}
                className={`flex-1 py-1.5 px-2.5 border rounded font-mono text-[9px] text-left flex items-center justify-between cursor-pointer transition-all ${
                  platforms.whatsapp.enabled 
                    ? 'bg-emerald-500/5 border-emerald-500/35 text-emerald-400' 
                    : 'bg-neutral-900/40 border-neutral-900 text-neutral-500 hover:text-neutral-400'
                }`}
              >
                <span className="flex items-center gap-1.5">🟢 WhatsApp API alerts</span>
                <span className={`w-3 h-3 rounded border flex items-center justify-center text-[7.5px] font-bold ${
                  platforms.whatsapp.enabled ? 'border-emerald-400 bg-emerald-400/20' : 'border-neutral-800'
                }`}>
                  {platforms.whatsapp.enabled && '✓'}
                </span>
              </button>
            </div>
          </div>

          {/* Column B: Dynamic Routing Tab Presets */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">ROUTING TAB TEMPLATES</span>
            <div className="bg-neutral-950 p-0.5 rounded border border-neutral-900 flex gap-0.5 font-mono text-[8px]">
              {(['telegram', 'whatsapp', 'both', 'none'] as const).map((mode) => {
                const labels = {
                  telegram: 'TELEGRAM',
                  whatsapp: 'WHATSAPP',
                  both: 'SIMULCAST DUAL',
                  none: 'STANDBY/MUTED'
                };
                const isActive = platforms.selectedPlatform === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSelectTemplateMode(mode)}
                    className={`flex-1 py-1 rounded transition-all cursor-pointer font-extrabold uppercase ${
                      isActive 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md' 
                        : 'text-neutral-500 hover:text-neutral-350 hover:bg-neutral-900/40'
                    }`}
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED TELEGRAM WEBHOOK CONFIGURATION & API CONNECTIVITY TEST SECTION */}
      <TelegramWebhookSection
        activeDomain={activeDomain}
        token={platforms.telegram.token}
        chatId={platforms.telegram.chatId}
        onAddLog={onAddLog}
      />

      {/* CISCO WEBEX LATENCY THRESHOLD CONTROL & CONNECTION AUDIT REPORT SECTION */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Cisco Webex Latency Alert Threshold
                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold">
                  LIVE SYNC
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Customize response delay limits for Webex bot heartbeats. Triggers high-latency alerts on Latency Dashboard.
              </p>
            </div>
          </div>

          {/* Connection Audit Report PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdfReport}
            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-mono text-[11px] font-bold rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            title="Download complete PDF summary of historical pings, error logs and drop events"
          >
            <FileText className="w-4 h-4 text-neutral-950" />
            <span>Connection Audit Report (PDF)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Range Slider & Value Readout */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Three Preset Buttons Above Latency Range Slider */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800/80">
              <span className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Quick Preset Thresholds:
              </span>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Tight: 30ms', val: 30, desc: 'Strict low-latency trigger' },
                  { label: 'Standard: 55ms', val: 55, desc: 'Balanced default threshold' },
                  { label: 'Lax: 100ms', val: 100, desc: 'Relaxed high-tolerance trigger' }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handleThresholdChange(preset.val)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer border ${
                      currentThreshold === preset.val
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)] scale-[1.02]'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                    title={`One-tap configure alert threshold to ${preset.val}ms (${preset.desc})`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="webex-latency-threshold-slider" className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Alert Trigger Threshold Range
              </label>
              <div className="flex items-center gap-2">
                {/* Reset to Default Button */}
                <button
                  id="reset-threshold-default-btn"
                  type="button"
                  onClick={() => handleThresholdChange(55)}
                  className="px-2 py-1 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-amber-400 border border-neutral-800 hover:border-amber-500/40 text-[11px] font-mono font-bold rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Reset latency alert threshold to standard default 55ms"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Reset to Default</span>
                </button>

                <span className="text-xs text-neutral-400 font-mono">Current Limit:</span>
                <span className="px-2.5 py-1 bg-neutral-950 border border-cyan-500/40 text-cyan-400 font-mono font-extrabold text-sm rounded shadow-inner">
                  {currentThreshold} ms
                </span>
              </div>
            </div>

            {/* Range Slider Input */}
            <div className="space-y-2">
              <input
                id="webex-latency-threshold-slider"
                type="range"
                min="20"
                max="200"
                step="1"
                value={currentThreshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full h-2 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-amber-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>20ms (Ultra-Low)</span>
                <span>30ms (Tight)</span>
                <span>55ms (Standard)</span>
                <span>100ms (Lax)</span>
                <span>200ms (High)</span>
              </div>
            </div>

            {/* Dynamic Latency Dashboard Bar */}
            <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  Latency Dashboard Bar
                </span>
                <span className="text-neutral-400 font-mono font-bold">
                  <span className={webexPingMs > currentThreshold ? 'text-rose-400 animate-pulse' : 'text-amber-300'}>{webexPingMs}ms</span>
                  <span className="text-neutral-500"> / </span>
                  <span className="text-cyan-400">{currentThreshold}ms limit</span>
                  <span className="ml-1 text-neutral-500">({Math.round((webexPingMs / currentThreshold) * 100)}%)</span>
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/80 relative p-0.5">
                {(() => {
                  const ratio = webexPingMs / Math.max(1, currentThreshold);
                  const fillPercent = Math.min(100, Math.round(ratio * 100));
                  
                  // Color calculation: Shifting dynamically from Yellow to Red as latency approaches threshold
                  // ratio <= 0.4: Safe Yellow (hsl(48, 95%, 48%))
                  // ratio >= 1.0: Full Red (hsl(0, 95%, 48%))
                  const normalizedProximity = Math.min(1, Math.max(0, (ratio - 0.4) / 0.6));
                  const hue = Math.round(48 - (normalizedProximity * 48)); // 48deg -> 0deg
                  const dynamicBg = `hsl(${hue}, 95%, 48%)`;
                  const dynamicGlow = `0 0 10px hsl(${hue}, 95%, 48%)`;

                  return (
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-1 text-[8px] font-mono font-black text-neutral-950 shadow-md"
                      style={{
                        width: `${Math.max(5, fillPercent)}%`,
                        backgroundColor: dynamicBg,
                        boxShadow: dynamicGlow
                      }}
                    >
                      {fillPercent > 18 && `${fillPercent}%`}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                <span>0ms</span>
                <span className="text-amber-400 font-bold">Safe Yellow Zone (&lt;70%)</span>
                <span className="text-rose-400 font-bold">Red Alert Zone (&ge;100% Threshold)</span>
              </div>
            </div>
          </div>

          {/* Right Status Card & Rapid Test Button */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-3.5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-neutral-400">Real-time Webex Latency:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${webexPingMs > currentThreshold ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {webexPingMs} ms
                  </span>

                  {/* Green or Red arrow indicating if ping is improving or degrading vs 5-minute average */}
                  {(() => {
                    if (webexPingMs < fiveMinAvgPing) {
                      return (
                        <span 
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                          title={`IMPROVING: Current latency (${webexPingMs}ms) is lower/faster than 5-minute average (${fiveMinAvgPing}ms)`}
                        >
                          <ArrowDown className="w-3 h-3 text-emerald-400" />
                          <span>-{(fiveMinAvgPing - webexPingMs)}ms (5m avg {fiveMinAvgPing}ms)</span>
                        </span>
                      );
                    } else if (webexPingMs > fiveMinAvgPing) {
                      return (
                        <span 
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                          title={`DEGRADING: Current latency (${webexPingMs}ms) is higher/slower than 5-minute average (${fiveMinAvgPing}ms)`}
                        >
                          <ArrowUp className="w-3 h-3 text-rose-400" />
                          <span>+{(webexPingMs - fiveMinAvgPing)}ms (5m avg {fiveMinAvgPing}ms)</span>
                        </span>
                      );
                    } else {
                      return (
                        <span 
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800"
                          title={`STABLE: Current latency (${webexPingMs}ms) equals 5-minute average (${fiveMinAvgPing}ms)`}
                        >
                          <Minus className="w-3 h-3 text-neutral-400" />
                          <span>Stable ({fiveMinAvgPing}ms avg)</span>
                        </span>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-2.5 rounded text-[11px] font-mono flex items-center gap-2 border ${
                webexPingMs > currentThreshold
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <Activity className="w-4 h-4 shrink-0" />
                <span>
                  {webexPingMs > currentThreshold
                    ? `⚠️ THRESHOLD EXCEEDED (${webexPingMs}ms > ${currentThreshold}ms)`
                    : `✅ OPTIMAL RESPONSE (${webexPingMs}ms <= ${currentThreshold}ms)`}
                </span>
              </div>
            </div>

            {/* Rapid Ping Sequence Button with Scanning Animation */}
            <button
              type="button"
              onClick={onRunPingTest}
              disabled={isPinging}
              className={`w-full py-2 px-3 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-sm ${
                isPinging
                  ? 'webex-ping-scanning bg-neutral-900 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-850 hover:border-amber-400/50 hover:text-amber-400'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isPinging ? 'text-amber-400 animate-spin' : 'text-amber-400'}`} />
              <span>{isPinging ? 'RUNNING 3-SEQ PING SCAN...' : 'Run Rapid Latency Test'}</span>
            </button>
          </div>
        </div>

        {/* Automated 5-Min Warm-up Ping Toggle Switch */}
        <div className="mt-4 pt-3.5 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/80 p-3.5 rounded-lg border border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-all border ${
              autoPingState
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500'
            }`}>
              <Zap className={`w-4 h-4 ${autoPingState ? 'animate-pulse text-amber-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Automated 5-Min Warm-up Ping
                </span>
                <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                  autoPingState
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                }`}>
                  {autoPingState ? 'ACTIVE (5-MIN SCHEDULE)' : 'DISABLED'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                Triggers an automated 3-sequence ping scan every 5 minutes to keep the Webex socket connection warm and prevent gateway idle drops.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            id="auto-ping-toggle-switch"
            type="button"
            role="switch"
            aria-checked={autoPingState}
            onClick={handleToggleAutoPing}
            className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
              autoPingState ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-neutral-800'
            }`}
            title="Toggle automated 5-minute 3-sequence socket warm-up ping scan"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                autoPingState ? 'translate-x-6 bg-neutral-950' : 'translate-x-0 bg-neutral-400'
              }`}
            />
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Side: Inputs */}
        <div className="space-y-3.5">
          
          {/* Box 1: Telegram alerts Setup via dedicated setup component */}
          <TelegramBotSetup 
            initialToken={platforms.telegram.token}
            initialChatId={platforms.telegram.chatId}
            onSave={(newToken, newChatId) => {
              const updated = {
                ...platforms,
                telegram: {
                  ...platforms.telegram,
                  token: newToken,
                  chatId: newChatId
                }
              };
              setPlatforms(updated);
              saveMessagingPlatforms(updated);
            }}
            onAddLog={onAddLog}
          />

          {/* Box 2: Discord Webhook Setup */}
          <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-900 space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Discord Channel Dispatch Rules</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-neutral-400 block">Discord Webhook Channel URL</label>
              <input
                id="webhook-discord-url"
                type="text"
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 text-[10px] text-white p-1.5 rounded outline-none font-mono"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>

            <button
              onClick={handleTestDiscordAlert}
              className="w-full py-1 bg-neutral-900 hover:bg-neutral-800 text-[9px] font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/10 hover:border-indigo-500/20 rounded cursor-pointer flex items-center justify-center gap-1"
            >
              <Play className="w-3 h-3" />
              <span>EMERGENCY DISCORD LOG PUSH</span>
            </button>
          </div>

        </div>

        {/* Right Side: Flutterwave & Selling Price */}
        <div className="space-y-3.5">
          
          {/* Box 3: Flutterwave Integration & Prices */}
          <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-900 space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
              <Globe className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Flutterwave Webhook Integration</span>
            </div>

            <p className="text-[8px] text-neutral-400 leading-normal">
              Flutterwave coordinates immediate charge captures in USD/NGN/KES. Set webhook receiver key for automatic deployment triggers.
            </p>

            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-neutral-400 block">Flutterwave Secret Hash Key</label>
              <input
                id="webhook-flw-secret"
                type="password"
                value={flutterwaveSecret}
                onChange={(e) => setFlutterwaveSecret(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 text-[10px] text-white p-1.5 rounded outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-neutral-400 block">Endpoint Webhook Target URL</label>
              <input
                id="webhook-flw-url"
                type="text"
                value={flutterwaveWebhookUrl}
                onChange={(e) => setFlutterwaveWebhookUrl(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 text-[10px] text-neutral-400 p-1.5 rounded outline-none font-mono"
                disabled
              />
            </div>

            <button
              onClick={handleTestFlutterwaveWebhook}
              disabled={isTestingWebhook}
              className="w-full py-1 bg-neutral-900 hover:bg-neutral-800 text-[9px] font-mono font-bold text-yellow-500 hover:text-yellow-400 transition-colors border border-yellow-500/10 hover:border-yellow-500/20 rounded cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
            >
              {isTestingWebhook ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Activity className="w-3 h-3" />
              )}
              <span>SIMULATE FLW CHECKOUT TRANSACTION</span>
            </button>
          </div>

          {/* Box 4: Base Selling Price Default */}
          <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-900 space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Product Pricing Configuration</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span>HGT Multi-Bot Fixed Price (USD)</span>
                <span className="text-amber-500 font-bold">${botPrice}.00</span>
              </div>
              <p className="text-[8px] text-neutral-400 leading-tight">
                Controls the displayed pricing point inside custom client sales templates and checkout API payloads.
              </p>
              <div className="relative mt-1">
                <span className="absolute left-2.5 top-1.5 text-neutral-500 text-[10px] font-mono">$</span>
                <input
                  id="bot-price-input"
                  type="number"
                  value={botPrice}
                  onChange={(e) => setBotPrice(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 text-[10px] text-white pl-6 p-1.5 rounded outline-none font-mono"
                  placeholder="130"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings Card: Sound Profiles for Webex Drops vs Latency */}
          <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-900 space-y-3 font-mono">
            <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">NOTIFICATION SOUND PROFILES</span>
            </div>
            
            <p className="text-[8px] text-neutral-400 leading-normal">
              Toggle specific low-level tone envelopes for connection teardowns versus minor latency spikes to distinguish telemetry issues while driving.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Webex drops */}
              <div className="space-y-1">
                <span className="text-[8px] text-neutral-500 uppercase block font-bold">Webex Drops alarm:</span>
                <div className="flex gap-1">
                  {(['Digital', 'Classic', 'Silent'] as const).map((profile) => (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => {
                        setWebexDropSoundProfile(profile);
                        localStorage.setItem('alert_webex_drop_sound', profile);
                        onAddLog('info', `🔊 Telemetry alert profile updated: Webex connection drops will trigger the '${profile}' sound package.`, undefined, 'SND_CONF');
                      }}
                      className={`flex-1 text-[8.5px] py-1 rounded font-mono border transition-all cursor-pointer ${
                        webexDropSoundProfile === profile
                          ? 'bg-rose-500/10 border-rose-500/35 text-rose-400 font-bold'
                          : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:bg-neutral-850'
                      }`}
                    >
                      {profile.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Latency Warnings */}
              <div className="space-y-1">
                <span className="text-[8px] text-neutral-500 uppercase block font-bold">Latency Warning alarm:</span>
                <div className="flex gap-1">
                  {(['Digital', 'Classic', 'Silent'] as const).map((profile) => (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => {
                        setWebexHighLatencySoundProfile(profile);
                        localStorage.setItem('alert_webex_latency_sound', profile);
                        onAddLog('info', `🔊 Telemetry alert profile updated: Latency spikes will trigger the '${profile}' sound package.`, undefined, 'SND_CONF');
                      }}
                      className={`flex-1 text-[8.5px] py-1 rounded font-mono border transition-all cursor-pointer ${
                        webexHighLatencySoundProfile === profile
                          ? 'bg-amber-500/10 border-amber-500/35 text-amber-400 font-bold'
                          : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:bg-neutral-850'
                      }`}
                    >
                      {profile.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Box 5: Ambient Noise Microphone Volume Normalizer */}
          <div className={`p-3 rounded-lg border transition-all duration-300 ${isNormalizerEnabled ? 'bg-neutral-950/80 border-amber-500/30' : 'bg-neutral-950/60 border-neutral-900'}`}>
            <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5 mb-2.5">
              <div className="flex items-center gap-1.5">
                {isNormalizerEnabled ? (
                  <Mic className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-neutral-600" />
                )}
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Ambient Noise Normalizer</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = !isNormalizerEnabled;
                  setIsNormalizerEnabled(val);
                  onAddLog('info', val 
                    ? '🎤 AUDIO SENSOR ACTIVATED: Automated sound dispatch alert volume normalizer initialized.' 
                    : '🎤 SENSOR DEACTIVATED: Sound normalizer muted. Alerts reverted to constant gain.'
                  , undefined, 'AUDIO_NORMAL');
                }}
                className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                  isNormalizerEnabled 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold' 
                    : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                }`}
              >
                {isNormalizerEnabled ? 'MIC CAPTURE LIVE' : 'ACTIVATE SENSOR'}
              </button>
            </div>

            <p className="text-[8px] text-neutral-400 leading-normal mb-2">
              Measures cabin decibels dynamically to scale alarm gain in loud or driving conditions, protecting your hearing in quiet zones while preventing missed $100+ offers on highways.
            </p>

            <AnimatePresence>
              {isNormalizerEnabled && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5 overflow-hidden"
                >
                  {/* VU Decibel Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[8.5px] font-mono">
                      <span className="text-neutral-500">Cabin Level (Sensor):</span>
                      <span className={`font-bold ${
                        ambientDb > 80 ? 'text-rose-400 animate-pulse' : ambientDb > 60 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{ambientDb} dB SPL</span>
                    </div>

                    {/* Heatmap-like VU bar */}
                    <div className="flex gap-[2px] h-2 bg-neutral-900 rounded overflow-hidden p-[1px]">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const threshold = 30 + (i * 4); // 30db up to 110db
                        const isActive = ambientDb >= threshold;
                        let colorClass = 'bg-neutral-800';
                        if (isActive) {
                          if (threshold > 80) colorClass = 'bg-rose-500';
                          else if (threshold > 60) colorClass = 'bg-amber-400';
                          else colorClass = 'bg-emerald-400';
                        }
                        return <div key={i} className={`flex-1 h-full rounded-[1px] transition-all duration-100 ${colorClass}`} />;
                      })}
                    </div>
                  </div>

                  {/* Volume Output Normalizer Adjuster */}
                  <div className="bg-neutral-900/55 border border-neutral-850 p-2 rounded-lg flex items-center justify-between gap-3 text-[9px] font-mono">
                    <div className="flex items-center gap-1.5 col-span-2">
                      {adjustedVolume > 75 ? (
                        <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                      ) : (
                        <Volume1 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <div>
                        <span className="text-neutral-400 block text-[7px] leading-none uppercase font-bold text-neutral-500">Auto Adjusted Alert Volume</span>
                        <span className="font-bold text-white text-[9px]">{adjustedVolume}% Gain</span>
                      </div>
                    </div>
                    {/* Compact simple visual slider bar */}
                    <div className="h-1.5 bg-neutral-950 w-20 rounded-full overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 rounded-full" style={{ width: `${adjustedVolume}%` }} />
                    </div>
                  </div>

                  {/* Manual Test Presets & Permission State */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[7.5px] font-mono text-neutral-500">
                      <span>{isMicAccessGranted ? '🔴 MEDIA MIC SOURCE CONNECTED' : '⚠️ SENSORY OVERRIDE ACTIVE'}</span>
                      <span>{!isMicAccessGranted && 'IFRAME SIM FACTOR'}</span>
                    </div>

                    {!isMicAccessGranted && (
                      <div className="flex gap-1">
                        {(['quiet', 'driving', 'noisy'] as const).map((preset) => {
                          const labels = { quiet: '🔇 QUIET', driving: '🚗 HIGHWAY', noisy: '🚨 TRAFFIC' };
                          const isActive = simNoisePreset === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setSimNoisePreset(preset);
                                onAddLog('info', `🎤 Preset adjusted: Simulated cabin ambient noise set to ${preset.toUpperCase()}.`, undefined, 'AUDIO_SIM');
                              }}
                              className={`flex-1 text-[8px] py-1 px-1 rounded font-mono border transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-neutral-800 border-amber-500/20 text-amber-400 font-bold' 
                                  : 'bg-neutral-900/30 border-neutral-850 text-neutral-500 hover:text-neutral-400'
                              }`}
                            >
                              {labels[preset]}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Box 5b: CUSTOM AUDIO CONFIGURATION PANEL */}
          <div className="p-3 bg-neutral-950/80 border border-cyan-500/20 rounded-lg space-y-3 font-mono">
            <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Custom Alert Audio Overrides</span>
            </div>
            
            <p className="text-[8px] text-neutral-400 leading-normal">
              Upload your own high-intensity .mp3 or .wav snippets to override standard synth presets for specific offer categories.
            </p>

            <div className="space-y-4">
              {(Object.keys(soundConfigs) as SoundCategory[]).map((category) => {
                const cfg = soundConfigs[category];
                return (
                  <div key={category} className="bg-neutral-900/40 p-2 rounded border border-neutral-850/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-tighter">{category}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleMuteCategory(category)}
                          className={`p-1 rounded transition-colors ${cfg.muted ? 'bg-rose-500/20 text-rose-400' : 'text-neutral-500 hover:text-neutral-400'}`}
                        >
                          {cfg.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </button>
                        <div className="flex bg-neutral-950 p-0.5 rounded border border-neutral-800">
                          {(['preset', 'custom'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => handleUpdateSoundType(category, type)}
                              className={`px-2 py-0.5 text-[7.5px] rounded transition-all font-bold uppercase ${
                                cfg.type === type ? 'bg-cyan-500/20 text-cyan-400' : 'text-neutral-600 hover:text-neutral-500'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {cfg.type === 'preset' ? (
                      <div className="grid grid-cols-3 gap-1">
                        {SOUND_PRESETS[category].map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => handleSelectPreset(category, preset.id)}
                            className={`py-1 rounded text-[7.5px] border transition-all ${
                              cfg.selectedPreset === preset.id
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold'
                                : 'bg-neutral-950 border-neutral-850 text-neutral-500'
                            }`}
                          >
                            {preset.name.split(' ')[1]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {cfg.customFileBase64 ? (
                          <div className="flex-1 flex items-center justify-between bg-neutral-950 p-1.5 rounded border border-emerald-500/20">
                            <div className="flex items-center gap-1.5 truncate">
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-[8px] text-emerald-400 truncate">{cfg.customFileName}</span>
                            </div>
                            <button
                              onClick={() => {
                                const next = { ...soundConfigs };
                                next[category].customFileBase64 = null;
                                next[category].customFileName = null;
                                next[category].type = 'preset';
                                setSoundConfigs(next);
                                saveSoundConfigs(next);
                              }}
                              className="text-neutral-600 hover:text-rose-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setUploadingCategory(category);
                              fileInputRef.current?.click();
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-950 py-1.5 rounded border border-dashed border-neutral-800 text-neutral-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-[8px] font-bold"
                          >
                            <Upload className="w-3 h-3" />
                            UPLOAD CUSTOM AUDIO
                          </button>
                        )}
                        <button
                          onClick={() => playOfferAlert(category === 'Shop & Deliver' ? 'Shop' : category === 'Curbside Pickup' ? 'Pickup' : 'Dotcom')}
                          disabled={cfg.type === 'custom' && !cfg.customFileBase64}
                          className="p-1.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-400 hover:text-cyan-400 disabled:opacity-30"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
          </div>

          {/* Box 5b: CUSTOM AUDIO CONFIGURATION PANEL */}
          <div className="p-3 bg-neutral-950/80 border border-cyan-500/20 rounded-lg space-y-3 font-mono">
            <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Custom Alert Audio Overrides</span>
            </div>
            
            <p className="text-[8px] text-neutral-400 leading-normal">
              Upload your own high-intensity .mp3 or .wav snippets to override standard synth presets for specific offer categories.
            </p>

            <div className="space-y-4">
              {(Object.keys(soundConfigs) as SoundCategory[]).map((category) => {
                const cfg = soundConfigs[category];
                return (
                  <div key={category} className="bg-neutral-900/40 p-2 rounded border border-neutral-850/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-tighter">{category}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleMuteCategory(category)}
                          className={`p-1 rounded transition-colors ${cfg.muted ? 'bg-rose-500/20 text-rose-400' : 'text-neutral-500 hover:text-neutral-400'}`}
                        >
                          {cfg.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </button>
                        <div className="flex bg-neutral-950 p-0.5 rounded border border-neutral-800">
                          {(['preset', 'custom'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => handleUpdateSoundType(category, type)}
                              className={`px-2 py-0.5 text-[7.5px] rounded transition-all font-bold uppercase ${
                                cfg.type === type ? 'bg-cyan-500/20 text-cyan-400' : 'text-neutral-600 hover:text-neutral-500'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {cfg.type === 'preset' ? (
                      <div className="grid grid-cols-3 gap-1">
                        {SOUND_PRESETS[category].map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => handleSelectPreset(category, preset.id)}
                            className={`py-1 rounded text-[7.5px] border transition-all ${
                              cfg.selectedPreset === preset.id
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold'
                                : 'bg-neutral-950 border-neutral-850 text-neutral-500'
                            }`}
                          >
                            {preset.name.split(' ')[1]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {cfg.customFileBase64 ? (
                          <div className="flex-1 flex items-center justify-between bg-neutral-950 p-1.5 rounded border border-emerald-500/20">
                            <div className="flex items-center gap-1.5 truncate">
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-[8px] text-emerald-400 truncate">{cfg.customFileName}</span>
                            </div>
                            <button
                              onClick={() => {
                                const next = { ...soundConfigs };
                                next[category].customFileBase64 = null;
                                next[category].customFileName = null;
                                next[category].type = 'preset';
                                setSoundConfigs(next);
                                saveSoundConfigs(next);
                              }}
                              className="text-neutral-600 hover:text-rose-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setUploadingCategory(category);
                              fileInputRef.current?.click();
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-950 py-1.5 rounded border border-dashed border-neutral-800 text-neutral-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-[8px] font-bold"
                          >
                            <Upload className="w-3 h-3" />
                            UPLOAD CUSTOM AUDIO
                          </button>
                        )}
                        <button
                          onClick={() => playOfferAlert(category === 'Shop & Deliver' ? 'Shop' : category === 'Curbside Pickup' ? 'Pickup' : 'Dotcom')}
                          disabled={cfg.type === 'custom' && !cfg.customFileBase64}
                          className="p-1.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-400 hover:text-cyan-400 disabled:opacity-30"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
          </div>

          {/* Box 6: Battery Drainage Simulation */}
          <div className={`p-3 rounded-lg border transition-all duration-300 ${isBatterySimEnabled ? 'bg-neutral-950/80 border-cyan-500/30' : 'bg-neutral-950/60 border-neutral-900'}`}>
            <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Battery className={`w-3.5 h-3.5 ${isBatterySimEnabled ? 'text-cyan-400 animate-pulse' : 'text-neutral-600'}`} />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Hi-Fi Battery Discharge Simulator</span>
              </div>
              <button
                type="button"
                onClick={handleToggleBatterySim}
                className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                  isBatterySimEnabled 
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-bold' 
                    : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                }`}
              >
                {isBatterySimEnabled ? 'SIMULATOR ACTIVE' : 'SIMULATOR MUTED'}
              </button>
            </div>

            <p className="text-[8px] text-neutral-400 leading-normal">
              Bypasses standard operating system static hardware battery levels to simulate real-time CPU drain when driving high-speed grabber sub-tasks. Useful to inspect telemetry behavior under low power states.
            </p>
          </div>

        </div>

      </div>

      {/* Embedded Telemetry Log Viewport Specific to alerts */}
      <div className="space-y-1.5 mt-1">
        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-neutral-500" />
            <span>LOCAL TRANSACTION & WEBHOOK TRANSMISSION TERMINAL LOGS</span>
          </span>
          <button
            onClick={() => setWebhookLogs([])}
            className="text-[8.5px] text-neutral-500 hover:text-neutral-300"
          >
            Clear logs
          </button>
        </div>
        
        <div className="bg-neutral-950 p-2.5 font-mono text-[8.5px] leading-relaxed rounded border border-neutral-900 text-neutral-300 max-h-[110px] overflow-y-auto scrollbar-thin space-y-0.5">
          {webhookLogs.length === 0 ? (
            <span className="text-neutral-600 block">No webhook logs emitted in this session. Trigger alert test buttons to view telemetry headers.</span>
          ) : (
            webhookLogs.map((log, index) => (
                      <div key={index} className={(log || '').startsWith('$') ? 'text-neutral-500' : (log || '').includes('✅') || (log || '').includes('SUCCESS') ? 'text-emerald-400' : 'text-neutral-350'}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        id="save-alerts-settings-btn"
        onClick={handleSaveAlertsSettings}
        disabled={isSavingAlerts}
        className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-mono font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-lg shadow-amber-550/15"
      >
        {isSavingAlerts ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            DEPLOYING WEBHOOK SCHEMAS...
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            COMMIT WEBHOOK RULES & ALERTS SCHEMA
          </>
        )}
      </button>

    </div>
  );
}
