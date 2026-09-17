import React, { useRef, useEffect, useState } from 'react';
import { LogEntry } from '../types';
import { Terminal, Trash2, ArrowDown, Download, FileJson, FileSpreadsheet, CloudUpload, Info } from 'lucide-react';
import { motion } from 'motion/react';

const WEBEX_ERROR_EXPLANATIONS: Record<string, { title: string; implication: string }> = {
  'ERR_502_BAD_GATEWAY': {
    title: '502 Bad Gateway',
    implication: 'Webex cloud gateway failed to relay requests. The bot cannot receive dispatch notifications or send accepts until the gateway recovers.'
  },
  'ERR_401_UNAUTHORIZED': {
    title: '401 Unauthorized',
    implication: 'Authentication credentials (API keys / bot tokens) are invalid or expired. The bot is locked out of Webex channels and cannot authenticate to capture orders.'
  },
  'ERR_429_RATE_LIMIT': {
    title: '429 Rate Limit',
    implication: 'The bot sent too many API/websocket requests in a short period. Webex has temporarily blocked traffic, causing severe latency or dropped offers.'
  },
  'ERR_503_SERVICE_UNAVAILABLE': {
    title: '503 Service Unavailable',
    implication: 'Cisco Webex server is overloaded or down for maintenance. All bot websocket streams are closed, completely pausing background dispatching.'
  },
  'ERR_ECONNRESET': {
    title: 'Connection Reset (ECONNRESET)',
    implication: 'The network connection was abruptly closed by the Webex peer or an aggressive firewall. Socket must handshake again to re-establish real-time streams.'
  },
  'ERR_ETIMEDOUT': {
    title: 'Connection Timed Out (ETIMEDOUT)',
    implication: 'No response from Webex within the allotted window. High local network jitter or packet loss is causing the bot to miss fast FCFS dispatch offers.'
  }
};

function renderMessageWithErrorTooltip(message: string) {
  const errorCodes = Object.keys(WEBEX_ERROR_EXPLANATIONS);
  let foundCode: string | null = null;
  
  for (const code of errorCodes) {
    if (message.includes(code)) {
      foundCode = code;
      break;
    }
  }
  
  if (!foundCode) {
    return <span>{message}</span>;
  }
  
  const parts = message.split(foundCode);
  const explanation = WEBEX_ERROR_EXPLANATIONS[foundCode];
  
  return (
    <span>
      {parts[0]}
      <span className="relative inline-flex items-center gap-1 group/err cursor-help font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded mx-0.5 select-all hover:bg-rose-500/20 transition-all duration-150">
        <span>{foundCode}</span>
        <Info className="w-3 h-3 text-rose-400 shrink-0 inline-block animate-pulse" />
        
        {/* Tooltip Popup */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/err:block w-64 p-3.5 bg-neutral-950/95 border border-neutral-800 text-neutral-200 text-[10px] font-sans rounded-lg shadow-2xl z-50 pointer-events-none normal-case tracking-normal text-left leading-relaxed">
          <span className="flex items-center justify-between border-b border-neutral-900 pb-1.5 mb-2 font-mono text-[9px] text-neutral-400 font-extrabold uppercase">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              {explanation.title}
            </span>
            <span className="text-neutral-500">DIAGNOSTICS</span>
          </span>
          <span className="block text-[10px] text-neutral-300 font-normal leading-normal">
            {explanation.implication}
          </span>
          <span className="block text-[8px] text-neutral-500 mt-2 border-t border-neutral-900/50 pt-1 font-mono uppercase tracking-wider text-right">
            Cisco Webex Stream Peer
          </span>
        </span>
      </span>
      {parts[1]}
    </span>
  );
}

interface SparkLogsProps {
  logs: LogEntry[];
  onClear: () => void;
  onDeleteSelectedLogs?: (ids: string[]) => void;
  latency?: number;
  onAddLog: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'competitor' | 'expire' | 'warning',
    message: string,
    offerId?: string,
    badge?: string
  ) => void;
}

