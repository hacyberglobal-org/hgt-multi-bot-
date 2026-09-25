import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Activity, Wifi, WifiOff, Search, Filter, Clock, Zap, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, Download, Trash2, X,
  Server, ShieldAlert, ArrowDownUp, Radio, FileText, Check, Copy, TrendingUp, BarChart2,
  Archive, RotateCcw, Box, HardDrive, GitCompare, Calendar, Table, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Search Result Text Highlighting Component
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim() || !text) {
    return <>{text}</>;
  }
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-amber-400 text-neutral-950 font-black px-0.5 rounded shadow-[0_0_8px_rgba(251,191,36,0.8)]"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

const ARCHIVE_STORAGE_KEY = 'webex_connectivity_archive_v1';

export interface WebexHeartbeatEvent {
  id: string;
  timestamp: string;
  createdMs?: number;
  status: 'SUCCESS' | 'FAILURE' | 'DEGRADED' | 'TIMEOUT';
  pingMs: number;
  httpStatus: number;
  endpoint: string;
  rttDetails: string;
  errorMessage?: string;
}

export interface WebexConnectivityLogProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAddLog?: (type: string, message: string, detail?: string, code?: string) => void;
  webexPingMs?: number;
  webexStatus?: string;
  webexLatencyThreshold?: number;
  onThresholdChange?: (val: number) => void;
  webexStatusHistory?: { status: string; timestamp: string }[];
  onOpenHandshakeModal?: () => void;
}

const INITIAL_EVENTS: WebexHeartbeatEvent[] = [
  {
    id: 'HB-9801',
    timestamp: new Date(Date.now() - 1000 * 12).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 12,
    status: 'SUCCESS',
    pingMs: 28,
    httpStatus: 200,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    rttDetails: 'TLS 1.3 Keep-Alive packet acknowledged. Zero frame drops.'
  },
  {
    id: 'HB-9800',
    timestamp: new Date(Date.now() - 1000 * 45).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 45,
    status: 'SUCCESS',
    pingMs: 34,
    httpStatus: 200,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    rttDetails: 'Heartbeat response within normal parameters (34ms RTT).'
  },
  {
    id: 'HB-9799',
    timestamp: new Date(Date.now() - 1000 * 90).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 90,
    status: 'DEGRADED',
    pingMs: 118,
    httpStatus: 200,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    rttDetails: 'High network latency spike detected on US-East Cloud Run region.',
    errorMessage: 'RTT exceeded 80ms warning threshold (118ms).'
  },
  {
    id: 'HB-9798',
    timestamp: new Date(Date.now() - 1000 * 150).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 150,
    status: 'FAILURE',
    pingMs: 0,
    httpStatus: 503,
    endpoint: 'https://api.ciscospark.com/v1/spark/streams',
    rttDetails: 'Cisco Webex gateway returned HTTP 503 Service Unavailable.',
    errorMessage: '503 Service Unavailable: Gateway busy during high offer dispatch surge.'
  },
  {
    id: 'HB-9797',
    timestamp: new Date(Date.now() - 1000 * 210).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 210,
    status: 'TIMEOUT',
    pingMs: 1000,
    httpStatus: 408,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    rttDetails: 'Heartbeat connection timed out after 1000ms threshold.',
    errorMessage: 'Connection timeout (408). Retrying websocket handshake.'
  },
  {
    id: 'HB-9796',
    timestamp: new Date(Date.now() - 1000 * 300).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 300,
    status: 'SUCCESS',
    pingMs: 25,
    httpStatus: 200,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    rttDetails: 'Session re-established successfully. Stream synchronized.'
  },
  {
    id: 'HB-9795',
    timestamp: new Date(Date.now() - 1000 * 420).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 420,
    status: 'SUCCESS',
    pingMs: 31,
    httpStatus: 200,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    rttDetails: 'Heartbeat response nominal.'
  },
];

const DEMO_ARCHIVED_EVENTS: WebexHeartbeatEvent[] = [
  {
    id: 'HB-8410',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toLocaleDateString() + ' ' + new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 60 * 60 * 24 * 18,
    status: 'SUCCESS',
    pingMs: 29,
    httpStatus: 200,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    rttDetails: 'Archived legacy heartbeat log entry (18 days old). Stored in secondary local storage Archive.'
  },
  {
    id: 'HB-8102',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toLocaleDateString() + ' ' + new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toLocaleTimeString(),
    createdMs: Date.now() - 1000 * 60 * 60 * 24 * 25,
    status: 'DEGRADED',
    pingMs: 105,
    httpStatus: 200,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    rttDetails: 'Archived legacy heartbeat log entry (25 days old). Stored in secondary local storage Archive.'
  }
];

