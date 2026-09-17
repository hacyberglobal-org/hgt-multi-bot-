import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Terminal, History, Sliders, ArrowRight, Zap, CheckCircle2, Shield, Palette } from 'lucide-react';
import { LogEntry, SparkOffer, BotFilters } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  offers: SparkOffer[];
  filters: BotFilters;
  onSelectOffer?: (offer: SparkOffer) => void;
  onOpenSettingsTab?: (tabId: string) => void;
}

export interface SettingSearchResult {
  id: string;
  name: string;
  category: string;
  value: string;
  description: string;
  targetTab?: string;
}

const SETTINGS_DATABASE: SettingSearchResult[] = [
  {
    id: 'min-total-pay',
    name: 'Minimum Total Payout Filter',
    category: 'Bot Filters',
    value: 'minTotalPay',
    description: 'Minimum dollar amount required to trigger auto-accept',
    targetTab: 'filters'
  },
  {
    id: 'min-pay-per-mile',
    name: 'Minimum Rate Per Mile ($/mi)',
    category: 'Bot Filters',
    value: 'minPayPerMile',
    description: 'Minimum payout per driving mile threshold',
    targetTab: 'filters'
  },
  {
    id: 'max-distance',
    name: 'Maximum Mileage Cap',
    category: 'Bot Filters',
    value: 'maxDistance',
    description: 'Maximum allowed total trip distance cap',
    targetTab: 'filters'
  },
  {
    id: 'reaction-speed',
    name: 'Auto-Clicker Reaction Speed (ms)',
    category: 'Bot Filters',
    value: 'reactionSpeedMs',
    description: 'Humanized tap speed latency interval',
    targetTab: 'filters'
  },
  {
    id: 'audio-alerts',
    name: 'Audio Synthesizer Alerts',
    category: 'Sound Alerts',
    value: 'audioEnabled',
    description: 'Toggle custom offer chime audio feedback',
    targetTab: 'alerts'
  },
  {
    id: 'telegram-bot',
    name: 'Telegram Bot Billing & Commands',
    category: 'Integrations',
    value: 'Telegram Dispatcher',
    description: 'Configure bot token, chat ID & status commands',
    targetTab: 'telegram'
  },
  {
    id: 'webex-latency',
    name: 'Webex Telemetry & Latency Threshold',
    category: 'Network',
    value: 'ciscospark.com',
    description: 'Monitor RTT latency spikes & auto-healing streams',
    targetTab: 'webex'
  },
  {
    id: 'theme-customizer',
    name: 'Custom Theme Color Palette Switcher',
    category: 'Branding',
    value: 'Palette Presets',
    description: 'Toggle Cyberpunk, Matrix, Sunset Crimson & High Contrast themes',
    targetTab: 'branding'
  },
  {
    id: 'driver-wallet',
    name: 'Driver Wallet & Instant Cash Out',
    category: 'Financials',
    value: 'Stripe & PayPal',
    description: 'Manage earnings, deposits and automated payout schedules',
    targetTab: 'wallet'
  }
];

