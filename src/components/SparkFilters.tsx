import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BotFilters, SparkOrderType, GigPlatform } from '../types';
import { 
  getSoundConfigs, 
  saveSoundConfigs, 
  SOUND_PRESETS, 
  playOfferAlert, 
  decodeAndCacheSound, 
  OfferSoundConfig 
} from '../lib/audioManager';
import { 
  Zap, 
  ZapOff, 
  Sliders, 
  Shield, 
  Info, 
  Volume2, 
  VolumeX, 
  Music, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Bell,
  BellOff,
  Send
} from 'lucide-react';

interface SparkFiltersProps {
  filters: BotFilters;
  onChange: (filters: BotFilters) => void;
  onPlayTestSound?: () => void;
  onQuickDeclineAll?: () => void;
}

export default function SparkFilters({ filters, onChange, onPlayTestSound, onQuickDeclineAll }: SparkFiltersProps) {
  const [soundConfigs, setSoundConfigs] = useState<Record<SparkOrderType, OfferSoundConfig>>(() => getSoundConfigs());
  const [activeTab, setActiveTab] = useState<SparkOrderType>('Shop & Deliver');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hotZoneAlertsEnabled, setHotZoneAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spark_bot_hotzone_notifs_enabled') === 'true';
  });

  const [hotZoneTelegramAlertsEnabled, setHotZoneTelegramAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spark_bot_hotzone_telegram_alerts') !== 'false';
  });

  const PLATFORMS_LIST: { id: GigPlatform; label: string; desc: string; color: string }[] = [
    { id: 'Spark', label: 'Walmart Spark', desc: 'FCFS grocery loads & bulk dotcom shipments', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
    { id: 'Instacart', label: 'Instacart', desc: 'Full-service grocery picking & warehouse runs', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
    { id: 'DoorDash', label: 'DoorDash', desc: 'Hot restaurant deliveries & local store picking', color: 'border-rose-500/20 text-rose-400 bg-rose-500/5' },
    { id: 'Amazon Flex', label: 'Amazon Flex', desc: 'Logistics fulfillment depot blocks & Whole Foods routes', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5' },
    { id: 'Uber Eats', label: 'Uber Eats & Ride', desc: 'Sameday parcel couriers, restaurant runs & passenger trips', color: 'border-teal-500/20 text-teal-400 bg-teal-500/5' },
    { id: 'Shipt', label: 'Shipt Shopper', desc: 'Premium store-to-door grocery shopping & delivery runs', color: 'border-green-500/20 text-green-400 bg-green-500/5' },
    { id: 'Roadie', label: 'Roadie (UPS)', desc: 'Sameday local delivery gig for oversized Home Depot cargo', color: 'border-yellow-600/20 text-yellow-500 bg-yellow-600/5' },
    { id: 'Bungii', label: 'Bungii Large Load', desc: 'Local truck delivery & big-box retail hauling logistics', color: 'border-purple-500/20 text-purple-400 bg-purple-500/5' },
    { id: 'GoShare', label: 'GoShare Freight', desc: 'Express LTL logistics, cargo van, or heavy haul delivery', color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5' },
    { id: 'Lyft', label: 'Lyft Rideshare', desc: 'Passenger micro-transit & express rides across metro sectors', color: 'border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-500/5' },
    { id: 'Veho', label: 'Veho Logistics', desc: 'Sameday e-commerce package route delivery bundles', color: 'border-emerald-600/20 text-emerald-500 bg-emerald-600/5' },
    { id: 'Postmates', label: 'Postmates Swift', desc: 'Instant hot meal deliveries and merchant pickups', color: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5' },
  ];

  const handlePlatformToggle = (platform: GigPlatform) => {
    const list = filters.activePlatforms || [];
    let updated: GigPlatform[];
    if (list.includes(platform)) {
      if (list.length <= 1) return; // Keep at least one chosen platform active
      updated = list.filter(p => p !== platform);
    } else {
      updated = [...list, platform];
    }
    onChange({ ...filters, activePlatforms: updated });
  };

  const toggleBot = () => {
    onChange({ ...filters, isEnabled: !filters.isEnabled });
  };

  const handleSliderChange = (key: keyof BotFilters, val: number) => {
    onChange({ ...filters, [key]: val });
  };

  const handleCheckboxChange = (key: keyof BotFilters) => {
    onChange({ ...filters, [key]: !filters[key] as any });
  };

  // Human vs Bot speed label classification
  const getSpeedClassification = (ms: number) => {
    if (ms < 150) return { label: 'Instantly Inhuman (40ms - 150ms)', css: 'text-rose-500 font-bold animate-pulse', risk: 'Extreme platform banner risk' };
    if (ms < 600) return { label: 'Inhuman Bot-Tuning (150ms - 600ms)', css: 'text-amber-500 font-bold', risk: 'Suspiciously consistent logs' };
    if (ms < 1500) return { label: 'Pro Auto-Tapper (600ms - 1.5s)', css: 'text-yellow-400', risk: 'Borderline natural pattern' };
    return { label: 'Slower human reflex (1.5s - 4s)', css: 'text-emerald-400', risk: 'Likely undetected' };
  };

  const speedCat = getSpeedClassification(filters.reactionSpeedMs);

  // Sound Config setters
  const updateSoundConfig = (offerType: SparkOrderType, partial: Partial<OfferSoundConfig>) => {
    const updated = {
      ...soundConfigs,
      [offerType]: {
        ...soundConfigs[offerType],
        ...partial
      }
    };
    setSoundConfigs(updated);
    saveSoundConfigs(updated);
  };

  // Convert uploaded audio file to base64, decode via Web Audio API, and cache
  const processAudioFile = async (file: File) => {
    setUploadError(null);

    // Limit to safe audios (approx 1.5MB to secure localStorage margins)
    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('File exceeds 1.5MB. Please choose a short alert tone.');
      return;
    }

    if (!file.type.startsWith('audio/')) {
      // Allow fallback if extension is .mp3 or similar
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'mp3' && ext !== 'wav' && ext !== 'm4a' && ext !== 'ogg') {
        setUploadError('Unsupported format. Please select an MP3, WAV, or OGG file.');
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (!base64) {
        setUploadError('Failed to read file buffer.');
        return;
      }

      // Test decoding using active AudioContext (Ensures Web Audio support)
      const success = await decodeAndCacheSound(activeTab, base64);
      if (success) {
        updateSoundConfig(activeTab, {
          type: 'custom',
          customFileBase64: base64,
          customFileName: file.name
        });
      } else {
        setUploadError('Web Audio API could not decode this audio file. Please try another sample.');
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading audio file.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop triggers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  };

  // Direct Audio Trigger for Tests
  const handleTestPlay = (offerType: SparkOrderType) => {
    // Uses the sound configs to play either selected preset synth waves or decoded custom uploads
    playOfferAlert(offerType, true);
  };

  return (
    <div id="spark-filters-panel" className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 h-full flex flex-col justify-between">
      <div>
        {/* Header and Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500 animate-pulse" />
              <span className="text-sm font-sans font-medium text-white uppercase tracking-wider">Bot Parameters</span>
            </div>
            <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping inline-block" />
              SETTINGS AUTO-SAVED
            </span>
          </div>
          
          <button
            id="bot-power-toggle"
            onClick={toggleBot}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none ${
              filters.isEnabled 
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
            }`}
          >
            {filters.isEnabled ? (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                AUTOMATION ACTIVE
              </>
            ) : (
              <>
                <ZapOff className="w-3.5 h-3.5" />
                AUTOMATION OFF
              </>
            )}
          </button>
        </div>

        {/* Min Dollar Pay Slider */}
        <div className="mb-5">
          <div className="flex justify-between text-xs font-mono mb-1.5 text-neutral-400">
            <span>Minimum Settle Pay</span>
            <span className="text-amber-400 font-bold">${filters.minTotalPay}</span>
          </div>
          <input
            id="filter-min-pay"
            type="range"
            min="10"
            max="60"
            step="1"
            value={filters.minTotalPay}
            onChange={(e) => handleSliderChange('minTotalPay', parseInt(e.target.value))}
            className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-neutral-500 font-sans block mt-1">Offers under ${filters.minTotalPay} will be auto-ignored.</span>
        </div>

        {/* Max Distance Slider */}
        <div className="mb-5">
          <div className="flex justify-between text-xs font-mono mb-1.5 text-neutral-400">
            <span>Max Route Distance</span>
            <span className="text-amber-400 font-bold">{filters.maxDistance} miles</span>
          </div>
          <input
            id="filter-max-distance"
            type="range"
            min="3"
            max="25"
            step="1"
            value={filters.maxDistance}
            onChange={(e) => handleSliderChange('maxDistance', parseInt(e.target.value))}
            className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-neutral-500 font-sans block mt-1 font-normal">Rejects long hauls above {filters.maxDistance} mi to preserve fuel.</span>
        </div>

        {/* Min Dollar Per Mile Slider */}
        <div className="mb-5">
          <div className="flex justify-between text-xs font-mono mb-1.5 text-neutral-400">
            <span>Min Pay Per Mile Rate</span>
            <span className="text-amber-400 font-bold">${filters.minPayPerMile.toFixed(2)} / mi</span>
          </div>
          <input
            id="filter-pay-per-mile"
            type="range"
            min="1.0"
            max="5.0"
            step="0.1"
            value={filters.minPayPerMile}
            onChange={(e) => handleSliderChange('minPayPerMile', parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-neutral-500 font-sans block mt-1">Accepts only high-density pay structures. Highly recommended.</span>
          
          {/* Quick Decline All Button */}
          {onQuickDeclineAll && (
            <button
              id="quick-decline-all-btn"
              type="button"
              onClick={onQuickDeclineAll}
              className="w-full mt-2.5 py-2 px-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.12)] active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>QUICK DECLINE ALL OFFERS BELOW ${filters.minPayPerMile.toFixed(2)}/MI</span>
            </button>
          )}
        </div>

        {/* 🔥 HOT ZONE GEOFENCE ALERTS & REAL-TIME TELEGRAM STREAM TOGGLES */}
        <div className="mb-5 p-3.5 bg-neutral-950/70 rounded-xl border border-neutral-800 space-y-3">
          {/* 1. Desktop Browser Alert Toggle */}
          <div className="flex items-center justify-between pb-2.5 border-b border-neutral-900">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white uppercase block">Hot Zone Browser Alerts</span>
                <span className="text-[9px] text-neutral-500 font-sans block">Desktop popup alert when entering store radius (&lt;2.5 mi)</span>
              </div>
            </div>
            <button
              id="hotzone-desktop-alert-toggle"
              type="button"
              onClick={() => {
                const next = !hotZoneAlertsEnabled;
                setHotZoneAlertsEnabled(next);
                localStorage.setItem('spark_bot_hotzone_notifs_enabled', String(next));
                if (next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
                  Notification.requestPermission();
                }
              }}
              className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                hotZoneAlertsEnabled 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}
            >
              {hotZoneAlertsEnabled ? (
                <>
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span>DESKTOP: ON</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3 h-3 text-neutral-500" />
                  <span>DESKTOP: OFF</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Telegram Hot Zone Stream Toggle (Separate from billing bot) */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                <Send className="w-4 h-4 text-cyan-400 shrink-0" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-white uppercase block">Telegram Hot-Zone Direct Stream</span>
                  <span className="text-[8px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1 py-0.2 rounded">SEPARATE ROUTE</span>
                </div>
                <span className="text-[9px] text-neutral-400 font-sans block">Push real-time store geofence alerts to Telegram (isolated from billing bot)</span>
              </div>
            </div>
            <button
              id="hotzone-telegram-alert-toggle"
              type="button"
              onClick={() => {
                const next = !hotZoneTelegramAlertsEnabled;
                setHotZoneTelegramAlertsEnabled(next);
                localStorage.setItem('spark_bot_hotzone_telegram_alerts', String(next));
              }}
              className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                hotZoneTelegramAlertsEnabled 
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}
            >
              {hotZoneTelegramAlertsEnabled ? (
                <>
                  <Send className="w-3 h-3 text-cyan-400" />
                  <span>TELEGRAM: ON</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3 h-3 text-neutral-500" />
                  <span>TELEGRAM: OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reaction Time (Speed) Slider */}
        <div className="mb-5">
          <div className="flex justify-between text-xs font-mono mb-1 text-neutral-400">
            <span>Reaction Acceptance Speed</span>
            <span className="text-neutral-200 font-bold">{filters.reactionSpeedMs} ms</span>
          </div>
          <input
            id="filter-reaction-speed"
            type="range"
            min="40"
            max="4000"
            step="20"
            value={filters.reactionSpeedMs}
            onChange={(e) => handleSliderChange('reactionSpeedMs', parseInt(e.target.value))}
            className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <div className="mt-1.5 p-2 bg-neutral-950/60 rounded-lg border border-neutral-800/40">
            <div className="flex items-center gap-1.5">
              <Shield className={`w-3 h-3 ${filters.reactionSpeedMs < 600 ? 'text-rose-400' : 'text-neutral-400'}`} />
              <span className={`text-[10px] font-mono leading-none ${speedCat.css}`}>{speedCat.label}</span>
            </div>
            <span className="text-[9px] font-sans text-neutral-400 block mt-1 leading-tight">
              {speedCat.risk} — faster speeds beat manual competitors but spike ban risk.
            </span>
          </div>
        </div>

        {/* 🔊 PERSISTENT CUSTOM SOUND ASSIGNER DECK */}
        <div className="mb-5 pt-3 border-t border-neutral-800/80">
          <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-2">
            <span>Sound Assigner By offer</span>
            <span className="text-[8px] font-mono text-neutral-500 uppercase">Interactive Chimes</span>
          </div>

          {/* Master Enable/Disable Button */}
          <button
            id="audio-notification-toggle"
            type="button"
            onClick={() => handleCheckboxChange('audioEnabled')}
            className={`w-full mb-3 flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer select-none ${
              filters.audioEnabled
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-neutral-950/40 text-neutral-500 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {filters.audioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-600" />}
              <span>{filters.audioEnabled ? 'SOUND NOTIFICATIONS ACTIVE' : 'SOUND SYSTEM MUTED'}</span>
            </div>
            <span className={`text-[8px] px-1.5 py-0.5 rounded leading-none ${filters.audioEnabled ? 'bg-amber-400/20 text-text-amber-300' : 'bg-neutral-800 text-neutral-500'}`}>
              {filters.audioEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Offer Type Tabs Container */}
          {filters.audioEnabled && (
            <div className="bg-neutral-950/80 p-2 rounded-xl border border-neutral-800/60 text-left space-y-2">
              <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-850">
                {(['Shop & Deliver', 'Curbside Pickup', 'Dotcom Delivery'] as SparkOrderType[]).map((tab) => {
                  const isCategoryMuted = soundConfigs[tab]?.muted;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setUploadError(null);
                      }}
                      className={`py-1 text-[8px] font-mono rounded transition-all cursor-pointer select-none flex items-center justify-center gap-1 min-w-0 px-1 ${
                        activeTab === tab 
                          ? 'bg-neutral-950 text-white font-bold border border-neutral-800'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{tab.split(' ')[0]}</span>
                      {isCategoryMuted ? (
                        <VolumeX className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                      ) : (
                        <Volume2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Individual Offer Alert Mute/Unmute Customization Card */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/50 border border-neutral-850 text-[10px] font-mono">
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold truncate text-[10.5px]">{activeTab} sound</span>
                  <span className="text-[7.5px] text-neutral-500 uppercase leading-none mt-0.5 block">
                    {soundConfigs[activeTab]?.muted ? '📵 Alerts Muted' : '🔊 Alerts Active'}
                  </span>
                </div>
                <button
                  type="button"
                  id={`toggle-mute-${activeTab.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => {
                    const nextMuted = !soundConfigs[activeTab]?.muted;
                    updateSoundConfig(activeTab, { muted: nextMuted });
                  }}
                  className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold transition-all uppercase flex items-center gap-1 cursor-pointer select-none border ${
                    soundConfigs[activeTab]?.muted
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 shadow-[0_0_8px_rgba(239,68,68,0.05)]'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15 hover:bg-emerald-500/20'
                  }`}
                >
                  {soundConfigs[activeTab]?.muted ? (
                    <>
                      <VolumeX className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>Mute Mode</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Alerting</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sound Profile Settings */}
              <div className="space-y-2 mt-1">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-neutral-400">Trigger Alert Tone:</span>
                  <div className="flex bg-neutral-900 rounded p-0.5 border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => updateSoundConfig(activeTab, { type: 'preset' })}
                      className={`px-1.5 py-0.5 text-[8px] rounded transition-all cursor-pointer select-none leading-none ${
                        soundConfigs[activeTab].type === 'preset'
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSoundConfig(activeTab, { type: 'custom' })}
                      className={`px-1.5 py-0.5 text-[8px] rounded transition-all cursor-pointer select-none leading-none ${
                        soundConfigs[activeTab].type === 'custom'
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Custom File
                    </button>
                  </div>
                </div>

                {/* Preset Picker Option */}
                {soundConfigs[activeTab].type === 'preset' ? (
                  <div className="space-y-1.5">
                    <label className="text-[8.5px] font-mono text-neutral-500 block">SELECT AUDIO WAVE SYNTH PRESET:</label>
                    <div className="grid grid-cols-1 gap-1">
                      {SOUND_PRESETS[activeTab].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => updateSoundConfig(activeTab, { selectedPreset: preset.id })}
                          className={`w-full p-1.5 rounded text-[9px] font-mono text-left transition-all flex items-center justify-between border cursor-pointer select-none ${
                            soundConfigs[activeTab].selectedPreset === preset.id
                              ? 'bg-neutral-900 text-amber-400 border-amber-500/30'
                              : 'bg-neutral-950 hover:bg-neutral-900/40 border-neutral-900 text-neutral-400'
                          }`}
                        >
                          <span>{preset.name}</span>
                          {soundConfigs[activeTab].selectedPreset === preset.id && (
                            <span className="text-[7.5px] text-amber-500 bg-amber-500/10 px-1 rounded animate-pulse">SELECTED</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Custom File Drag & Drop / Click Upload Area */
                  <div className="space-y-1.5">
                    <label className="text-[8.5px] font-mono text-neutral-500 block">UPLOAD CUSTOM ALERT (.MP3 / .WAV):</label>
                    
                    {soundConfigs[activeTab].customFileBase64 ? (
                      <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2 overflow-hidden select-none">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] text-neutral-200 truncate font-mono font-medium leading-tight">
                              {soundConfigs[activeTab].customFileName}
                            </p>
                            <p className="text-[7px] text-neutral-500 font-mono leading-none mt-0.5">
                              Cached in Browser storage
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateSoundConfig(activeTab, {
                            type: 'preset',
                            customFileBase64: null,
                            customFileName: null
                          })}
                          className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                          title="Remove custom audio file and switch back to presets"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border border-dashed p-3 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-1 select-none ${
                          dragOver 
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              processAudioFile(e.target.files[0]);
                            }
                          }}
                          accept="audio/*"
                          className="hidden"
                        />
                        <Upload className="w-4 h-4 text-neutral-500 animate-bounce" />
                        <span className="text-[8.5px] font-sans text-neutral-400 font-medium">
                          Drag file here or <span className="text-amber-500 underline font-bold">Browse</span>
                        </span>
                        <span className="text-[6.5px] font-mono text-neutral-500 uppercase leading-none">
                          Wav / MP3 under 1.5MB
                        </span>
                      </div>
                    )}

                    {uploadError && (
                      <div className="flex items-center gap-1 text-[7.5px] text-rose-400 font-mono leading-tight bg-rose-950/20 p-1 px-1.5 rounded border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-rose-500" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Test Controls */}
                <div className="pt-1.5 border-t border-neutral-900 flex justify-between items-center bg-neutral-950 p-1.5 rounded">
                  <span className="text-[8px] font-mono text-neutral-400 flex items-center gap-1 uppercase">
                    <Music className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span>Test dispatch:</span>
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleTestPlay(activeTab)}
                    className="p-1 px-2.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500/30 hover:bg-neutral-850 text-[9px] text-amber-400 font-mono rounded cursor-pointer flex items-center gap-1 hover:text-white transition-all"
                  >
                    <span>PLAY MATCH CHIME</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Target Gig Platforms Toggles */}
        <div className="pt-2 border-t border-neutral-800/60 mt-4 mb-4">
          <span className="text-xs font-mono text-neutral-400 block mb-2 font-bold uppercase tracking-wide">Connected Gig Networks</span>
          <div className="grid grid-cols-1 gap-1.5">
            {PLATFORMS_LIST.map((platform) => {
              const isActive = filters.activePlatforms ? filters.activePlatforms.includes(platform.id) : true;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg border text-left cursor-pointer transition-all select-none ${
                    isActive
                      ? 'bg-neutral-900/60 text-white border-neutral-800 hover:border-neutral-700'
                      : 'bg-neutral-950/20 text-neutral-600 border-neutral-900/30'
                  }`}
                >
                  <div className="mt-0.5 flex items-center justify-center">
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isActive ? 'bg-amber-500 border-amber-500 text-neutral-950' : 'border-neutral-750 bg-neutral-900'}`}>
                      {isActive && (
                        <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="leading-none flex-grow">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-sans font-semibold ${isActive ? 'text-neutral-200' : 'text-neutral-600'}`}>{platform.label}</span>
                      {isActive && (
                        <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border leading-none ${platform.color}`}>
                          ONLINE
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] block mt-1 leading-normal ${isActive ? 'text-neutral-500' : 'text-neutral-700'}`}>{platform.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters checklist */}
        <div className="pt-2 border-t border-neutral-800/60">
          <span className="text-xs font-mono text-neutral-400 block mb-2">Target Order Segments</span>
          <div className="space-y-2">
            {[
              { id: 'shopAndDeliver', label: 'Shop & Deliver', desc: 'Highest base pay, requires in-store picking.' },
              { id: 'curbsidePickup', label: 'Curbside Pickup', desc: 'Loaded by walmart staff. Standard density.' },
              { id: 'dotcomDelivery', label: 'Dotcom Delivery', desc: 'Multi-stop package runs. Tip-restricted.' },
            ].map((entry) => (
              <label 
                key={entry.id} 
                className="flex items-start gap-2.5 p-2 rounded-lg bg-neutral-950/30 hover:bg-neutral-900 border border-neutral-800/40 transition-colors cursor-pointer select-none"
              >
                <input
                  id={`checkbox-${entry.id}`}
                  type="checkbox"
                  checked={(filters as any)[entry.id]}
                  onChange={() => handleCheckboxChange(entry.id as any)}
                  className="mt-0.5 accent-amber-500 rounded text-neutral-950 border-neutral-700 bg-neutral-800"
                />
                <div className="leading-none">
                  <span className="text-xs font-sans font-medium text-neutral-300">{entry.label}</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">{entry.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Store Blacklist Configuration */}
        <div className="pt-3 border-t border-neutral-800/60 mt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-mono text-neutral-400 font-bold uppercase tracking-wide">Store Blacklist</span>
            <span className="text-[8px] font-mono text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded leading-none uppercase font-bold">AUTO-DECLINE</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mb-2 leading-relaxed">
            Enter store numbers or names to auto-decline (comma separated, e.g., <span className="font-mono text-neutral-300">123, Costco, 804</span>).
          </span>
          <div className="relative">
            <input
              id="store-blacklist-input"
              type="text"
              value={(filters.blacklistedStoreNumbers || []).join(', ')}
              onChange={(e) => {
                const list = e.target.value.split(',').map(s => s.trim());
                onChange({ ...filters, blacklistedStoreNumbers: list });
              }}
              placeholder="e.g. 102, Walmart #405, Costco"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-neutral-700 outline-none transition-all focus:ring-1 focus:ring-rose-500/30"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {(filters.blacklistedStoreNumbers || []).filter(Boolean).map((num, i) => (
              <span key={i} className="text-[9px] font-mono bg-rose-500/10 border border-rose-500/25 text-rose-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span>{num}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = (filters.blacklistedStoreNumbers || []).filter((_, idx) => idx !== i);
                    onChange({ ...filters, blacklistedStoreNumbers: next });
                  }}
                  className="hover:text-white text-rose-500 font-bold ml-1 text-[8px] cursor-pointer"
                >
                  ✕
                </button>
              </span>
            ))}
            {(filters.blacklistedStoreNumbers || []).filter(Boolean).length === 0 && (
              <span className="text-[9px] italic text-neutral-600">No stores blacklisted. All zones eligible.</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer hint */}
      <div className="mt-5 pt-3 border-t border-neutral-800 flex items-start gap-1 text-[10px] text-neutral-500 font-sans leading-relaxed">
        <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
        <span>Bots monitor the FCFS ("First-Come, First-Served") feed 24/7. Turn on the bot to watch simulated offers auto-match your filters in milliseconds!</span>
      </div>
    </div>
  );
}