export default function WebexConnectivityLog({
  isOpen = true,
  onClose,
  onAddLog,
  webexPingMs = 32,
  webexStatus = 'Connected',
  webexLatencyThreshold = 80,
  onThresholdChange,
  onOpenHandshakeModal
}: WebexConnectivityLogProps) {
  const [events, setEvents] = useState<WebexHeartbeatEvent[]>(INITIAL_EVENTS);
  const [archivedEvents, setArchivedEvents] = useState<WebexHeartbeatEvent[]>(() => {
    try {
      const saved = localStorage.getItem(ARCHIVE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load archived Webex logs:', e);
    }
    return DEMO_ARCHIVED_EVENTS;
  });

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [telemetryMode, setTelemetryMode] = useState<'SPARKLINE' | 'HISTOGRAM'>('SPARKLINE');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE' | 'DEGRADED' | 'TIMEOUT'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'SLOWEST'>('NEWEST');
  const [latencyThreshold, setLatencyThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('spark_bot_webex_latency_threshold') || localStorage.getItem('webex_latency_threshold');
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= 30 && parsed <= 100) return parsed;
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load webex_latency_threshold from localStorage:', e);
    }
    return webexLatencyThreshold;
  });

  // Sync threshold with prop if provided externally
  useEffect(() => {
    if (webexLatencyThreshold && webexLatencyThreshold !== latencyThreshold) {
      setLatencyThreshold(webexLatencyThreshold);
    }
  }, [webexLatencyThreshold]);

  // Save latencyThreshold changes to localStorage and inform parent listener
  useEffect(() => {
    try {
      localStorage.setItem('spark_bot_webex_latency_threshold', String(latencyThreshold));
      localStorage.setItem('webex_latency_threshold', String(latencyThreshold));
    } catch (e) {
      console.error('Failed to persist webex_latency_threshold:', e);
    }
    if (onThresholdChange) {
      onThresholdChange(latencyThreshold);
    }
  }, [latencyThreshold, onThresholdChange]);
  const [cleanupDaysThreshold, setCleanupDaysThreshold] = useState<number>(14);
  const [cleanupNotice, setCleanupNotice] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [hoveredHistogramBin, setHoveredHistogramBin] = useState<string | null>(null);
  const [autoHeartbeatEnabled, setAutoHeartbeatEnabled] = useState<boolean>(true);
  const [pollingIntervalSec, setPollingIntervalSec] = useState<number>(10);
  const [showCompareLatency, setShowCompareLatency] = useState<boolean>(false);

  // Export CSV Options Modal & Date Picker State
  const [isExportCsvModalOpen, setIsExportCsvModalOpen] = useState<boolean>(false);
  const [csvStartDate, setCsvStartDate] = useState<string>('');
  const [csvEndDate, setCsvEndDate] = useState<string>('');
  const [csvLogTypeFilter, setCsvLogTypeFilter] = useState<'ALL' | 'WARNINGS_ERRORS' | 'SUCCESS' | 'DEGRADED' | 'FAILURE' | 'TIMEOUT'>('ALL');
  const [showCsvColumnPreview, setShowCsvColumnPreview] = useState<boolean>(true);

  // --- EMERGENCY RECONNECT MODAL & DISCONNECT TRACKER STATE (>30s Trigger) ---
  const [disconnectedSeconds, setDisconnectedSeconds] = useState<number>(0);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isSimulatingDisconnect, setIsSimulatingDisconnect] = useState<boolean>(false);

  // --- HIGH LATENCY TREND DETECTION & AUTO-HEALING STATE (3 consecutive cycles) ---
  const [consecutiveHighLatencyCount, setConsecutiveHighLatencyCount] = useState<number>(0);
  const [lastAutoHealTime, setLastAutoHealTime] = useState<string | null>(null);

  // --- SUPPORT TICKET EMAIL SUMMARY COPIED STATE ---
  const [copiedSupportEmail, setCopiedSupportEmail] = useState<boolean>(false);

  // Disconnection timer effect: Trigger Emergency Modal when disconnected > 30 seconds
  useEffect(() => {
    const isDisconnected = webexStatus === 'Disconnected' || webexStatus === 'OFFLINE' || webexStatus === 'FAILURE' || isSimulatingDisconnect;
    if (!isDisconnected) {
      setDisconnectedSeconds(0);
      setIsEmergencyModalOpen(false);
      return;
    }

    const timer = setInterval(() => {
      setDisconnectedSeconds(prev => {
        const next = prev + 1;
        if (next >= 30 && !isEmergencyModalOpen) {
          setIsEmergencyModalOpen(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [webexStatus, isSimulatingDisconnect, isEmergencyModalOpen]);

  // Handler for Emergency Reconnect Action
  const handleEmergencyReconnect = () => {
    setDisconnectedSeconds(0);
    setIsEmergencyModalOpen(false);
    setIsSimulatingDisconnect(false);
    setConsecutiveHighLatencyCount(0);

    // Inject re-established heartbeat event
    const newId = `HB-EMERG-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toLocaleTimeString();
    const reconnectEvent: WebexHeartbeatEvent = {
      id: newId,
      timestamp,
      createdMs: Date.now(),
      status: 'SUCCESS',
      pingMs: 24,
      httpStatus: 200,
      endpoint: 'https://api.ciscospark.com/v1/ping',
      rttDetails: '🚨 EMERGENCY RECONNECT EXECUTED: Webex WebSocket pipeline re-established. Spark auto-grabber listening stream active.'
    };

    setEvents(prev => [reconnectEvent, ...prev]);

    if (onAddLog) {
      onAddLog(
        'bot_accept',
        `🚨 EMERGENCY RECONNECT: Webex connection restored successfully! Auto-grabber listening stream is re-activated.`,
        undefined,
        'WEBEX_EMERGENCY_RECONNECT'
      );
    }
  };

  // Generate Support Ticket Email Summary (Last 50 Entries)
  const handleGenerateSupportTicketEmail = () => {
    const last50 = events.slice(0, 50);
    const successCount = last50.filter(e => e.status === 'SUCCESS').length;
    const degradedCount = last50.filter(e => e.status === 'DEGRADED').length;
    const failureCount = last50.filter(e => e.status === 'FAILURE' || e.status === 'TIMEOUT').length;
    const validPings = last50.filter(e => e.pingMs > 0).map(e => e.pingMs);
    const avgPing = validPings.length > 0 ? (validPings.reduce((a, b) => a + b, 0) / validPings.length).toFixed(1) : '32.0';

    const systemId = 'b8b338e8-ac03-4824-ada7-57562dd776f4';
    const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-dlxtcm22exfd5ssxaa6siv-201471674421.us-east5.run.app';

    let emailText = `SUBJECT: [SUPPORT TICKET] Cisco Webex Connectivity & Telemetry Audit Log - System #${systemId.substring(0, 8)}\n\n`;
    emailText += `====================================================\n`;
    emailText += `CISCO WEBEX CONNECTIVITY SUPPORT TICKET SUMMARY\n`;
    emailText += `====================================================\n`;
    emailText += `Generated At: ${new Date().toLocaleString()}\n`;
    emailText += `System ID: ${systemId}\n`;
    emailText += `App URL: ${appUrl}\n`;
    emailText += `Current Webex Status: ${webexStatus} (Live Ping: ${webexPingMs}ms)\n`;
    emailText += `Configured Latency Threshold: ${latencyThreshold}ms\n`;
    emailText += `Total Log Entries Analyzed: ${last50.length}\n\n`;

    emailText += `PERFORMANCE METRICS SUMMARY (LAST 50 EVENTS):\n`;
    emailText += `- Nominal / Success (200 OK): ${successCount}\n`;
    emailText += `- Degraded Latency (> Threshold): ${degradedCount}\n`;
    emailText += `- Failures & Timeouts (5xx / 408): ${failureCount}\n`;
    emailText += `- Average RTT Latency: ${avgPing} ms\n\n`;

    emailText += `RECENT CONNECTIVITY LOG LEDGER (LAST 50 ENTRIES):\n`;
    emailText += `----------------------------------------------------\n`;

    last50.forEach((e, idx) => {
      emailText += `[${idx + 1}] ${e.timestamp} | Status: ${e.status} | Ping: ${e.pingMs}ms | HTTP ${e.httpStatus}\n`;
      emailText += `    Endpoint: ${e.endpoint}\n`;
      emailText += `    Details: ${e.rttDetails}\n`;
      if (e.errorMessage) {
        emailText += `    Error: ${e.errorMessage}\n`;
      }
      emailText += `\n`;
    });

    emailText += `----------------------------------------------------\n`;
    emailText += `END OF SUPPORT TICKET TELEMETRY AUDIT REPORT\n`;

    navigator.clipboard.writeText(emailText);
    setCopiedSupportEmail(true);
    setTimeout(() => setCopiedSupportEmail(false), 3000);

    if (onAddLog) {
      onAddLog(
        'info',
        `📋 SUPPORT TICKET: Bundled last 50 Webex connectivity log entries into email body and copied to clipboard!`,
        undefined,
        'SUPPORT_TICKET_COPY'
      );
    }
  };

  // Pool of events for active tab
  const currentPoolEvents = useMemo(() => {
    return activeTab === 'ACTIVE' ? events : archivedEvents;
  }, [activeTab, events, archivedEvents]);

  // Compute filtered events specifically for CSV export based on Date Range & Type Filter
  const csvFilteredEvents = useMemo(() => {
    let result = [...currentPoolEvents];

    // 1. Filter by Log Type Category
    if (csvLogTypeFilter === 'WARNINGS_ERRORS') {
      result = result.filter(e => e.status === 'DEGRADED' || e.status === 'FAILURE' || e.status === 'TIMEOUT' || !!e.errorMessage);
    } else if (csvLogTypeFilter === 'SUCCESS') {
      result = result.filter(e => e.status === 'SUCCESS');
    } else if (csvLogTypeFilter === 'DEGRADED') {
      result = result.filter(e => e.status === 'DEGRADED');
    } else if (csvLogTypeFilter === 'FAILURE') {
      result = result.filter(e => e.status === 'FAILURE');
    } else if (csvLogTypeFilter === 'TIMEOUT') {
      result = result.filter(e => e.status === 'TIMEOUT');
    }

    // 2. Filter by Start Date
    if (csvStartDate) {
      const startMs = new Date(csvStartDate + 'T00:00:00').getTime();
      if (!isNaN(startMs)) {
        result = result.filter(e => {
          const itemMs = e.createdMs || Date.parse(e.timestamp);
          return !isNaN(itemMs) ? itemMs >= startMs : true;
        });
      }
    }

    // 3. Filter by End Date
    if (csvEndDate) {
      const endMs = new Date(csvEndDate + 'T23:59:59').getTime();
      if (!isNaN(endMs)) {
        result = result.filter(e => {
          const itemMs = e.createdMs || Date.parse(e.timestamp);
          return !isNaN(itemMs) ? itemMs <= endMs : true;
        });
      }
    }

    return result;
  }, [currentPoolEvents, csvLogTypeFilter, csvStartDate, csvEndDate]);

  const setCsvDatePreset = (preset: 'ALL' | 'TODAY' | '7DAYS' | '30DAYS') => {
    const now = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'ALL') {
      setCsvStartDate('');
      setCsvEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = formatDate(now);
      setCsvStartDate(todayStr);
      setCsvEndDate(todayStr);
    } else if (preset === '7DAYS') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setCsvStartDate(formatDate(past));
      setCsvEndDate(formatDate(now));
    } else if (preset === '30DAYS') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setCsvStartDate(formatDate(past));
      setCsvEndDate(formatDate(now));
    }
  };

  const logViewportRef = useRef<HTMLDivElement | null>(null);
  const prevEventsCountRef = useRef<number>(events.length);

  // Automated API Latency Heartbeat Background Poller & High-Latency Trend Detection
  useEffect(() => {
    if (!autoHeartbeatEnabled) return;

    const intervalMs = Math.max(1, pollingIntervalSec) * 1000;

    const interval = setInterval(() => {
      const currentPing = webexPingMs > 0 ? webexPingMs : Math.floor(Math.random() * 22) + 20;
      const isDegraded = currentPing > latencyThreshold;
      const status: 'SUCCESS' | 'DEGRADED' = isDegraded ? 'DEGRADED' : 'SUCCESS';
      const newId = `HB-${Math.floor(9800 + Math.random() * 8000)}`;
      const timestamp = new Date().toLocaleTimeString();

      const newEvent: WebexHeartbeatEvent = {
        id: newId,
        timestamp,
        createdMs: Date.now(),
        status,
        pingMs: currentPing,
        httpStatus: 200,
        endpoint: 'https://api.ciscospark.com/v1/ping',
        rttDetails: `Automated ${pollingIntervalSec}s Heartbeat Summary: API latency measured at ${currentPing}ms (${status}). Connection active.`,
        errorMessage: isDegraded ? `Latency ${currentPing}ms exceeds threshold (${latencyThreshold}ms)` : undefined
      };

      setEvents(prev => [newEvent, ...prev]);

      // High Latency Trend Detection (3 consecutive cycles > threshold)
      if (isDegraded) {
        setConsecutiveHighLatencyCount(prevCount => {
          const nextCount = prevCount + 1;
          if (nextCount >= 3) {
            // Trigger Auto-Healing Webex Refresh
            const healTime = new Date().toLocaleTimeString();
            setLastAutoHealTime(healTime);

            const autoHealEvent: WebexHeartbeatEvent = {
              id: `HB-HEAL-${Math.floor(1000 + Math.random() * 9000)}`,
              timestamp: healTime,
              createdMs: Date.now(),
              status: 'SUCCESS',
              pingMs: 22,
              httpStatus: 200,
              endpoint: 'https://api.ciscospark.com/v1/spark/streams/reconnect',
              rttDetails: `⚡ AUTO-HEAL EXECUTED: Detected 3 consecutive high-latency trend cycles (>${latencyThreshold}ms). Webex WebSocket pipeline automatically re-established! Latency restored to 22ms.`
            };

            setTimeout(() => {
              setEvents(prevEvents => [autoHealEvent, ...prevEvents]);
            }, 300);

            if (onAddLog) {
              onAddLog(
                'warning',
                `⚡ AUTO-HEAL EXECUTED: High latency trend detected (3 consecutive cycles > ${latencyThreshold}ms). Re-established Webex WebSocket pipeline to stabilize signal!`,
                undefined,
                'WEBEX_AUTO_HEAL'
              );
            }
            return 0; // Reset counter after auto-healing
          }
          return nextCount;
        });
      } else {
        setConsecutiveHighLatencyCount(0);
      }

      if (onAddLog) {
        onAddLog(
          isDegraded ? 'warning' : 'info',
          `💓 ${pollingIntervalSec}s Auto-Heartbeat: Webex API latency ${currentPing}ms [${status}]. ID: #${newId}`,
          undefined,
          'WEBEX_AUTO_HEARTBEAT'
        );
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoHeartbeatEnabled, pollingIntervalSec, webexPingMs, latencyThreshold, onAddLog]);

  // Auto-scroll log viewport to top whenever new logs are recorded
  useEffect(() => {
    if (events.length > prevEventsCountRef.current) {
      if (logViewportRef.current) {
        logViewportRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
    prevEventsCountRef.current = events.length;
  }, [events]);

  // Sync archivedEvents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archivedEvents));
    } catch (e) {
      console.error('Failed to save archived Webex logs to local storage:', e);
    }
  }, [archivedEvents]);

  // Active or Archive view dataset
  const currentList = activeTab === 'ACTIVE' ? events : archivedEvents;

  // 24-Hour Success/Failure Rate Hourly Trend calculation
  const hourlyTrend = useMemo(() => {
    const rawTrend = Array.from({ length: 24 }, (_, i) => {
      const hourOffset = 23 - i;
      const d = new Date(Date.now() - hourOffset * 60 * 60 * 1000);
      const hourLabel = `${d.getHours().toString().padStart(2, '0')}:00`;

      // Deterministic baseline with slight realistic variation
      let rate = 100;
      let avgPing = 28 + (i % 4) * 3;
      let failureCount = 0;

      if (hourOffset === 3) {
        rate = 83; // dip during gateway surge 3 hours ago
        failureCount = 2;
        avgPing = 78;
      } else if (hourOffset === 8) {
        rate = 92;
        failureCount = 1;
        avgPing = 52;
      } else if (hourOffset === 14) {
        rate = 96;
        failureCount = 1;
        avgPing = 38;
      } else if (hourOffset === 0) {
        // Current hour incorporates current events
        const totalNow = events.length;
        const successNow = events.filter(e => e.status === 'SUCCESS').length;
        rate = totalNow > 0 ? Math.round((successNow / totalNow) * 100) : 100;
        failureCount = events.filter(e => e.status === 'FAILURE' || e.status === 'TIMEOUT').length;
        const validPings = events.filter(e => e.pingMs > 0).map(e => e.pingMs);
        if (validPings.length > 0) {
          avgPing = Math.round(validPings.reduce((a, b) => a + b, 0) / validPings.length);
        }
      } else {
        rate = Math.min(100, 96 + ((i * 5) % 5));
      }

      return {
        hourLabel,
        hourOffset,
        successRate: rate,
        avgPing,
        failureCount,
        totalChecks: 60
      };
    });

    return rawTrend.map((pt, idx) => {
      const prevAvgPing = idx > 0 ? rawTrend[idx - 1].avgPing : pt.avgPing;
      const isLatencySpike = idx > 0 && prevAvgPing > 0 && pt.avgPing > prevAvgPing * 1.20;
      const spikePercentage = prevAvgPing > 0 ? Math.round(((pt.avgPing - prevAvgPing) / prevAvgPing) * 100) : 0;

      return {
        ...pt,
        prevAvgPing,
        isLatencySpike,
        spikePercentage
      };
    });
  }, [events]);

  // 24-Hour Overall Average Ping Baseline Calculation
  const overall24hAvgPing = useMemo(() => {
    if (!hourlyTrend || hourlyTrend.length === 0) return 32;
    const sum = hourlyTrend.reduce((acc, curr) => acc + curr.avgPing, 0);
    return Math.round(sum / hourlyTrend.length);
  }, [hourlyTrend]);

  // RTT Ping Latency Distribution Histogram Calculation
  const rttHistogram = useMemo(() => {
    const bins = [
      { key: '0-30', label: '0–30 ms', title: 'Optimal', min: 0, max: 30, count: 0, color: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-500' },
      { key: '31-60', label: '31–60 ms', title: 'Normal', min: 31, max: 60, count: 0, color: '#00f2ff', border: 'border-[#00f2ff]', bg: 'bg-[#00f2ff]' },
      { key: '61-90', label: '61–90 ms', title: 'Elevated', min: 61, max: 90, count: 0, color: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-500' },
      { key: '91-120', label: '91–120 ms', title: 'High Latency', min: 91, max: 120, count: 0, color: '#f97316', border: 'border-orange-500', bg: 'bg-orange-500' },
      { key: '>120', label: '>120 ms / Timeout', title: 'Critical', min: 121, max: Infinity, count: 0, color: '#f43f5e', border: 'border-rose-500', bg: 'bg-rose-500' },
    ];

    const total = currentList.length;

    currentList.forEach(e => {
      const ping = (e.status === 'TIMEOUT' || e.pingMs === 0) ? 999 : e.pingMs;
      if (ping <= 30) bins[0].count++;
      else if (ping <= 60) bins[1].count++;
      else if (ping <= 90) bins[2].count++;
      else if (ping <= 120) bins[3].count++;
      else bins[4].count++;
    });

    const maxCount = Math.max(1, ...bins.map(b => b.count));
    const modeBin = bins.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), bins[0]);

    return {
      bins: bins.map(b => ({
        ...b,
        percentage: total > 0 ? Math.round((b.count / total) * 100) : 0,
        heightPct: Math.max(8, Math.round((b.count / maxCount) * 100))
      })),
      total,
      modeLabel: modeBin.count > 0 ? `${modeBin.label} (${modeBin.title})` : 'None'
    };
  }, [currentList]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = currentList.length;
    const successes = currentList.filter(e => e.status === 'SUCCESS').length;
    const failures = currentList.filter(e => e.status === 'FAILURE' || e.status === 'TIMEOUT').length;
    const degraded = currentList.filter(e => e.status === 'DEGRADED').length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;
    
    const validPings = currentList.filter(e => e.pingMs > 0).map(e => e.pingMs);
    const avgPing = validPings.length > 0
      ? Math.round(validPings.reduce((acc, p) => acc + p, 0) / validPings.length)
      : 0;

    return { total, successes, failures, degraded, successRate, avgPing };
  }, [currentList]);

  // Rolling 7-Day Average RTT Latency Calculation for long-term degradation tracking
  const rolling7DayStats = useMemo(() => {
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const cutoffMs = nowMs - sevenDaysMs;

    const logsWithTime = currentList.map(e => ({
      ...e,
      timeMs: e.createdMs || Date.parse(e.timestamp)
    })).filter(e => !isNaN(e.timeMs) && e.pingMs > 0);

    let windowLogs = logsWithTime.filter(e => e.timeMs >= cutoffMs);

    // Fallback if demo/archived logs are outside wall-clock last 7 days: use 7-day window relative to latest log
    if (windowLogs.length === 0 && logsWithTime.length > 0) {
      const maxTime = Math.max(...logsWithTime.map(e => e.timeMs));
      const relativeCutoff = maxTime - sevenDaysMs;
      windowLogs = logsWithTime.filter(e => e.timeMs >= relativeCutoff);
    }

    const sampleCount = windowLogs.length;
    const avgPing = sampleCount > 0
      ? Math.round(windowLogs.reduce((acc, e) => acc + e.pingMs, 0) / sampleCount)
      : stats.avgPing;

    const overallAvg = stats.avgPing;
    const isDegraded = avgPing > latencyThreshold || (overallAvg > 0 && avgPing > overallAvg * 1.15);
    const degradationPct = overallAvg > 0 ? Math.round(((avgPing - overallAvg) / overallAvg) * 100) : 0;

    return {
      sampleCount,
      avgPing,
      overallAvg,
      isDegraded,
      degradationPct
    };
  }, [currentList, stats.avgPing, latencyThreshold]);

  // Filtering and searching logic
  const filteredEvents = useMemo(() => {
    return currentList
      .filter(event => {
        // Status filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'FAILURE' && (event.status === 'FAILURE' || event.status === 'TIMEOUT')) {
            // Keep both failure and timeout in failures filter
          } else if (event.status !== statusFilter) {
            return false;
          }
        }

        // Search query filter
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          event.id.toLowerCase().includes(query) ||
          event.timestamp.toLowerCase().includes(query) ||
          event.status.toLowerCase().includes(query) ||
          event.endpoint.toLowerCase().includes(query) ||
          event.rttDetails.toLowerCase().includes(query) ||
          (event.errorMessage && event.errorMessage.toLowerCase().includes(query)) ||
          event.httpStatus.toString().includes(query) ||
          `${event.pingMs}ms`.includes(query)
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'SLOWEST') {
          return b.pingMs - a.pingMs;
        }
        if (sortOrder === 'OLDEST') {
          return a.id.localeCompare(b.id);
        }
        return b.id.localeCompare(a.id); // NEWEST
      });
  }, [currentList, searchQuery, statusFilter, sortOrder]);

  // Handle manual trigger of Cisco Webex Heartbeat Ping
  const handleTriggerPing = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      const isSuccess = Math.random() > 0.25;
      const isSlow = isSuccess && Math.random() > 0.7;
      
      const newStatus: 'SUCCESS' | 'FAILURE' | 'DEGRADED' | 'TIMEOUT' = !isSuccess
        ? (Math.random() > 0.5 ? 'FAILURE' : 'TIMEOUT')
        : (isSlow ? 'DEGRADED' : 'SUCCESS');

      const newPing = newStatus === 'TIMEOUT' ? 1000 : newStatus === 'FAILURE' ? 0 : isSlow ? Math.floor(Math.random() * 60) + 85 : Math.floor(Math.random() * 20) + 20;
      const newHttpStatus = newStatus === 'SUCCESS' || newStatus === 'DEGRADED' ? 200 : newStatus === 'TIMEOUT' ? 408 : 503;
      const newId = `HB-${Math.floor(9802 + Math.random() * 500)}`;

      const newEvent: WebexHeartbeatEvent = {
        id: newId,
        timestamp: new Date().toLocaleTimeString(),
        createdMs: Date.now(),
        status: newStatus,
        pingMs: newPing,
        httpStatus: newHttpStatus,
        endpoint: 'https://api.ciscospark.com/v1/ping',
        rttDetails: newStatus === 'SUCCESS'
          ? `Manual ping test passed. RTT: ${newPing}ms.`
          : newStatus === 'DEGRADED'
          ? `Manual ping test succeeded with elevated latency (${newPing}ms).`
          : newStatus === 'TIMEOUT'
          ? 'Manual ping test timed out after 1000ms limit.'
          : 'Manual ping test failed: HTTP 503 Gateway Service Unavailable.',
        errorMessage: newStatus === 'FAILURE' ? '503 Gateway Error: Service overloaded' : newStatus === 'TIMEOUT' ? '408 Request Timeout' : undefined
      };

      setEvents(prev => [newEvent, ...prev]);

      if (onAddLog) {
        onAddLog(
          newStatus === 'SUCCESS' ? 'info' : 'warning',
          `📡 CISCO WEBEX HEARTBEAT PING [${newStatus}]: RTT ${newPing}ms (HTTP ${newHttpStatus}). Event #${newId}`,
          undefined,
          'WEBEX_PING_TEST'
        );
      }
    }, 800);
  };

  // Auto-Archive logs older than specified days to secondary local storage
  const handleAutoArchiveOldLogs = (days: number = cleanupDaysThreshold) => {
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const toArchive: WebexHeartbeatEvent[] = [];
    const toKeep: WebexHeartbeatEvent[] = [];

    events.forEach(e => {
      const itemMs = e.createdMs || Date.parse(e.timestamp);
      if (!isNaN(itemMs) && itemMs < cutoffMs) {
        toArchive.push(e);
      } else {
        toKeep.push(e);
      }
    });

    if (toArchive.length > 0) {
      setEvents(toKeep);
      const updatedArchived = [...toArchive, ...archivedEvents];
      setArchivedEvents(updatedArchived);
      try {
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updatedArchived));
      } catch (e) {
        console.error(e);
      }

      const notice = `📦 Auto-archived ${toArchive.length} log ${toArchive.length === 1 ? 'entry' : 'entries'} older than ${days} days into secondary local storage Archive.`;
      setCleanupNotice(notice);
      setTimeout(() => setCleanupNotice(null), 6000);

      if (onAddLog) {
        onAddLog(
          'info',
          `📦 WEBEX LOG AUTO-ARCHIVE: Moved ${toArchive.length} entries older than ${days} days to secondary local storage.`,
          undefined,
          'WEBEX_LOG_AUTO_ARCHIVE_200'
        );
      }
    } else {
      setCleanupNotice(`No active log entries older than ${days} days found to archive.`);
      setTimeout(() => setCleanupNotice(null), 5000);
    }
  };

  // Restore entry from Archive to Active Ledger
  const handleRestoreArchivedLog = (id: string) => {
    const target = archivedEvents.find(e => e.id === id);
    if (!target) return;
    setArchivedEvents(prev => prev.filter(e => e.id !== id));
    setEvents(prev => [target, ...prev]);
    setCleanupNotice(`Restored #${target.id} from Archive to Active Log stream.`);
    setTimeout(() => setCleanupNotice(null), 4000);
  };

  // Restore ALL archived logs
  const handleRestoreAllArchivedLogs = () => {
    if (archivedEvents.length === 0) return;
    const count = archivedEvents.length;
    setEvents(prev => [...archivedEvents, ...prev]);
    setArchivedEvents([]);
    setCleanupNotice(`Restored all ${count} archived log entries to Active Log stream.`);
    setTimeout(() => setCleanupNotice(null), 5000);
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webex_connectivity_log_${activeTab.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open CSV Export Options & Preview Modal
  const handleExportCSV = () => {
    setIsExportCsvModalOpen(true);
  };

  // Perform actual CSV File Download with filtered options and timeframe
  const handlePerformExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Status', 'Ping_RTT_ms', 'HTTP_Code', 'Endpoint', 'Details', 'Error', 'Storage_Type'];
    const rows = csvFilteredEvents.map(e => [
      e.id,
      `"${e.timestamp}"`,
      e.status,
      e.pingMs,
      e.httpStatus,
      `"${e.endpoint}"`,
      `"${e.rttDetails.replace(/"/g, '""')}"`,
      `"${(e.errorMessage || '').replace(/"/g, '""')}"`,
      `"${activeTab}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webex_connectivity_audit_log_${csvLogTypeFilter.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setCleanupNotice(`Exported ${csvFilteredEvents.length} filtered log ${csvFilteredEvents.length === 1 ? 'entry' : 'entries'} to CSV audit file.`);
    setTimeout(() => setCleanupNotice(null), 4000);

    if (onAddLog) {
      onAddLog(
        'info',
        `📄 EXPORT WEBEX CSV AUDIT: Exported ${csvFilteredEvents.length} logs (Filter: ${csvLogTypeFilter}, Timeframe: ${csvStartDate || 'Start'} to ${csvEndDate || 'Now'}).`,
        undefined,
        'EXPORT_WEBEX_CSV_AUDIT'
      );
    }

    setIsExportCsvModalOpen(false);
  };

  const handleCopyEventDiagnostics = (event: WebexHeartbeatEvent) => {
    const diagnosticPayload = [
      `=== Cisco Webex Heartbeat Diagnostic Record ===`,
      `Log ID: #${event.id}`,
      `Timestamp: ${event.timestamp}`,
      `Status: ${event.status} (HTTP ${event.httpStatus})`,
      `RTT Latency: ${event.pingMs === 0 ? 'FAIL' : `${event.pingMs} ms`}`,
      `Endpoint: ${event.endpoint}`,
      `RTT Details: ${event.rttDetails}`,
      ...(event.errorMessage ? [`Error Message: ${event.errorMessage}`] : []),
      `7d Rolling RTT Avg: ${rolling7DayStats.avgPing} ms`,
      `Storage Pool: ${activeTab === 'ACTIVE' ? 'Active Stream' : 'Archive Store'}`,
      `Generated: ${new Date().toISOString()}`
    ].join('\n');

    navigator.clipboard.writeText(diagnosticPayload);
    setCopiedId(event.id);
    setCleanupNotice(`Copied diagnostic record #${event.id} to clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
    setTimeout(() => setCleanupNotice(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="webex-connectivity-log-modal"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md font-mono"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-neutral-950 border border-[#00f2ff]/30 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.15)] flex flex-col overflow-hidden relative"
        >
          {/* Cyber Scanning Top Bar */}
          <div className="h-1 bg-gradient-to-r from-[#00f2ff] via-indigo-500 to-emerald-400 w-full" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00f2ff]/10 border border-[#00f2ff]/30 rounded-xl text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)] shrink-0">
                <Radio className="w-5 h-5 animate-pulse text-[#00f2ff]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-wider block">
                    CISCO WEBEX API HEARTBEAT AUDIT
                  </span>
                  <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                    webexStatus === 'Connected'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  }`}>
                    {webexStatus === 'Connected' ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-rose-400" />}
                    {webexStatus.toUpperCase()} ({webexPingMs}ms RTT)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-sans font-extrabold text-white tracking-wide mt-0.5">
                  Webex Connectivity Log
                </h2>
              </div>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Webex Latency Threshold Control Capsule (30ms - 100ms) */}
              <div className="flex items-center gap-2 bg-neutral-950 border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-inner">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px]">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="whitespace-nowrap hidden sm:inline">LATENCY LIMIT:</span>
                  <span className="whitespace-nowrap sm:hidden">LIMIT:</span>
                  <span className="font-mono text-amber-300 font-black">{latencyThreshold}ms</span>
                </div>
                <input
                  id="input-webex-latency-threshold-slider-header"
                  type="range"
                  min={30}
                  max={100}
                  step={1}
                  value={Math.min(100, Math.max(30, latencyThreshold))}
                  onChange={(e) => setLatencyThreshold(Number(e.target.value))}
                  className="w-20 sm:w-28 accent-amber-400 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
                  title={`Adjust Webex Latency Threshold (${latencyThreshold}ms: 30ms - 100ms)`}
                />
              </div>

              {/* Background Polling Control Capsule */}
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-xl shadow-inner">
                <button
                  id="btn-toggle-auto-heartbeat"
                  type="button"
                  onClick={() => {
                    const nextState = !autoHeartbeatEnabled;
                    setAutoHeartbeatEnabled(nextState);
                    if (onAddLog) {
                      onAddLog(
                        'info',
                        nextState
                          ? `🔄 Background Auto-Polling Active (Frequency: ${pollingIntervalSec}s)`
                          : '⏸️ Background Auto-Polling Suspended',
                        undefined,
                        'POLL_TOGGLE'
                      );
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] transition-all flex items-center gap-1.5 cursor-pointer border ${
                    autoHeartbeatEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle automated background polling for new log entries"
                >
                  <Clock className={`w-3.5 h-3.5 ${autoHeartbeatEnabled ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
                  <span>POLLING: {autoHeartbeatEnabled ? 'ACTIVE' : 'OFF'}</span>
                </button>

                {autoHeartbeatEnabled && (
                  <div className="flex items-center gap-2 border-l border-neutral-800 pl-2">
                    <div className="flex flex-col text-left">
                      <span className="text-[7.5px] text-neutral-500 font-bold uppercase tracking-wider">Frequency</span>
                      <span className="text-[10px] font-mono font-black text-[#00f2ff]">{pollingIntervalSec}s</span>
                    </div>
                    <input
                      id="input-polling-frequency-slider"
                      type="range"
                      min={2}
                      max={60}
                      step={1}
                      value={pollingIntervalSec}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPollingIntervalSec(val);
                      }}
                      className="w-16 sm:w-24 accent-[#00f2ff] bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
                      title={`Configure background polling frequency (${pollingIntervalSec}s)`}
                    />
                  </div>
                )}
              </div>

              <button
                id="btn-simulate-heartbeat-ping"
                type="button"
                onClick={handleTriggerPing}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-[#00f2ff] hover:bg-[#00d8e6] text-neutral-950 font-black text-[10px] rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,255,0.3)] cursor-pointer disabled:opacity-50"
                title="Execute immediate manual Cisco Webex API heartbeat check"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-neutral-950 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'PINGING...' : 'PING HEARTBEAT'}</span>
              </button>

              <button
                id="btn-copy-support-email-summary"
                type="button"
                onClick={handleGenerateSupportTicketEmail}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-black text-[10px] rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer"
                title="Bundle last 50 Webex connectivity log entries into a summary email body for support tickets (copied to clipboard)"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="whitespace-nowrap">{copiedSupportEmail ? 'COPIED TO CLIPBOARD!' : 'COPY SUPPORT EMAIL'}</span>
              </button>

              <button
                id="btn-export-webex-csv-header"
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-black text-[10px] rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer"
                title="Download Webex connectivity history log as CSV file for external audit"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="whitespace-nowrap">EXPORT CSV</span>
              </button>

              {onOpenHandshakeModal && (
                <button
                  id="btn-open-handshake-events-from-log"
                  type="button"
                  onClick={onOpenHandshakeModal}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 font-black text-[10px] rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.2)] cursor-pointer"
                  title="Open detailed connection handshake events & timestamped error codes"
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span className="whitespace-nowrap">HANDSHAKE EVENTS</span>
                </button>
              )}

              {onClose && (
                <button
                  id="btn-close-webex-connectivity-log"
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
                  title="Close Webex Connectivity Log Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 sm:p-4 bg-neutral-950 border-b border-neutral-850 text-left">
            <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[8px] text-neutral-400 uppercase font-bold block flex items-center gap-1">
                <Server className="w-3 h-3 text-cyan-400" /> Total Heartbeats
              </span>
              <span className="text-base font-extrabold text-white block">{stats.total}</span>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[8px] text-neutral-400 uppercase font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Success Rate
              </span>
              <span className={`text-base font-extrabold block ${stats.successRate >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stats.successRate}%
              </span>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[8px] text-neutral-400 uppercase font-bold block flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Avg RTT Ping
              </span>
              <span className="text-base font-extrabold text-amber-400 block">{stats.avgPing} ms</span>
            </div>

            {/* 7-Day Rolling RTT Average Metric Card */}
            <div className={`p-2.5 rounded-lg space-y-0.5 border transition-all ${
              rolling7DayStats.isDegraded
                ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                : 'bg-neutral-900/80 border-neutral-800'
            }`}>
              <span className="text-[8px] text-neutral-400 uppercase font-bold block flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <TrendingUp className={`w-3 h-3 ${rolling7DayStats.isDegraded ? 'text-rose-400' : 'text-[#00f2ff]'}`} /> 7d Rolling RTT
                </span>
                {rolling7DayStats.isDegraded ? (
                  <span className="bg-rose-500 text-white text-[6.5px] px-1 py-0.2 rounded font-black uppercase tracking-wider animate-pulse">
                    Degraded
                  </span>
                ) : (
                  <span className="text-[7px] text-emerald-400 font-extrabold uppercase">Nominal</span>
                )}
              </span>
              <div className="flex items-baseline justify-between gap-1">
                <span className={`text-base font-extrabold block ${rolling7DayStats.isDegraded ? 'text-rose-300' : 'text-[#00f2ff]'}`}>
                  {rolling7DayStats.avgPing} ms
                </span>
                <span className={`text-[8.5px] font-mono font-bold ${rolling7DayStats.degradationPct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {rolling7DayStats.degradationPct > 0 ? `+${rolling7DayStats.degradationPct}%` : `${rolling7DayStats.degradationPct}%`}
                </span>
              </div>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-lg space-y-0.5">
              <span className="text-[8px] text-neutral-400 uppercase font-bold block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" /> Failures & Timeouts
              </span>
              <span className={`text-base font-extrabold block ${stats.failures > 0 ? 'text-rose-400' : 'text-neutral-400'}`}>
                {stats.failures}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg space-y-1">
              <span className="text-[8px] text-amber-400 uppercase font-bold block flex items-center justify-between">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Limit Threshold</span>
                <span className="font-mono text-[10px] font-black text-amber-300">{latencyThreshold}ms</span>
              </span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <input
                  id="input-webex-latency-threshold-slider-card"
                  type="range"
                  min={30}
                  max={100}
                  step={1}
                  value={Math.min(100, Math.max(30, latencyThreshold))}
                  onChange={(e) => setLatencyThreshold(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                  title={`Adjust Webex Latency Threshold (30ms - 100ms)`}
                />
                <input
                  id="input-log-latency-threshold"
                  type="number"
                  min="30"
                  max="100"
                  value={latencyThreshold}
                  onChange={(e) => setLatencyThreshold(Math.max(30, Math.min(100, Number(e.target.value) || 30)))}
                  className="w-11 bg-neutral-950 border border-amber-500/50 text-amber-300 font-extrabold text-[10px] px-1 py-0.5 rounded outline-none text-center shrink-0"
                />
              </div>
            </div>
          </div>

          {/* Telemetry & Storage Switcher Bar */}
          <div className="px-3 sm:px-4 py-2 bg-neutral-900 border-b border-neutral-850 flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono">
            {/* Active Stream vs Archive Store Tabs */}
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                id="tab-active-logs"
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1 rounded-md font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ACTIVE'
                    ? 'bg-[#00f2ff] text-neutral-950 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>ACTIVE STREAM ({events.length})</span>
              </button>

              <button
                id="tab-archive-logs"
                type="button"
                onClick={() => setActiveTab('ARCHIVE')}
                className={`px-3 py-1 rounded-md font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ARCHIVE'
                    ? 'bg-amber-400 text-neutral-950 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Archive className="w-3 h-3" />
                <span>ARCHIVE STORE ({archivedEvents.length})</span>
              </button>
            </div>

            {/* Sparkline Trend vs RTT Latency Histogram Mode Toggle */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 text-[8px] uppercase font-bold px-1 hidden sm:inline">Telemetry:</span>
              <button
                id="toggle-telemetry-sparkline"
                type="button"
                onClick={() => setTelemetryMode('SPARKLINE')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  telemetryMode === 'SPARKLINE'
                    ? 'bg-neutral-800 text-[#00f2ff] border border-[#00f2ff]/40'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3 h-3 text-[#00f2ff]" />
                <span>24H TREND</span>
              </button>

              <button
                id="toggle-telemetry-histogram"
                type="button"
                onClick={() => setTelemetryMode('HISTOGRAM')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  telemetryMode === 'HISTOGRAM'
                    ? 'bg-neutral-800 text-amber-400 border border-amber-400/40'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3 h-3 text-amber-400" />
                <span>RTT HISTOGRAM</span>
              </button>

              <button
                id="toggle-compare-latency"
                type="button"
                onClick={() => setShowCompareLatency(prev => !prev)}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                  showCompareLatency
                    ? 'bg-purple-950/80 text-purple-300 border-purple-400/80 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
                }`}
                title="Toggle Average Ping vs Current Ping comparison overlay on Sparkline"
              >
                <GitCompare className={`w-3 h-3 ${showCompareLatency ? 'text-purple-300 animate-pulse' : 'text-purple-400'}`} />
                <span>COMPARE LATENCY: {showCompareLatency ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Telemetry Visualizer Body */}
          {telemetryMode === 'SPARKLINE' ? (
            /* 24-Hour Heartbeat Success/Failure Rate Sparkline Graph */
            <div className="p-3 sm:px-4 sm:py-3 bg-neutral-900/80 border-b border-neutral-850 space-y-2 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[9px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-[#00f2ff] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00f2ff]" /> 24-Hour Heartbeat Success Rate Trend
                  </span>
                  <span className="text-neutral-500 font-normal hidden sm:inline font-sans">• Hourly API Health</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-[8.5px] font-mono flex-wrap">
                  {showCompareLatency && (
                    <span className="bg-purple-950/70 border border-purple-500/50 px-2 py-0.5 rounded text-purple-300 font-extrabold flex items-center gap-1.5 shadow-[0_0_8px_rgba(168,85,247,0.25)]">
                      <GitCompare className="w-3 h-3 text-purple-400" />
                      <span>
                        24h Avg: <strong className="text-purple-200">{overall24hAvgPing}ms</strong> vs Current: <strong className="text-cyan-300">{webexPingMs > 0 ? webexPingMs : (events[0]?.pingMs || 32)}ms</strong>
                      </span>
                      {(() => {
                        const curPing = webexPingMs > 0 ? webexPingMs : (events[0]?.pingMs || 32);
                        const dev = curPing - overall24hAvgPing;
                        const devPct = overall24hAvgPing > 0 ? Math.round((dev / overall24hAvgPing) * 100) : 0;
                        return (
                          <span className={`px-1 rounded text-[7px] font-black ${
                            dev > 5
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-400/60'
                              : dev < -2
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/60'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}>
                            Δ {dev > 0 ? `+${dev}` : dev}ms ({devPct > 0 ? `+${devPct}` : devPct}%)
                          </span>
                        );
                      })()}
                    </span>
                  )}
                  <span className="text-neutral-400">
                    24h Health: <strong className="text-emerald-400">97.8%</strong>
                  </span>
                  <span className="text-neutral-600 hidden sm:inline">•</span>
                  <span className="text-neutral-400">
                    7d Rolling RTT: <strong className={rolling7DayStats.isDegraded ? 'text-rose-400 font-extrabold' : 'text-[#00f2ff] font-extrabold'}>{rolling7DayStats.avgPing} ms</strong>
                  </span>
                  {hoveredTrendIndex !== null ? (
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-1.5 ${
                      hourlyTrend[hoveredTrendIndex].isLatencySpike
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                        : showCompareLatency
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                        : 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40'
                    }`}>
                      <span>
                        {hourlyTrend[hoveredTrendIndex].hourLabel}: {hourlyTrend[hoveredTrendIndex].successRate}% Success ({hourlyTrend[hoveredTrendIndex].failureCount} Failures, Ping {hourlyTrend[hoveredTrendIndex].avgPing}ms
                        {showCompareLatency && (
                          <strong className="text-purple-300 ml-1">
                            [vs Avg {overall24hAvgPing}ms: {hourlyTrend[hoveredTrendIndex].avgPing - overall24hAvgPing > 0 ? '+' : ''}{hourlyTrend[hoveredTrendIndex].avgPing - overall24hAvgPing}ms]
                          </strong>
                        )})
                      </span>
                      {hourlyTrend[hoveredTrendIndex].isLatencySpike && (
                        <span className="bg-rose-600 text-white text-[7px] px-1 py-0.2 rounded uppercase font-black tracking-wider">
                          ⚡ Spike (+{hourlyTrend[hoveredTrendIndex].spikePercentage}%)
                        </span>
                      )}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 text-neutral-400 text-[8px]">
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 border border-white inline-block shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                        Red Dot: Latency Spike (&gt;120% vs prev RTT)
                      </span>
                      <span className="text-neutral-500 font-normal hidden sm:inline">• Hover nodes for telemetry</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sparkline Canvas / Interactive SVG */}
              <div className="relative w-full h-16 bg-neutral-950/90 border border-neutral-800 rounded-lg p-1.5 flex flex-col justify-between overflow-hidden group">
                <div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-emerald-400/50 w-full" />
                  <div className="border-b border-dashed border-amber-400/50 w-full" />
                  <div className="border-b border-dashed border-neutral-700 w-full" />
                </div>

                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 50" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="webexSparklineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00f2ff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Compare Latency Baseline Overlay */}
                  {showCompareLatency && (() => {
                    const avgY = Math.max(4, Math.min(46, 46 - (overall24hAvgPing / 120) * 42));
                    const pingPoints = hourlyTrend.map((pt, idx) => {
                      const x = (idx / 23) * 600;
                      const y = Math.max(4, Math.min(46, 46 - (pt.avgPing / 120) * 42));
                      return `${x},${y}`;
                    });
                    return (
                      <g>
                        {/* 24-Hour Average Ping Baseline Reference Line */}
                        <line x1="0" y1={avgY} x2="600" y2={avgY} stroke="#c084fc" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.9" />
                        <text x="6" y={Math.max(10, avgY - 3)} fill="#c084fc" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                          24H AVG BASELINE ({overall24hAvgPing}ms)
                        </text>
                        {/* Hourly Ping Latency Curve Overlay */}
                        <path d={`M ${pingPoints.join(' L ')}`} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="2 2" opacity="0.95" />
                      </g>
                    );
                  })()}

                  {(() => {
                    const points = hourlyTrend.map((pt, idx) => {
                      const x = (idx / 23) * 600;
                      const y = 45 - ((pt.successRate - 50) / 50) * 40;
                      return `${x},${Math.max(4, Math.min(46, y))}`;
                    });
                    const pathLine = `M ${points.join(' L ')}`;
                    const pathArea = `M 0,50 L ${points.join(' L ')} L 600,50 Z`;

                    return (
                      <>
                        <path d={pathArea} fill="url(#webexSparklineGradient)" />
                        <path d={pathLine} fill="none" stroke="#00f2ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    );
                  })()}

                  {hourlyTrend.map((pt, idx) => {
                    const x = (idx / 23) * 600;
                    const y = Math.max(4, Math.min(46, 45 - ((pt.successRate - 50) / 50) * 40));
                    const isHovered = hoveredTrendIndex === idx;
                    const hasFailure = pt.failureCount > 0;
                    const isSpike = pt.isLatencySpike;

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredTrendIndex(idx)}
                        onMouseLeave={() => setHoveredTrendIndex(null)}
                        className="cursor-pointer"
                      >
                        {isHovered && (
                          <line x1={x} y1="0" x2={x} y2="50" stroke="#00f2ff" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
                        )}

                        {isSpike && (
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 9 : 6.5}
                            fill="rgba(244, 63, 94, 0.3)"
                            stroke="#f43f5e"
                            strokeWidth="1"
                            className="animate-pulse"
                          />
                        )}

                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 5.5 : isSpike ? 4.5 : hasFailure ? 3.5 : 2}
                          fill={isSpike ? '#f43f5e' : hasFailure ? '#f43f5e' : isHovered ? '#00f2ff' : '#10b981'}
                          stroke={isHovered ? '#ffffff' : isSpike ? '#ffffff' : hasFailure ? '#fb7185' : '#34d399'}
                          strokeWidth={isHovered || isSpike ? 2 : 1}
                          className="transition-all duration-150"
                        />

                        {isSpike && (
                          <g>
                            <circle
                              cx={x}
                              cy={Math.max(2, y - 8)}
                              r="3"
                              fill="#ef4444"
                              stroke="#ffffff"
                              strokeWidth="1"
                            />
                            <line
                              x1={x}
                              y1={Math.max(2, y - 8) + 3}
                              x2={x}
                              y2={y - 4.5}
                              stroke="#ef4444"
                              strokeWidth="1"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                <div className="flex justify-between items-center text-[7.5px] text-neutral-500 font-mono pt-0.5 px-1 border-t border-neutral-900 select-none">
                  <span>24h ago ({hourlyTrend[0]?.hourLabel})</span>
                  <span className="hidden sm:inline">18h ago</span>
                  <span>12h ago</span>
                  <span className="hidden sm:inline">6h ago</span>
                  <span className="text-[#00f2ff] font-bold">Now ({hourlyTrend[23]?.hourLabel})</span>
                </div>
              </div>
            </div>
          ) : (
            /* RTT Ping Range Frequency Distribution Histogram */
            <div className="p-3 sm:px-4 sm:py-3 bg-neutral-900/80 border-b border-neutral-850 space-y-2 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[9px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <BarChart2 className="w-3.5 h-3.5 text-amber-400" /> RTT Latency Range Distribution Histogram
                  </span>
                  <span className="text-neutral-500 font-normal hidden sm:inline font-sans">• {activeTab} Dataset ({rttHistogram.total} samples)</span>
                </div>
                <div className="text-[8.5px] font-mono text-neutral-400">
                  Dominant Bin Mode: <strong className="text-amber-300">{rttHistogram.modeLabel}</strong>
                </div>
              </div>

              {/* Histogram Bar Charts Grid */}
              <div className="bg-neutral-950/90 border border-neutral-800 rounded-lg p-2.5 space-y-2">
                <div className="grid grid-cols-5 gap-2 items-end h-20 pt-2 border-b border-neutral-800/80 pb-1">
                  {rttHistogram.bins.map((bin) => {
                    const isHovered = hoveredHistogramBin === bin.key;
                    return (
                      <div
                        key={bin.key}
                        onMouseEnter={() => setHoveredHistogramBin(bin.key)}
                        onMouseLeave={() => setHoveredHistogramBin(null)}
                        className="flex flex-col items-center justify-end h-full gap-1 group cursor-pointer"
                      >
                        <div className="text-[8px] font-extrabold text-neutral-400 group-hover:text-white transition-colors">
                          {bin.count} <span className="text-neutral-500 text-[7px]">({bin.percentage}%)</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-t overflow-hidden flex items-end h-full p-0.5">
                          <div
                            style={{ height: `${bin.heightPct}%`, backgroundColor: bin.color }}
                            className={`w-full rounded-t transition-all duration-300 relative ${
                              isHovered ? 'brightness-125 shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'opacity-85 hover:opacity-100'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Range Labels */}
                <div className="grid grid-cols-5 gap-2 text-center text-[8px] font-extrabold font-mono text-neutral-400">
                  {rttHistogram.bins.map((bin) => (
                    <div key={bin.key} className="truncate">
                      <span className="block text-white font-bold">{bin.label}</span>
                      <span className="text-[7px] text-neutral-500 uppercase">{bin.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search, Filter & Sort Controls */}
          <div className="p-3 sm:p-4 bg-neutral-900/40 border-b border-neutral-850 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="search-webex-connectivity-logs"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Event ID, status code, endpoint, or error message..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-8 py-1.5 text-[9.5px] text-white placeholder-neutral-500 outline-none focus:border-[#00f2ff] font-mono transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Export, Cleanup/Archive, Restore and Clear Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                <button
                  id="export-webex-csv-btn"
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 rounded-lg text-[8.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Export filtered logs as downloadable CSV file for external audit"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>EXPORT CSV</span>
                </button>

                <button
                  id="export-webex-json-btn"
                  type="button"
                  onClick={handleExportJSON}
                  className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[#00f2ff] hover:border-[#00f2ff]/40 rounded-lg text-[8.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Export filtered logs as JSON file"
                >
                  <FileText className="w-3 h-3 text-[#00f2ff]" />
                  <span>JSON</span>
                </button>

                {activeTab === 'ACTIVE' ? (
                  /* Auto-Archive Old Logs Control (>14 days to Archive) */
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 shadow-inner">
                    <button
                      id="btn-auto-archive-old-webex-logs"
                      type="button"
                      onClick={() => handleAutoArchiveOldLogs(cleanupDaysThreshold)}
                      disabled={events.length === 0}
                      className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded text-[8.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                      title={`Auto-archive logs older than ${cleanupDaysThreshold} days to secondary local storage`}
                    >
                      <Archive className="w-3 h-3 text-amber-400" />
                      <span>AUTO-ARCHIVE (&gt;{cleanupDaysThreshold}d)</span>
                    </button>
                    <select
                      id="select-cleanup-days-threshold"
                      value={cleanupDaysThreshold}
                      onChange={(e) => setCleanupDaysThreshold(Number(e.target.value))}
                      className="bg-neutral-950 text-amber-300 text-[8px] font-extrabold outline-none px-1 py-0.5 rounded cursor-pointer border-l border-neutral-800 hover:border-amber-500/50 transition-colors ml-0.5"
                      title="Select auto-archival threshold in days"
                    >
                      <option value={14}>14d</option>
                      <option value={30}>30d</option>
                      <option value={7}>7d</option>
                      <option value={1}>1d</option>
                    </select>
                  </div>
                ) : (
                  /* Restore All Archived Logs Button */
                  <button
                    id="btn-restore-all-archived-logs"
                    type="button"
                    onClick={handleRestoreAllArchivedLogs}
                    disabled={archivedEvents.length === 0}
                    className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                    title="Restore all archived logs back to Active Stream"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-400" />
                    <span>RESTORE ALL</span>
                  </button>
                )}

                <button
                  id="clear-webex-logs-btn"
                  type="button"
                  onClick={() => (activeTab === 'ACTIVE' ? setEvents([]) : setArchivedEvents([]))}
                  disabled={currentList.length === 0}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-[8.5px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                  title={`Clear all ${activeTab.toLowerCase()} log records`}
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-neutral-850/80 pt-2.5">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[8px] text-neutral-500 uppercase font-bold mr-1 flex items-center gap-1">
                  <Filter className="w-2.5 h-2.5" /> Filter:
                </span>
                
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-[#00f2ff] text-neutral-950'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  All ({currentList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('SUCCESS')}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                    statusFilter === 'SUCCESS'
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-900 text-emerald-400/80 hover:text-emerald-400 border border-neutral-800'
                  }`}
                >
                  Successes ({stats.successes})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('FAILURE')}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                    statusFilter === 'FAILURE'
                      ? 'bg-rose-500 text-white'
                      : 'bg-neutral-900 text-rose-400/80 hover:text-rose-400 border border-neutral-800'
                  }`}
                >
                  Failures ({stats.failures})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('DEGRADED')}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                    statusFilter === 'DEGRADED'
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-900 text-amber-400/80 hover:text-amber-400 border border-neutral-800'
                  }`}
                >
                  High Latency ({stats.degraded})
                </button>
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[8px] text-neutral-500 uppercase font-bold flex items-center gap-1">
                  <ArrowDownUp className="w-2.5 h-2.5" /> Sort:
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-[8px] font-bold rounded px-2 py-0.5 outline-none focus:border-[#00f2ff]"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                  <option value="SLOWEST">Slowest RTT First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Storage Cleanup / Archival Banner Notification */}
          <AnimatePresence>
            {cleanupNotice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/40 text-emerald-300 text-[9px] font-bold flex items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{cleanupNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCleanupNotice(null)}
                  className="text-emerald-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Event Log List Container */}
          <div
            ref={logViewportRef}
            id="webex-logs-list-viewport"
            className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-2 max-h-[420px] scrollbar-thin"
          >
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 space-y-2">
                <ShieldAlert className="w-8 h-8 text-neutral-700 mx-auto" />
                <p className="text-xs font-sans">
                  No Cisco Webex API heartbeat logs matched your criteria in the {activeTab.toLowerCase()} storage.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                  className="text-[9px] text-[#00f2ff] hover:underline font-bold uppercase cursor-pointer"
                >
                  Reset Filters & Search
                </button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredEvents.map((event) => {
                  const isSuccess = event.status === 'SUCCESS';
                  const isDegraded = event.status === 'DEGRADED';
                  const isFailure = event.status === 'FAILURE' || event.status === 'TIMEOUT';
                  const isAboveThreshold = event.pingMs > latencyThreshold && event.pingMs > 0;

                  return (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -10 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className={`p-3 rounded-xl border transition-all text-left space-y-1.5 ${
                        isAboveThreshold
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:border-amber-400'
                          : isSuccess
                          ? 'bg-neutral-900/60 border-neutral-850 hover:border-emerald-500/40'
                          : isDegraded
                          ? 'bg-amber-500/5 border-amber-500/25 hover:border-amber-500/50'
                          : 'bg-rose-500/5 border-rose-500/25 hover:border-rose-500/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-neutral-850/60 pb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Event ID with Text Highlighting */}
                          <span className="font-extrabold text-white text-[9.5px] bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                            #<HighlightedText text={event.id} query={searchQuery} />
                          </span>

                          {/* Status Badge with Text Highlighting */}
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                            isAboveThreshold
                              ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 font-extrabold'
                              : isSuccess
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : isDegraded
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}>
                            {isSuccess && !isAboveThreshold && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                            {(isDegraded || isAboveThreshold) && <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
                            {isFailure && <XCircle className="w-2.5 h-2.5 text-rose-400" />}
                            <HighlightedText text={event.status} query={searchQuery} /> (HTTP <HighlightedText text={String(event.httpStatus)} query={searchQuery} />)
                          </span>

                          {/* Ping RTT Duration Pill */}
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            event.pingMs === 0 || event.status === 'TIMEOUT'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : isAboveThreshold
                              ? 'bg-amber-500 text-neutral-950 font-black border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}>
                            ⚡ RTT: {event.pingMs === 0 ? 'FAIL' : event.status === 'TIMEOUT' ? 'TIMEOUT (1000ms)' : <><HighlightedText text={`${event.pingMs}ms`} query={searchQuery} /></>}
                          </span>

                          {/* High Latency Threshold Exceeded Amber Tag */}
                          {isAboveThreshold && (
                            <span className="text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400 text-amber-300 flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                              ABOVE THRESHOLD (&gt;{latencyThreshold}ms)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[8px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <HighlightedText text={event.timestamp} query={searchQuery} />
                          </span>

                          {activeTab === 'ARCHIVE' && (
                            <button
                              type="button"
                              onClick={() => handleRestoreArchivedLog(event.id)}
                              className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded font-bold text-[7.5px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Restore this log entry to Active Stream"
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Restore
                            </button>
                          )}

                          <button
                            id={`btn-copy-log-${event.id}`}
                            type="button"
                            onClick={() => handleCopyEventDiagnostics(event)}
                            className={`px-2 py-1 rounded text-[8px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                              copiedId === event.id
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 hover:border-[#00f2ff]/40'
                            }`}
                            title="Copy diagnostic details to clipboard to share with support or technical teams"
                          >
                            {copiedId === event.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">COPIED!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#00f2ff]" />
                                <span>COPY DIAGNOSTICS</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Endpoint & RTT Details with Keyword Highlighting */}
                      <div className="space-y-1 text-[8.5px]">
                        <div className="flex items-center justify-between text-neutral-400">
                          <span className="truncate text-neutral-300 font-semibold">
                            <HighlightedText text={event.endpoint} query={searchQuery} />
                          </span>
                        </div>
                        <p className="text-neutral-300 font-sans text-[9px] leading-relaxed">
                          <HighlightedText text={event.rttDetails} query={searchQuery} />
                        </p>
                        {event.errorMessage && (
                          <div className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded text-[8px] text-rose-300 flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                            <span><strong>API ERROR:</strong> <HighlightedText text={event.errorMessage} query={searchQuery} /></span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Modal Footer with Active vs Archive storage stats */}
          <div className="p-3 border-t border-neutral-850 bg-neutral-900/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[8.5px] text-neutral-400 font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[#00f2ff]">
                <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
                <span>WebSocket Stream Active</span>
              </span>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <span className="text-neutral-400">
                Active Memory: <strong className="text-emerald-400">~{(JSON.stringify(events).length / 1024).toFixed(1)} KB</strong> ({events.length} logs)
              </span>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <span className="text-neutral-400">
                Archive Store: <strong className="text-amber-400">~{(JSON.stringify(archivedEvents).length / 1024).toFixed(1)} KB</strong> ({archivedEvents.length} logs)
              </span>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <span className="text-neutral-400">
                7d Rolling RTT Avg: <strong className={rolling7DayStats.isDegraded ? 'text-rose-400 font-extrabold' : 'text-[#00f2ff] font-extrabold'}>{rolling7DayStats.avgPing} ms</strong> ({rolling7DayStats.sampleCount} samples)
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded text-[9px] cursor-pointer transition-colors shrink-0"
            >
              Close Ledger
            </button>
          </div>
        </motion.div>

        {/* CSV Export Options, Date Range Filters & Column Preview Modal */}
        {isExportCsvModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-neutral-950 border border-emerald-500/40 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col max-h-[92vh] font-mono text-left"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/40">
                    <Download className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      Export CSV Audit Logs
                    </h3>
                    <p className="text-[9.5px] text-neutral-400 font-sans">
                      Filter records by timeframe and log type, then review column schema before downloading
                    </p>
                  </div>
                </div>
                <button
                  id="btn-close-csv-export-modal"
                  type="button"
                  onClick={() => setIsExportCsvModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4 overflow-y-auto">
                {/* 1. Date Range Filters (Start Date & End Date Pickers) */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Date-Picker Timeframe Filters
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setCsvDatePreset('ALL')}
                        className={`px-2 py-0.5 rounded text-[8.5px] font-bold border transition-all ${!csvStartDate && !csvEndDate ? 'bg-amber-500/25 text-amber-300 border-amber-500/50' : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'}`}
                      >
                        All Time
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvDatePreset('TODAY')}
                        className={`px-2 py-0.5 rounded text-[8.5px] font-bold border transition-all ${csvStartDate && csvStartDate === csvEndDate ? 'bg-amber-500/25 text-amber-300 border-amber-500/50' : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'}`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvDatePreset('7DAYS')}
                        className="px-2 py-0.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded text-[8.5px] font-bold border border-neutral-800 transition-all"
                      >
                        Last 7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvDatePreset('30DAYS')}
                        className="px-2 py-0.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded text-[8.5px] font-bold border border-neutral-800 transition-all"
                      >
                        Last 30 Days
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8.5px] text-neutral-400 block mb-1 font-semibold uppercase">
                        Start Date
                      </label>
                      <input
                        id="input-csv-start-date"
                        type="date"
                        value={csvStartDate}
                        onChange={(e) => setCsvStartDate(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-[10px] text-amber-300 outline-none focus:border-amber-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-neutral-400 block mb-1 font-semibold uppercase">
                        End Date
                      </label>
                      <input
                        id="input-csv-end-date"
                        type="date"
                        value={csvEndDate}
                        onChange={(e) => setCsvEndDate(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-[10px] text-amber-300 outline-none focus:border-amber-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Log Type Category Filter Dropdown */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2.5">
                  <span className="text-[10px] font-black text-[#00f2ff] uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#00f2ff]" /> Log Type Filter Dropdown
                  </span>
                  <select
                    id="select-csv-log-type-filter"
                    value={csvLogTypeFilter}
                    onChange={(e) => setCsvLogTypeFilter(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-cyan-300 font-bold text-[10px] px-3 py-2 rounded-lg outline-none focus:border-[#00f2ff] cursor-pointer"
                  >
                    <option value="ALL">ALL LOG TYPES (Info, Success, Warnings & Errors)</option>
                    <option value="WARNINGS_ERRORS">⚠️ WARNINGS & ERRORS ONLY (Degraded, Failure, Timeout)</option>
                    <option value="SUCCESS">✅ SUCCESS & NOMINAL ONLY (200 OK)</option>
                    <option value="DEGRADED">⚡ DEGRADED LATENCY ONLY (&gt; Threshold)</option>
                    <option value="FAILURE">🚨 FAILURE ONLY (HTTP 5xx Gateway Errors)</option>
                    <option value="TIMEOUT">⏱️ TIMEOUT ONLY (HTTP 408 Request Timeouts)</option>
                  </select>
                </div>

                {/* 3. CSV Columns Preview & Live Data Sample */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-emerald-400" /> Export CSV Columns & Schema Preview
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCsvColumnPreview(prev => !prev)}
                      className="text-[8.5px] text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      {showCsvColumnPreview ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>

                  {showCsvColumnPreview && (
                    <div className="space-y-2.5">
                      {/* Column Schema Badges */}
                      <div className="flex flex-wrap gap-1.5 bg-neutral-950 p-2.5 rounded-lg border border-neutral-850">
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">1. ID</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">2. Timestamp</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">3. Status</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">4. Ping_RTT_ms</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">5. HTTP_Code</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">6. Endpoint</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">7. Details</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">8. Error</span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[8.5px] rounded">9. Storage_Type</span>
                      </div>

                      {/* Sample Matching Data Table */}
                      <div className="overflow-x-auto border border-neutral-850 rounded-lg bg-black/60 max-h-40">
                        {csvFilteredEvents.length > 0 ? (
                          <table className="w-full text-[8.5px] text-left">
                            <thead className="bg-neutral-900 text-neutral-400 uppercase sticky top-0">
                              <tr>
                                <th className="px-2.5 py-1.5 border-b border-neutral-800 font-extrabold">ID</th>
                                <th className="px-2.5 py-1.5 border-b border-neutral-800 font-extrabold">Timestamp</th>
                                <th className="px-2.5 py-1.5 border-b border-neutral-800 font-extrabold">Status</th>
                                <th className="px-2.5 py-1.5 border-b border-neutral-800 font-extrabold">RTT</th>
                                <th className="px-2.5 py-1.5 border-b border-neutral-800 font-extrabold">HTTP</th>
                                <th className="px-2.5 py-1.5 border-b border-neutral-800 font-extrabold">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-900 text-neutral-300">
                              {csvFilteredEvents.slice(0, 5).map((e) => (
                                <tr key={e.id} className="hover:bg-neutral-900/50">
                                  <td className="px-2.5 py-1 font-bold text-emerald-400">{e.id}</td>
                                  <td className="px-2.5 py-1 whitespace-nowrap text-neutral-400">{e.timestamp}</td>
                                  <td className="px-2.5 py-1 font-bold">
                                    <span className={e.status === 'SUCCESS' ? 'text-emerald-400' : e.status === 'DEGRADED' ? 'text-amber-400' : 'text-rose-400'}>
                                      {e.status}
                                    </span>
                                  </td>
                                  <td className="px-2.5 py-1 text-cyan-300 font-bold">{e.pingMs}ms</td>
                                  <td className="px-2.5 py-1">{e.httpStatus}</td>
                                  <td className="px-2.5 py-1 truncate max-w-[160px] text-neutral-400">{e.rttDetails}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-4 text-center text-neutral-500 text-[9px]">
                            No log entries match the selected timeframe and log type criteria.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between gap-3">
                <div className="text-[9.5px] text-neutral-400">
                  Ready to export <strong className="text-emerald-400">{csvFilteredEvents.length}</strong> matching log records (from {currentPoolEvents.length} total)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-cancel-csv-export"
                    type="button"
                    onClick={() => setIsExportCsvModalOpen(false)}
                    className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-[9.5px] font-bold border border-neutral-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-download-csv-file-confirm"
                    type="button"
                    onClick={handlePerformExportCSV}
                    disabled={csvFilteredEvents.length === 0}
                    className="px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-black text-[10px] rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DOWNLOAD CSV FILE</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 🚨 EMERGENCY RECONNECT ALERT MODAL (Triggers when disconnected > 30 seconds) */}
        {isEmergencyModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-950 border-2 border-rose-500/80 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.4)] max-w-md w-full overflow-hidden text-left"
            >
              {/* Emergency Banner Header */}
              <div className="p-4 bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border-b border-rose-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/40 animate-pulse">
                    <ShieldAlert className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      CRITICAL CONNECTION DROPPED
                    </h3>
                    <p className="text-[10px] text-rose-300 font-mono font-bold">
                      Webex WebSocket Disconnected for {disconnectedSeconds}s (&gt; 30s threshold)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="p-1 text-rose-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Details */}
              <div className="p-5 space-y-4">
                <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl space-y-2 text-[11px] text-neutral-300">
                  <p className="font-semibold text-rose-200">
                    ⚠️ The Cisco Webex telemetry and offer intercept stream has been disconnected for over 30 seconds.
                  </p>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Auto-grabber listening threads require an active Webex socket session to process incoming offer payloads in real-time. Execute an immediate emergency reconnection to restore stream integrity.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-neutral-500 block uppercase">Outage Duration</span>
                    <span className="text-rose-400 font-extrabold text-xs">{disconnectedSeconds} Seconds</span>
                  </div>
                  <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
                    <span className="text-neutral-500 block uppercase">Target Gateway</span>
                    <span className="text-cyan-300 font-extrabold text-[10px]">ciscospark.com</span>
                  </div>
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="p-4 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-[10.5px] rounded-xl border border-neutral-700 transition-all cursor-pointer"
                >
                  Dismiss Warning
                </button>

                <button
                  id="btn-emergency-reconnect-action"
                  type="button"
                  onClick={handleEmergencyReconnect}
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 hover:from-rose-500 hover:to-red-400 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all flex items-center gap-2 cursor-pointer border border-rose-400/50 animate-pulse"
                >
                  <Zap className="w-4 h-4 text-white" />
                  <span>EMERGENCY RECONNECT</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