export default function GlobalSearchModal({
  isOpen,
  onClose,
  logs,
  offers,
  filters,
  onSelectOffer,
  onOpenSettingsTab
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'LOGS' | 'OFFERS' | 'SETTINGS'>('ALL');

  const trimmedQuery = query.trim().toLowerCase();

  // Filtered Logs
  const matchedLogs = useMemo(() => {
    if (!trimmedQuery) return logs.slice(0, 10);
    return logs.filter(
      l =>
        l.message.toLowerCase().includes(trimmedQuery) ||
        (l.badge && l.badge.toLowerCase().includes(trimmedQuery)) ||
        l.type.toLowerCase().includes(trimmedQuery) ||
        l.timestamp.toLowerCase().includes(trimmedQuery)
    ).slice(0, 15);
  }, [logs, trimmedQuery]);

  // Filtered Offers
  const matchedOffers = useMemo(() => {
    if (!trimmedQuery) return offers.slice(0, 10);
    return offers.filter(
      o =>
        o.storeName.toLowerCase().includes(trimmedQuery) ||
        o.id.toLowerCase().includes(trimmedQuery) ||
        o.platform.toLowerCase().includes(trimmedQuery) ||
        o.type.toLowerCase().includes(trimmedQuery) ||
        o.totalPay.toString().includes(trimmedQuery)
    ).slice(0, 15);
  }, [offers, trimmedQuery]);

  // Filtered Settings
  const matchedSettings = useMemo(() => {
    if (!trimmedQuery) return SETTINGS_DATABASE;
    return SETTINGS_DATABASE.filter(
      s =>
        s.name.toLowerCase().includes(trimmedQuery) ||
        s.category.toLowerCase().includes(trimmedQuery) ||
        s.description.toLowerCase().includes(trimmedQuery)
    );
  }, [trimmedQuery]);

  const totalResults = matchedLogs.length + matchedOffers.length + matchedSettings.length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.15)] max-w-2xl w-full overflow-hidden text-left flex flex-col max-h-[80vh]"
        >
          {/* Header Search Input */}
          <div className="p-4 border-b border-neutral-850 flex items-center gap-3 bg-neutral-900/60">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search logs, error codes, offer history, stores, or settings..."
              className="flex-1 bg-transparent text-white placeholder-neutral-500 font-mono text-sm outline-none border-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-neutral-500 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white font-mono text-xs rounded border border-neutral-750 transition-colors"
            >
              ESC
            </button>
          </div>

          {/* Filter Categories Bar */}
          <div className="px-4 py-2 bg-neutral-900/30 border-b border-neutral-850 flex items-center gap-2 overflow-x-auto text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                activeCategory === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              ALL RESULTS ({totalResults})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('LOGS')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all ${
                activeCategory === 'LOGS'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Terminal className="w-3 h-3 text-amber-400" />
              LOGS ({matchedLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('OFFERS')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all ${
                activeCategory === 'OFFERS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <History className="w-3 h-3 text-emerald-400" />
              OFFER HISTORY ({matchedOffers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('SETTINGS')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all ${
                activeCategory === 'SETTINGS'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Sliders className="w-3 h-3 text-sky-400" />
              SETTINGS ({matchedSettings.length})
            </button>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {totalResults === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Search className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
                <p className="text-xs font-mono text-neutral-400">No matching search entries found.</p>
                <p className="text-[10px] text-neutral-600">Try searching for "502", "Walmart", "Min Pay", "Webex", or "Audio".</p>
              </div>
            ) : (
              <>
                {/* SETTINGS MATCHES */}
                {(activeCategory === 'ALL' || activeCategory === 'SETTINGS') && matchedSettings.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>System Settings & Configs ({matchedSettings.length})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {matchedSettings.map(setting => (
                        <div
                          key={setting.id}
                          onClick={() => {
                            if (setting.targetTab && onOpenSettingsTab) {
                              onOpenSettingsTab(setting.targetTab);
                              onClose();
                            }
                          }}
                          className="p-2.5 bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-sky-500/40 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                                {setting.name}
                              </span>
                              <span className="text-[8.5px] font-mono px-1.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                                {setting.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 font-sans">{setting.description}</p>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>OPEN</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OFFER HISTORY MATCHES */}
                {(activeCategory === 'ALL' || activeCategory === 'OFFERS') && matchedOffers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Offer History Records ({matchedOffers.length})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {matchedOffers.map(offer => (
                        <div
                          key={offer.id}
                          onClick={() => {
                            if (onSelectOffer) {
                              onSelectOffer(offer);
                              onClose();
                            }
                          }}
                          className="p-2.5 bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs font-mono font-black text-emerald-400 block">
                                ${offer.totalPay.toFixed(2)}
                              </span>
                              <span className="text-[8.5px] font-mono text-neutral-500 block">
                                {offer.distance} mi
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                                  {offer.storeName}
                                </span>
                                <span className="text-[8.5px] font-mono px-1 bg-neutral-800 text-neutral-400 rounded">
                                  #{offer.id}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-neutral-500 block">
                                {offer.platform} • {offer.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${
                              offer.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              offer.status === 'declined' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {offer.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LOG MATCHES */}
                {(activeCategory === 'ALL' || activeCategory === 'LOGS') && matchedLogs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      <span>System Action & Telemetry Logs ({matchedLogs.length})</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[10.5px]">
                      {matchedLogs.map(log => (
                        <div
                          key={log.id}
                          className="p-2 bg-neutral-900/60 border border-neutral-850 rounded-lg flex items-start gap-2 hover:border-neutral-750 transition-colors"
                        >
                          <span className="text-neutral-500 shrink-0 text-[9px]">[{log.timestamp}]</span>
                          {log.badge && (
                            <span className="px-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[8px] font-bold shrink-0">
                              {log.badge}
                            </span>
                          )}
                          <span className="text-neutral-300 break-words flex-1 leading-snug">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Info Bar */}
          <div className="p-3 bg-neutral-900/90 border-t border-neutral-850 text-[10px] font-mono text-neutral-500 flex items-center justify-between">
            <span>Press ESC or click outside to dismiss global search</span>
            <span className="text-cyan-400 font-bold">HGT GLOBAL INDEXER READY</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