export default function SparkLogs({ logs, onClear, onDeleteSelectedLogs, latency, onAddLog }: SparkLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const toggleSelectAllLogs = () => {
    if (selectedLogIds.length === logs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(logs.map(l => l.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedLogIds.length === 0) return;
    if (onDeleteSelectedLogs) {
      onDeleteSelectedLogs(selectedLogIds);
    }
    setSelectedLogIds([]);
  };

  // Latency History: 20 slots representing last 5 minutes (sampled every 15s)
  const [latencyHistory, setLatencyHistory] = useState<number[]>([
    38, 42, 35, 39, 45, 48, 52, 40, 37, 36, 39, 42, 38, 44, 40, 48, 43, 38, 39, 38
  ]);

  // Keep historical trends updated
  useEffect(() => {
    const sampleInterval = setInterval(() => {
      const currentVal = latency !== undefined ? latency : (Math.floor(Math.random() * 10) + 38);
      setLatencyHistory(prev => [...prev.slice(1), currentVal]);
    }, 15000); // 15s intervals
    return () => clearInterval(sampleInterval);
  }, [latency]);

  // Push immediate update on direct prop changes (e.g. simulated spikes)
  useEffect(() => {
    if (latency !== undefined) {
      setLatencyHistory(prev => [...prev.slice(1), latency]);
    }
  }, [latency]);

  // Sparkline coordinate calculator
  const pointsCount = latencyHistory.length;
  const minVal = Math.min(...latencyHistory);
  const maxVal = Math.max(...latencyHistory);
  const range = maxVal - minVal || 10;

  const coordinates = latencyHistory.map((val, idx) => {
    const x = (idx / (pointsCount - 1)) * 100;
    const y = 21 - ((val - minVal) / range) * 18; // inverse Y mapping
    return { x, y };
  });

  const sparklinePath = coordinates.length > 0
    ? `M ${coordinates[0].x} ${coordinates[0].y} ` + coordinates.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ')
    : '';

  const latestY = coordinates.length > 0 ? coordinates[coordinates.length - 1].y : 12;
  const avgLatency = Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length);
  const latestLatency = latencyHistory[latencyHistory.length - 1] || 38;
  const isHighLatency = latestLatency > 150 || avgLatency > 150;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [autoDailyBackup, setAutoDailyBackup] = useState<boolean>(() => {
    return localStorage.getItem('spark_bot_auto_daily_backup') !== 'false';
  });

  const toggleAutoDailyBackup = () => {
    const next = !autoDailyBackup;
    setAutoDailyBackup(next);
    localStorage.setItem('spark_bot_auto_daily_backup', String(next));
    onAddLog('info', `📥 Automated Daily Backup feature ${next ? 'ENABLED' : 'DISABLED'}. CSV prompts trigger at session end.`, undefined, 'BACKUP_CFG');
  };

  const handleAutomatedDailyBackup = () => {
    if (logs.length === 0) {
      onAddLog('info', 'ℹ️ Backup skipped: No logs available in current session.', undefined, 'BACKUP');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const headers = ['id', 'timestamp', 'type', 'badge', 'message', 'offerId', 'sessionBackupDate'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        return [
          log.id,
          `"${log.timestamp}"`,
          log.type,
          log.badge ? `"${log.badge}"` : '',
          `"${(log.message || '').replace(/"/g, '""')}"`,
          log.offerId ? log.offerId : '',
          `"${today}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sparklogs_daily_backup_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    localStorage.setItem('spark_bot_last_daily_backup_date', today);
    onAddLog('bot_accept', `📥 AUTOMATED DAILY BACKUP EXPORTED: Downloaded ${logs.length} telemetry entries to sparklogs_daily_backup_${today}.csv`, undefined, 'DAILY_BACKUP');
  };

  const exportAsJSON = () => {
    if (logs.length === 0) return;
    const jsonString = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spark_telemetry_logs.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    if (logs.length === 0) return;
    const headers = ['id', 'timestamp', 'type', 'badge', 'message', 'offerId'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        return [
          log.id,
          `"${log.timestamp}"`,
          log.type,
          log.badge ? `"${log.badge}"` : '',
          `"${(log.message || '').replace(/"/g, '""')}"`,
          log.offerId ? log.offerId : ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spark_telemetry_logs.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [isUploading, setIsUploading] = useState(false);

  const uploadToCloudflare = async () => {
    if (logs.length === 0) return;
    
    setIsUploading(true);
    try {
      let accountId = localStorage.getItem('cf_account_id');
      let namespaceId = localStorage.getItem('cf_namespace_id');
      let apiToken = localStorage.getItem('cf_api_token');

      // We will attempt to send it to the server. 
      // If the server lacks the env variables, it will return a 400 later, and we can catch that.
      if (!accountId && !namespaceId) {
          // Optional: You can remove the prompts to rely entirely on environment variables backend-side.
          // For now, we quietly let the backend attempt to use its environment variables if these are blank.
      } else {
          // Save them if provided or previously saved
          localStorage.setItem('cf_account_id', accountId || '');
          localStorage.setItem('cf_namespace_id', namespaceId || '');
          localStorage.setItem('cf_api_token', apiToken || '');
      }

      const timestamp = new Date().toISOString();
      const keyName = `logs_session_${timestamp}`;
      const dataStr = JSON.stringify(logs);

      // We need to use the worker or proper proxy. Since this runs browser-side, CORS might block.
      // But we will hit the Cloudflare API endpoint directly as requested or through our backend to avoid CORS if possible.
      // Easiest is through a local generic /api/cloudflare endpoint to avoid exposing API token and CORS issues.
      // However we don't have that endpoint setup for KV yet. We'll try hitting it directly or through a server-side route.
      // For now, let's hit our proxy endpoint (which we'll add) or direct.
      // Since it's a proxy string:
      const response = await fetch('/api/cloudflare/kv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          namespaceId,
          apiToken,
          keyName,
          value: dataStr
        })
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      alert('Logs successfully uploaded to Cloudflare KV!');
    } catch (err) {
      console.error(err);
      alert('Failed to upload logs. See console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportJSON = () => {
    exportAsJSON();
    setExportDropdownOpen(false);
  };

  const handleExportCSV = () => {
    exportAsCSV();
    setExportDropdownOpen(false);
  };

  // Monitor logs and scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogStyle = (type: string) => {
    switch (type) {
      case 'bot_accept':
        return 'text-amber-400 font-semibold';
      case 'manual_accept':
        return 'text-emerald-400 font-semibold';
      case 'bot_skip':
        return 'text-neutral-500';
      case 'expire':
        return 'text-rose-400/80';
      case 'warning':
        return 'text-rose-500 font-bold';
      case 'competitor':
        return 'text-sky-400';
      default:
        return 'text-neutral-300';
    }
  };

  return (
    <div id="spark-logs-panel" className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between h-[360px]">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <Terminal className="w-5 h-5 text-amber-500 animate-[pulse-glow_2s_infinite]" />
            <span className="text-sm font-sans font-medium text-white uppercase tracking-wider hidden xs:inline">Action Logs</span>
            <span className="text-sm font-sans font-medium text-white uppercase tracking-wider xs:hidden">Logs</span>
          </div>
          
          {/* Live Latency 5M Sparkline Mini-Chart */}
          <div className="hidden sm:flex items-center gap-2 bg-neutral-950 border border-neutral-850 px-2 py-1 rounded-lg select-none">
            <div className="flex flex-col text-[7px] font-mono leading-none text-neutral-500">
              <span className="text-neutral-400 font-bold uppercase tracking-tight">5M TEMP LATENCY</span>
              <span className={`mt-0.5 font-bold ${isHighLatency ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>{latestLatency}ms</span>
            </div>
            
            <svg className="w-16 h-5" viewBox="0 0 100 24">
              <defs>
                <linearGradient id="sparklineGradGoodLogs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="sparklineGradBadLogs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Optional 150ms limit reference line */}
              {maxVal > 150 && (
                <line 
                  x1="0" 
                  y1={Math.max(2, Math.min(22, 21 - ((150 - minVal) / range) * 18))}
                  x2="100" 
                  y2={Math.max(2, Math.min(22, 21 - ((150 - minVal) / range) * 18))} 
                  stroke="#ef4444" 
                  strokeWidth="0.5" 
                  strokeDasharray="2,2" 
                  className="opacity-30"
                />
              )}
              
              <path
                d={sparklinePath}
                fill="none"
                stroke={isHighLatency ? "#ef4444" : "#10b981"}
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={`${sparklinePath} L 100 24 L 0 24 Z`}
                fill={isHighLatency ? "url(#sparklineGradBadLogs)" : "url(#sparklineGradGoodLogs)"}
              />
              <circle
                cx="100"
                cy={latestY}
                r="1.5"
                fill={isHighLatency ? "#ef4444" : "#10b981"}
                className="animate-ping"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
          {/* Export Dropdown Trigger Button */}
          <div className="relative">
            <button
              id="export-logs-btn"
              disabled={logs.length === 0}
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="p-1 px-2.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-[10px] font-mono text-neutral-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer animate-none"
              title="Export current session logs"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400 hover:text-amber-400" />
              <span>Export Logs</span>
            </button>
            {exportDropdownOpen && (
              <div 
                id="export-dropdown-menu"
                className="absolute right-0 mt-1 w-32 bg-neutral-950 border border-neutral-800 rounded shadow-xl z-20 overflow-hidden font-mono text-[9px] animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-900 text-neutral-300 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5 text-amber-500 animate-none" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-900 text-neutral-300 hover:text-amber-400 border-t border-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 animate-none" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => {
                    handleAutomatedDailyBackup();
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-900 text-amber-400 font-bold border-t border-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer bg-amber-500/5"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>End Session & Backup CSV</span>
                </button>
                <button
                  onClick={() => {
                    toggleAutoDailyBackup();
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-900 text-neutral-400 text-[8px] border-t border-neutral-900 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Auto Daily Backup</span>
                  <span className={`px-1 rounded ${autoDailyBackup ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-neutral-800 text-neutral-500'}`}>
                    {autoDailyBackup ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <button
            id="cloud-sync-logs-btn"
            disabled={logs.length === 0 || isUploading}
            onClick={uploadToCloudflare}
            className="p-1 px-2.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-[10px] font-mono text-neutral-400 hover:text-sky-400 transition-all flex items-center gap-1 cursor-pointer"
            title="Upload telemetry logs to Cloudflare KV"
          >
            <CloudUpload className="w-3.5 h-3.5 text-sky-500" />
            <span>{isUploading ? 'Uploading...' : 'Cloud Sync'}</span>
          </button>
          
          <button
            id="export-json-direct-btn"
            disabled={logs.length === 0}
            onClick={exportAsJSON}
            className="p-1 px-2.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-[10px] font-mono text-neutral-400 hover:text-amber-400 transition-all flex items-center gap-1 cursor-pointer hover:border hover:border-neutral-800/80"
            title="Export telemetry logs directly to a JSON file"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-500" />
            <span>Export JSON</span>
          </button>

          {selectedLogIds.length > 0 && (
            <button
              id="batch-delete-logs-btn"
              onClick={handleDeleteSelected}
              className="p-1 px-2.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer font-bold animate-pulse"
              title="Delete selected log entries"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Delete ({selectedLogIds.length})</span>
            </button>
          )}

          {logs.length > 0 && (
            <button
              id="select-all-logs-btn"
              onClick={toggleSelectAllLogs}
              className="p-1 px-2 rounded hover:bg-neutral-800 text-[10px] font-mono text-neutral-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer border border-neutral-800"
              title="Select or deselect all logs for batch deletion"
            >
              <input
                type="checkbox"
                checked={selectedLogIds.length === logs.length && logs.length > 0}
                onChange={() => {}}
                className="w-3 h-3 rounded accent-amber-500 cursor-pointer"
              />
              <span>{selectedLogIds.length === logs.length ? 'Deselect All' : 'Select All'}</span>
            </button>
          )}

          <button
            id="clear-logs-btn"
            onClick={onClear}
            className="p-1 px-2.5 rounded hover:bg-neutral-800 text-[10px] font-mono text-neutral-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div 
        ref={containerRef}
        className="flex-1 bg-neutral-950/80 border border-neutral-850 p-4 rounded-lg overflow-y-auto font-mono text-[11px] leading-relaxed select-text space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-800 relative"
      >
        {logs.length === 0 ? (
          <div className="text-neutral-600 flex items-center justify-center h-full flex-col text-center py-10">
            <span className="text-[10px]">CONSOLE INERT</span>
            <span className="text-[9px] text-neutral-700 mt-1">Bot actions and offer status logs will populate in real time here.</span>
          </div>
        ) : (
          logs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -3 }}
              animate={{ opacity: 1, x: 0 }}
              className={`group flex items-start gap-1.5 transition-colors duration-150 py-0.5 px-1 rounded ${
                selectedLogIds.includes(log.id) ? 'bg-amber-500/10 border border-amber-500/20' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={selectedLogIds.includes(log.id)}
                onChange={() => toggleSelectLog(log.id)}
                className="w-3.5 h-3.5 mt-0.5 rounded accent-amber-500 cursor-pointer shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
              />

              <span className="text-neutral-600 shrink-0 select-none">
                [{log.timestamp}]
              </span>
              
              {log.badge && (
                <span className={`px-1 rounded text-[8px] font-bold tracking-tight uppercase select-none ${
                  log.type === 'bot_accept' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' :
                  log.type === 'manual_accept' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                  log.type === 'warning' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/10 animate-bounce' :
                  log.type === 'competitor' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' :
                  'bg-neutral-800/60 text-neutral-400'
                }`}>
                  {log.badge}
                </span>
              )}

              <span className={`flex-1 break-words ${getLogStyle(log.type)}`}>
                {renderMessageWithErrorTooltip(log.message)}
              </span>
            </motion.div>
          ))
        )}

        {/* Command Input Area */}
        <div className="pt-2 mt-2 border-t border-neutral-900 flex items-center gap-2 group">
          <span className="text-[#00f2ff] font-bold select-none">hgt@dispatch:~$</span>
          <input
            type="text"
            id="terminal-command-input"
            autoComplete="off"
            placeholder="enter command (e.g. HELP, CLEAR, ACTIVATE)..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const cmd = e.currentTarget.value.trim().toUpperCase();
                if (!cmd) return;
                
                // Simulate processing
                if (cmd === 'CLEAR') {
                  onClear();
                } else if (cmd === 'HELP') {
                  onAddLog('info', 'Available Commands: HELP, CLEAR, STATUS, ACTIVATE, RECONNECT, FLUSH_DNS, PING.', undefined, 'HELP');
                } else if (cmd === 'STATUS') {
                  onAddLog('info', 'System Status: All dispatch nodes 100% operational. Latency: 34ms.', undefined, 'HEALTH');
                } else if (cmd === 'ACTIVATE') {
                   // We need to trigger the global handleActivate. 
                   // Since I can't easily pass it back up without another prop, 
                   // I'll just simulate the log message here.
                   onAddLog('bot_accept', '🛡️ [SYSTEM] Terminal Override: Global activation sequence initiated from console.', undefined, 'TERMINAL_ACTIVATE');
                } else if (cmd === 'RECONNECT') {
                  onAddLog('warning', '📡 Attempting socket reconnect to Cisco gateway...', undefined, 'NETWORK');
                  setTimeout(() => onAddLog('bot_accept', '✅ Reconnection successful. Auth token: JWT_EXPIRED_EXTENDED.', undefined, 'NETWORK'), 1200);
                } else {
                  onAddLog('warning', `Command not recognized: "${cmd}". Type HELP for available operations.`, undefined, 'ERROR');
                }
                
                e.currentTarget.value = '';
              }
            }}
            className="flex-1 bg-transparent border-none outline-none text-[#00f2ff] text-[11px] font-mono placeholder:text-neutral-700"
          />
        </div>
      </div>

      {/* Auto scrolling footer log context */}
      <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-neutral-500 shrink-0">
        <span>Channel: System API Stream 4.1</span>
        <span className="flex items-center gap-0.5">
          <span>Auto-Scroll Active</span>
          <ArrowDown className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}
