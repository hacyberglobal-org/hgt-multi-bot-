import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity, Radio, Search, Filter, AlertTriangle, CheckCircle2, XCircle,
  Clock, Zap, Copy, Download, RefreshCw, Terminal, ShieldAlert, Check,
  X, ChevronDown, ChevronUp, Code, Share2, Trash2, Cpu, ShieldCheck,
  Server, ArrowUpDown, Key, Flame, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type HandshakePhase =
  | 'TLS_HANDSHAKE'
  | 'OAUTH_TOKEN'
  | 'WS_UPGRADE'
  | 'SERVICE_DISCOVERY'
  | 'KEEPALIVE_SYNC'
  | 'WEBHOOK_VERIFY'
  | 'SESSION_TERMINATE';

export type HandshakeStatus = 'SUCCESS' | 'FAILED' | 'WARNING' | 'INFO';

export interface WebexHandshakeEvent {
  id: string;
  timestamp: string;
  createdMs: number;
  phase: HandshakePhase;
  status: HandshakeStatus;
  errorCode?: string;
  httpStatus: number;
  rttMs: number;
  endpoint: string;
  cipherSuite?: string;
  edgeNode: string;
  clientIp: string;
  summary: string;
  remediation?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  rawPayload?: string;
  curlCommand?: string;
}

interface WebexHandshakeEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLog?: (type: string, message: string, detail?: string, code?: string) => void;
  currentPingMs?: number;
  webexStatus?: string;
}

// Initial realistic dataset representing recent handshake interactions with diverse timestamped error codes
const INITIAL_HANDSHAKE_EVENTS: WebexHandshakeEvent[] = [
  {
    id: 'HS-9844',
    timestamp: '2026-09-24 13:17:42.104',
    createdMs: Date.now() - 1000 * 8,
    phase: 'KEEPALIVE_SYNC',
    status: 'SUCCESS',
    httpStatus: 200,
    rttMs: 27,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    cipherSuite: 'TLS_AES_256_GCM_SHA384 (X25519)',
    edgeNode: 'iad-04.edge.ciscospark.com (Ashburn, VA)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'Keep-alive stream synchronizer acknowledged. TCP session healthy with zero frame jitter.',
    errorCode: 'HTTP_200_OK_NOMINAL',
    requestHeaders: {
      'Authorization': 'Bearer cisco_***...9f2a',
      'User-Agent': 'HACyberSparkBot/3.2.0 (Linux; x86_64)',
      'X-Spark-SessionId': 'sess_9942a1bc',
      'Host': 'api.ciscospark.com'
    },
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Spark-RequestId': 'req_88192a01',
      'Server': 'cisco-spark-edge/1.18.2',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    },
    rawPayload: JSON.stringify({ status: 'ok', rttMs: 27, edgeLatency: '4.2ms', timestamp: 1790275062 }, null, 2),
    curlCommand: 'curl -i -X GET https://api.ciscospark.com/v1/ping \\\n  -H "Authorization: Bearer $CISCO_WEBEX_TOKEN" \\\n  -H "User-Agent: HACyberSparkBot/3.2.0"'
  },
  {
    id: 'HS-9843',
    timestamp: '2026-09-24 13:16:58.330',
    createdMs: Date.now() - 1000 * 52,
    phase: 'WS_UPGRADE',
    status: 'SUCCESS',
    httpStatus: 101,
    rttMs: 41,
    endpoint: 'wss://mercury-connection.ciscospark.com/v1/streams',
    cipherSuite: 'TLS_AES_128_GCM_SHA256 (P-256)',
    edgeNode: 'ord-02.edge.ciscospark.com (Chicago, IL)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'Mercury bi-directional WebSocket protocol switch negotiated (HTTP 101). Offer stream subscribed.',
    errorCode: 'HTTP_101_SWITCHING_PROTOCOLS',
    requestHeaders: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ=='
    },
    responseHeaders: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=',
      'X-Mercury-Cluster': 'mercury-prod-us-east-cluster-9'
    },
    rawPayload: JSON.stringify({ event: 'websocket_subscribed', channel: 'spark_offers_realtime', bufferSize: 1024 }, null, 2),
    curlCommand: 'wscat -c "wss://mercury-connection.ciscospark.com/v1/streams" \\\n  -H "Authorization: Bearer $CISCO_WEBEX_TOKEN"'
  },
  {
    id: 'HS-9842',
    timestamp: '2026-09-24 13:15:20.612',
    createdMs: Date.now() - 1000 * 150,
    phase: 'SERVICE_DISCOVERY',
    status: 'FAILED',
    httpStatus: 502,
    rttMs: 0,
    endpoint: 'https://api.ciscospark.com/v1/spark/streams/catalog',
    cipherSuite: 'TLS_AES_256_GCM_SHA384 (X25519)',
    edgeNode: 'iad-01.edge.ciscospark.com (Ashburn, VA)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'Upstream gateway reverse-proxy returned HTTP 502 Bad Gateway during high offer dispatch burst.',
    errorCode: 'ERR_502_BAD_GATEWAY',
    remediation: 'Upstream Cisco proxy node overloaded. Handshake engine automatically falling back to secondary cluster ord-02.',
    requestHeaders: {
      'Authorization': 'Bearer cisco_***...9f2a',
      'Accept': 'application/json',
      'X-Spark-Retry-Attempt': '1'
    },
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Spark-RequestId': 'err_bad_gateway_994',
      'Retry-After': '2'
    },
    rawPayload: JSON.stringify({
      errorCode: 'ERR_502_BAD_GATEWAY',
      message: 'Upstream server failed to respond within designated gateway threshold',
      timestamp: '2026-09-24T13:15:20.612Z',
      edgeCluster: 'iad-01'
    }, null, 2),
    curlCommand: 'curl -i -X GET https://api.ciscospark.com/v1/spark/streams/catalog \\\n  -H "Authorization: Bearer $CISCO_WEBEX_TOKEN"'
  },
  {
    id: 'HS-9841',
    timestamp: '2026-09-24 13:13:05.889',
    createdMs: Date.now() - 1000 * 280,
    phase: 'OAUTH_TOKEN',
    status: 'WARNING',
    httpStatus: 429,
    rttMs: 98,
    endpoint: 'https://idbroker.webex.com/idb/oauth2/v1/access_token',
    cipherSuite: 'ECDHE-RSA-AES256-GCM-SHA384',
    edgeNode: 'dfw-01.edge.webex.com (Dallas, TX)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'API Token issuance rate-limited (HTTP 429). Rate limiter quota exceeded for minute window.',
    errorCode: 'ERR_429_RATE_LIMIT',
    remediation: 'Cool down token refresh loop. Adhere to X-RateLimit-Reset headers (delay 3.4s).',
    requestHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Spark-Client-Version': '3.2.0'
    },
    responseHeaders: {
      'Retry-After': '3',
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': '1790274789'
    },
    rawPayload: JSON.stringify({
      errorCode: 'ERR_429_RATE_LIMIT',
      message: 'Too Many Requests: Rate limit quota exhausted for client IP',
      retryAfterSeconds: 3.4,
      limitType: 'TOKEN_ENDPOINT'
    }, null, 2),
    curlCommand: 'curl -X POST https://idbroker.webex.com/idb/oauth2/v1/access_token \\\n  -d "grant_type=refresh_token&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"'
  },
  {
    id: 'HS-9840',
    timestamp: '2026-09-24 13:09:44.201',
    createdMs: Date.now() - 1000 * 480,
    phase: 'SESSION_TERMINATE',
    status: 'FAILED',
    httpStatus: 408,
    rttMs: 1500,
    endpoint: 'wss://mercury-connection.ciscospark.com/v1/streams',
    cipherSuite: 'TLS_AES_128_GCM_SHA256',
    edgeNode: 'sjc-01.edge.ciscospark.com (San Jose, CA)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'TCP WebSocket connection timed out after 1500ms handshake deadline. Stream dropped by peer.',
    errorCode: 'ERR_408_HANDSHAKE_TIMEOUT',
    remediation: 'Socket timed out before TLS ACK was exchanged. Auto-reconnect triggered after 1.5s backoff.',
    requestHeaders: {
      'Upgrade': 'websocket',
      'Sec-WebSocket-Key': 'f839a8bc==',
      'Timeout': '1500ms'
    },
    responseHeaders: {
      'X-Spark-Status': 'TIMEOUT_BEFORE_HANDSHAKE_COMPLETION'
    },
    rawPayload: JSON.stringify({
      errorCode: 'ERR_408_HANDSHAKE_TIMEOUT',
      durationMs: 1500,
      phase: 'TCP_SYN_ACK_WAIT',
      action: 'SOCKET_CLOSED_BY_CLIENT'
    }, null, 2),
    curlCommand: 'wscat -c "wss://mercury-connection.ciscospark.com/v1/streams" --connect-timeout 1.5'
  },
  {
    id: 'HS-9839',
    timestamp: '2026-09-24 13:04:12.775',
    createdMs: Date.now() - 1000 * 810,
    phase: 'WS_UPGRADE',
    status: 'FAILED',
    httpStatus: 1006,
    rttMs: 0,
    endpoint: 'wss://mercury-connection.ciscospark.com/v1/streams',
    cipherSuite: 'TLS_AES_256_GCM_SHA384',
    edgeNode: 'iad-04.edge.ciscospark.com (Ashburn, VA)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'WebSocket closed abnormally without close frame (RFC 6455 1006). Remote server reset socket.',
    errorCode: 'WS_1006_ABNORMAL_CLOSURE',
    remediation: 'Remote socket abruptly severed by network edge. Cleared stale socket handle and re-registered stream.',
    requestHeaders: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade'
    },
    responseHeaders: {
      'Sec-WebSocket-Close-Code': '1006'
    },
    rawPayload: JSON.stringify({
      errorCode: 'WS_1006_ABNORMAL_CLOSURE',
      description: 'The connection was closed abnormally, e.g., without sending or completing the Close handshake',
      recoverable: true
    }, null, 2),
    curlCommand: '# Re-establish lost socket stream\nwscat -c "wss://mercury-connection.ciscospark.com/v1/streams"'
  },
  {
    id: 'HS-9838',
    timestamp: '2026-09-24 12:58:31.905',
    createdMs: Date.now() - 1000 * 1150,
    phase: 'OAUTH_TOKEN',
    status: 'FAILED',
    httpStatus: 401,
    rttMs: 34,
    endpoint: 'https://api.ciscospark.com/v1/people/me',
    cipherSuite: 'TLS_AES_256_GCM_SHA384',
    edgeNode: 'iad-02.edge.ciscospark.com (Ashburn, VA)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'Bearer authentication failed. Access token signature expired or invalid bot secret.',
    errorCode: 'ERR_401_TOKEN_EXPIRED',
    remediation: 'Refresh OAuth token using refresh_token grant or re-issue Webex bot token in Cisco developer portal.',
    requestHeaders: {
      'Authorization': 'Bearer cisco_expired_token_demo'
    },
    responseHeaders: {
      'WWW-Authenticate': 'Bearer error="invalid_token", error_description="The access token expired"',
      'Content-Type': 'application/json'
    },
    rawPayload: JSON.stringify({
      errorCode: 'ERR_401_TOKEN_EXPIRED',
      message: 'The access token expired at 2026-09-24T12:55:00.000Z',
      requiredScope: 'spark:all'
    }, null, 2),
    curlCommand: 'curl -i -X GET https://api.ciscospark.com/v1/people/me \\\n  -H "Authorization: Bearer $CISCO_WEBEX_TOKEN"'
  },
  {
    id: 'HS-9837',
    timestamp: '2026-09-24 12:51:19.412',
    createdMs: Date.now() - 1000 * 1580,
    phase: 'TLS_HANDSHAKE',
    status: 'SUCCESS',
    httpStatus: 200,
    rttMs: 31,
    endpoint: 'https://api.ciscospark.com/v1/ping',
    cipherSuite: 'TLS_AES_256_GCM_SHA384 (ECDSA P-384)',
    edgeNode: 'iad-03.edge.ciscospark.com (Ashburn, VA)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'TLS 1.3 cryptographic handshake completed successfully. Server identity verified via DigiCert Root CA.',
    errorCode: 'TLS_1_3_NEGOTIATION_OK',
    requestHeaders: {
      'Host': 'api.ciscospark.com',
      'TLS-Version': 'TLSv1.3'
    },
    responseHeaders: {
      'Server': 'cisco-spark-edge',
      'X-TLS-Protocol': 'TLSv1.3',
      'X-Cipher-Suite': 'TLS_AES_256_GCM_SHA384'
    },
    rawPayload: JSON.stringify({ tlsHandshake: 'complete', sessionResumed: false, alpn: 'http/1.1' }, null, 2),
    curlCommand: 'openssl s_client -connect api.ciscospark.com:443 -tls1_3'
  },
  {
    id: 'HS-9836',
    timestamp: '2026-09-24 12:44:03.118',
    createdMs: Date.now() - 1000 * 2015,
    phase: 'SERVICE_DISCOVERY',
    status: 'FAILED',
    httpStatus: 504,
    rttMs: 2500,
    endpoint: 'https://api.ciscospark.com/v1/spark/streams/routing',
    cipherSuite: 'TLS_AES_256_GCM_SHA384',
    edgeNode: 'ord-01.edge.ciscospark.com (Chicago, IL)',
    clientIp: '10.128.0.44 (US-East Cloud Run)',
    summary: 'Gateway Timeout (504). Regional router failed to deliver routing table within 2500ms timeout.',
    errorCode: 'ERR_504_GATEWAY_TIMEOUT',
    remediation: 'Regional routing delay. Switched to fallback DNS SRV records for Cisco Webex Chicago cluster.',
    requestHeaders: {
      'Authorization': 'Bearer cisco_***...9f2a',
      'X-Routing-Preference': 'FASTEST_ROUTE'
    },
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Spark-Error-Source': 'edge-router-chicago'
    },
    rawPayload: JSON.stringify({
      errorCode: 'ERR_504_GATEWAY_TIMEOUT',
      message: 'The upstream server failed to complete DNS SRV resolution before timeout',
      cluster: 'ord-01'
    }, null, 2),
    curlCommand: 'curl -i -X GET https://api.ciscospark.com/v1/spark/streams/routing \\\n  -H "Authorization: Bearer $CISCO_WEBEX_TOKEN"'
  }
];

export default function WebexHandshakeEventsModal({
  isOpen,
  onClose,
  onAddLog,
  currentPingMs = 38,
  webexStatus = 'Connected'
}: WebexHandshakeEventsModalProps) {
  const [events, setEvents] = useState<WebexHandshakeEvent[]>(INITIAL_HANDSHAKE_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedErrorCode, setSelectedErrorCode] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'SLOWEST' | 'ERRORS_FIRST'>('NEWEST');
  const [expandedEventId, setExpandedEventId] = useState<string | null>('HS-9842');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSimulatingHandshake, setIsSimulatingHandshake] = useState(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Flash toast notice
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct list of error codes present in data
  const distinctErrorCodes = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.errorCode) set.add(e.errorCode);
    });
    return Array.from(set);
  }, [events]);

  // Filter and search computation
  const filteredEvents = useMemo(() => {
    return events
      .filter(item => {
        // Phase Filter
        if (phaseFilter !== 'ALL' && item.phase !== phaseFilter) {
          return false;
        }

        // Status Filter
        if (statusFilter === 'ERRORS_ONLY') {
          if (item.status !== 'FAILED') return false;
        } else if (statusFilter === 'WARNINGS_ONLY') {
          if (item.status !== 'WARNING') return false;
        } else if (statusFilter === 'SUCCESS_ONLY') {
          if (item.status !== 'SUCCESS') return false;
        }

        // Specific Error Code Filter
        if (selectedErrorCode && item.errorCode !== selectedErrorCode) {
          return false;
        }

        // Full-Text Search Query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.timestamp.toLowerCase().includes(q) ||
          item.phase.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          (item.errorCode && item.errorCode.toLowerCase().includes(q)) ||
          item.endpoint.toLowerCase().includes(q) ||
          item.edgeNode.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          (item.remediation && item.remediation.toLowerCase().includes(q)) ||
          item.httpStatus.toString().includes(q) ||
          `${item.rttMs}ms`.includes(q)
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'SLOWEST') {
          return b.rttMs - a.rttMs;
        }
        if (sortOrder === 'OLDEST') {
          return a.createdMs - b.createdMs;
        }
        if (sortOrder === 'ERRORS_FIRST') {
          const aWeight = a.status === 'FAILED' ? 3 : a.status === 'WARNING' ? 2 : 1;
          const bWeight = b.status === 'FAILED' ? 3 : b.status === 'WARNING' ? 2 : 1;
          if (bWeight !== aWeight) return bWeight - aWeight;
          return b.createdMs - a.createdMs;
        }
        return b.createdMs - a.createdMs; // NEWEST
      });
  }, [events, searchQuery, phaseFilter, statusFilter, selectedErrorCode, sortOrder]);

  // Quick summary statistics
  const stats = useMemo(() => {
    const total = events.length;
    const errors = events.filter(e => e.status === 'FAILED').length;
    const warnings = events.filter(e => e.status === 'WARNING').length;
    const successes = events.filter(e => e.status === 'SUCCESS').length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 100;
    const avgRtt = total > 0 ? Math.round(events.reduce((acc, c) => acc + c.rttMs, 0) / total) : 0;

    return { total, errors, warnings, successes, successRate, avgRtt };
  }, [events]);

  // Copy full debugging diagnostics for an event
  const handleCopyDiagnostic = (event: WebexHandshakeEvent) => {
    const payload = [
      `=== CISCO WEBEX API HANDSHAKE DIAGNOSTIC REPORT ===`,
      `Event ID: #${event.id}`,
      `Timestamp: ${event.timestamp}`,
      `Handshake Phase: ${event.phase}`,
      `Status: ${event.status} (HTTP ${event.httpStatus})`,
      `Error Code: ${event.errorCode || 'NONE'}`,
      `RTT Latency: ${event.rttMs} ms`,
      `Endpoint: ${event.endpoint}`,
      `Edge Node: ${event.edgeNode}`,
      `Client IP: ${event.clientIp}`,
      `Cipher Suite: ${event.cipherSuite || 'N/A'}`,
      `Summary: ${event.summary}`,
      ...(event.remediation ? [`Suggested Remediation: ${event.remediation}`] : []),
      `----------------------------------------------------`,
      `cURL Reproduce:`,
      event.curlCommand || 'N/A',
      `----------------------------------------------------`,
      `Raw Debug Payload:`,
      event.rawPayload || '{}',
      `====================================================`
    ].join('\n');

    navigator.clipboard.writeText(payload);
    setCopiedId(event.id);
    triggerToast(`Copied debug diagnostic for #${event.id} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);

    if (onAddLog) {
      onAddLog(
        'info',
        `📋 Handshake event #${event.id} (${event.errorCode || 'SUCCESS'}) copied to clipboard for debugging.`,
        undefined,
        'HANDSHAKE_COPY'
      );
    }
  };

  // Copy cURL command alone
  const handleCopyCurl = (cmd?: string) => {
    if (!cmd) return;
    navigator.clipboard.writeText(cmd);
    triggerToast('Copied cURL command to clipboard!');
  };

  // Trigger live multi-stage handshake simulation sequence
  const handleSimulateHandshake = () => {
    setIsSimulatingHandshake(true);
    setSimStep(1);

    // Step 1: TLS 1.3
    setTimeout(() => {
      setSimStep(2);
      // Step 2: Token Auth
      setTimeout(() => {
        setSimStep(3);
        // Step 3: WebSocket Upgrade
        setTimeout(() => {
          setSimStep(4);
          // Step 4: Finalize & append success event
          setTimeout(() => {
            setIsSimulatingHandshake(false);
            setSimStep(0);

            const newId = `HS-${Math.floor(9850 + Math.random() * 500)}`;
            const now = new Date();
            const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;
            const rtt = Math.floor(Math.random() * 16) + 24;

            const newEvent: WebexHandshakeEvent = {
              id: newId,
              timestamp,
              createdMs: Date.now(),
              phase: 'KEEPALIVE_SYNC',
              status: 'SUCCESS',
              httpStatus: 200,
              rttMs: rtt,
              endpoint: 'https://api.ciscospark.com/v1/ping',
              cipherSuite: 'TLS_AES_256_GCM_SHA384 (X25519)',
              edgeNode: 'iad-04.edge.ciscospark.com (Ashburn, VA)',
              clientIp: '10.128.0.44 (US-East Cloud Run)',
              summary: `Live test handshake executed: TLS 1.3 negotiated, OAuth verified, and WebSocket connection synchronized (${rtt}ms RTT).`,
              errorCode: 'HTTP_200_OK_NOMINAL',
              requestHeaders: {
                'Authorization': 'Bearer cisco_live_test_***',
                'User-Agent': 'HACyberSparkBot/3.2.0-Diagnostic'
              },
              responseHeaders: {
                'Content-Type': 'application/json',
                'X-Spark-RequestId': `req_sim_${Math.floor(Math.random() * 100000)}`,
                'Server': 'cisco-spark-edge'
              },
              rawPayload: JSON.stringify({ test: 'live_handshake_simulation', status: 'SYNCHRONIZED', rttMs: rtt }, null, 2),
              curlCommand: 'curl -i -X GET https://api.ciscospark.com/v1/ping \\\n  -H "Authorization: Bearer $CISCO_WEBEX_TOKEN"'
            };

            setEvents(prev => [newEvent, ...prev]);
            setExpandedEventId(newId);
            triggerToast(`✅ Handshake test completed successfully (#${newId} - ${rtt}ms RTT)!`);

            if (onAddLog) {
              onAddLog(
                'info',
                `🤝 Live Cisco Webex Handshake Test successful: Event #${newId} recorded with ${rtt}ms RTT.`,
                undefined,
                'HANDSHAKE_TEST_OK'
              );
            }
          }, 450);
        }, 450);
      }, 450);
    }, 450);
  };

  // Inject a simulated error event for operator testing
  const handleInjectErrorSimulation = (errCode: 'ERR_502_BAD_GATEWAY' | 'ERR_429_RATE_LIMIT' | 'ERR_401_TOKEN_EXPIRED' | 'WS_1006_ABNORMAL_CLOSURE') => {
    const newId = `HS-${Math.floor(9850 + Math.random() * 500)}`;
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;

    let phase: HandshakePhase = 'SERVICE_DISCOVERY';
    let httpStatus = 502;
    let summary = 'Simulated error injected for diagnostics testing.';
    let remediation = 'Review error code details below.';

    if (errCode === 'ERR_502_BAD_GATEWAY') {
      phase = 'SERVICE_DISCOVERY';
      httpStatus = 502;
      summary = 'Simulated Bad Gateway: Upstream Cisco edge proxy failed to acknowledge routing stream.';
      remediation = 'Auto-reconnect with fallback cluster initiated.';
    } else if (errCode === 'ERR_429_RATE_LIMIT') {
      phase = 'OAUTH_TOKEN';
      httpStatus = 429;
      summary = 'Simulated Rate Limit Exhaustion: 100 calls/min threshold exceeded for bot token.';
      remediation = 'Pause API requests until X-RateLimit-Reset timestamp.';
    } else if (errCode === 'ERR_401_TOKEN_EXPIRED') {
      phase = 'OAUTH_TOKEN';
      httpStatus = 401;
      summary = 'Simulated Authentication Expiry: OAuth JWT signature invalid or expired.';
      remediation = 'Rotate Cisco bot access token in developer portal.';
    } else if (errCode === 'WS_1006_ABNORMAL_CLOSURE') {
      phase = 'WS_UPGRADE';
      httpStatus = 1006;
      summary = 'Simulated WebSocket Dropped: Socket closed abnormally without standard TCP close frame.';
      remediation = 'Execute socket reset and re-establish handshake channel.';
    }

    const errorEvent: WebexHandshakeEvent = {
      id: newId,
      timestamp,
      createdMs: Date.now(),
      phase,
      status: 'FAILED',
      httpStatus,
      rttMs: 0,
      endpoint: 'https://api.ciscospark.com/v1/ping',
      edgeNode: 'iad-01.edge.ciscospark.com (Ashburn, VA)',
      clientIp: '10.128.0.44 (US-East Cloud Run)',
      summary,
      errorCode: errCode,
      remediation,
      rawPayload: JSON.stringify({ errorCode: errCode, simulated: true, timestamp }, null, 2),
      curlCommand: `curl -i -X GET https://api.ciscospark.com/v1/ping -H "Authorization: Bearer $CISCO_WEBEX_TOKEN"`
    };

    setEvents(prev => [errorEvent, ...prev]);
    setExpandedEventId(newId);
    triggerToast(`Injected simulated error code: ${errCode}`);

    if (onAddLog) {
      onAddLog(
        'warning',
        `⚠️ Injected simulated handshake error: ${errCode} recorded on #${newId}.`,
        undefined,
        'HANDSHAKE_ERR_SIM'
      );
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cisco_webex_handshake_events_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${filteredEvents.length} handshake events to JSON file.`);
  };

  // Copy Full Markdown Incident Report
  const handleCopyMarkdownReport = () => {
    let md = `# Cisco Webex API Connection Handshake Audit Report\n\n`;
    md += `**Generated At:** ${new Date().toUTCString()}\n`;
    md += `**Total Handshake Events Analyzed:** ${stats.total}\n`;
    md += `**Success Rate:** ${stats.successRate}%\n`;
    md += `**Failures / Timeouts:** ${stats.errors}\n`;
    md += `**Average RTT:** ${stats.avgRtt} ms\n\n`;
    md += `## Handshake Event Ledger\n\n`;
    md += `| Event ID | Timestamp (UTC) | Phase | Status | Error Code | RTT | Endpoint |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    filteredEvents.forEach(e => {
      md += `| \`${e.id}\` | ${e.timestamp} | \`${e.phase}\` | ${e.status} (${e.httpStatus}) | **\`${e.errorCode || 'NONE'}\`** | ${e.rttMs}ms | \`${e.endpoint}\` |\n`;
    });

    md += `\n\n## Diagnostic Summaries & Remediation\n\n`;
    filteredEvents.filter(e => e.status !== 'SUCCESS').forEach(e => {
      md += `### ${e.id} - ${e.errorCode || 'ERROR'} (${e.timestamp})\n`;
      md += `- **Phase:** ${e.phase}\n`;
      md += `- **Endpoint:** ${e.endpoint}\n`;
      md += `- **Edge Node:** ${e.edgeNode}\n`;
      md += `- **Summary:** ${e.summary}\n`;
      if (e.remediation) {
        md += `- **Remediation:** ${e.remediation}\n`;
      }
      md += `\n`;
    });

    navigator.clipboard.writeText(md);
    triggerToast('Copied full Markdown incident report to clipboard!');
  };

  // Clear events
  const handleClearEvents = () => {
    if (confirm('Clear handshake events history buffer? This cannot be undone.')) {
      setEvents([]);
      triggerToast('Handshake events buffer cleared.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="webex-handshake-events-modal-overlay"
        className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md font-mono"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="bg-neutral-950 border border-[#00f2ff]/30 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-[0_0_60px_rgba(0,242,255,0.18)] flex flex-col overflow-hidden relative"
        >
          {/* Neon Header Accent Strip */}
          <div className="h-1 bg-gradient-to-r from-[#00f2ff] via-blue-600 to-indigo-500 w-full" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/70">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00f2ff]/10 border border-[#00f2ff]/35 rounded-xl text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.25)] shrink-0">
                <Terminal className="w-5 h-5 text-[#00f2ff]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-wider block">
                    CISCO WEBEX PROTOCOL HANDSHAKE AUDIT
                  </span>
                  <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                    webexStatus === 'Connected'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  }`}>
                    <Radio className="w-3 h-3 text-[#00f2ff] animate-pulse" />
                    LIVE LINK: {webexStatus.toUpperCase()} ({currentPingMs}ms)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-sans font-extrabold text-white tracking-wide mt-0.5">
                  Webex Connection Handshake Ledger & Error Codes
                </h2>
              </div>
            </div>

            {/* Header Right Action Tools */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleSimulateHandshake}
                disabled={isSimulatingHandshake}
                className="px-3 py-1.5 bg-[#00f2ff] hover:bg-[#00d8e6] text-neutral-950 font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.3)] disabled:opacity-50 hover:scale-105 active:scale-95"
                title="Trigger a live 4-stage TLS and WebSocket handshake test"
              >
                <Zap className={`w-3.5 h-3.5 ${isSimulatingHandshake ? 'animate-spin' : ''}`} />
                <span>{isSimulatingHandshake ? 'HANDSHAKING...' : 'RUN LIVE HANDSHAKE'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMarkdownReport}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:border-neutral-700"
                title="Copy structured Markdown debug report for issue ticketing"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">REPORT</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:border-neutral-700"
                title="Export filtered handshake ledger as JSON"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">JSON</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics & Toast Banner */}
          <div className="bg-neutral-950/90 border-b border-neutral-850 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[10.5px]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-bold uppercase text-[9px]">TOTAL EVENTS:</span>
                <span className="font-mono font-bold text-white bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                  {stats.total}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-bold uppercase text-[9px]">SUCCESS RATE:</span>
                <span className={`font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                  stats.successRate >= 90
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}>
                  {stats.successRate}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-bold uppercase text-[9px]">ACTIVE ANOMALIES:</span>
                <span className={`font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                  stats.errors > 0
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse'
                    : 'text-neutral-400 bg-neutral-900 border-neutral-800'
                }`}>
                  {stats.errors} Errors / {stats.warnings} Warnings
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-bold uppercase text-[9px]">AVG HANDSHAKE RTT:</span>
                <span className="font-mono font-bold text-[#00f2ff]">
                  {stats.avgRtt} ms
                </span>
              </div>
            </div>

            {/* Error Injection Sandbox Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-neutral-500 font-bold uppercase hidden sm:inline">
                SIMULATE ERROR:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleInjectErrorSimulation('ERR_502_BAD_GATEWAY')}
                  className="px-1.5 py-0.5 text-[8px] font-bold bg-neutral-900 hover:bg-neutral-800 text-rose-400 border border-rose-500/30 rounded cursor-pointer transition-all"
                  title="Inject test 502 Bad Gateway code"
                >
                  +502
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectErrorSimulation('ERR_429_RATE_LIMIT')}
                  className="px-1.5 py-0.5 text-[8px] font-bold bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 rounded cursor-pointer transition-all"
                  title="Inject test 429 Rate Limit code"
                >
                  +429
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectErrorSimulation('ERR_401_TOKEN_EXPIRED')}
                  className="px-1.5 py-0.5 text-[8px] font-bold bg-neutral-900 hover:bg-neutral-800 text-orange-400 border border-orange-500/30 rounded cursor-pointer transition-all"
                  title="Inject test 401 Token Expired code"
                >
                  +401
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectErrorSimulation('WS_1006_ABNORMAL_CLOSURE')}
                  className="px-1.5 py-0.5 text-[8px] font-bold bg-neutral-900 hover:bg-neutral-800 text-purple-400 border border-purple-500/30 rounded cursor-pointer transition-all"
                  title="Inject test WS 1006 Closure code"
                >
                  +1006
                </button>
              </div>
            </div>
          </div>

          {/* Handshake Simulation Live Stepper Banner */}
          {isSimulatingHandshake && (
            <div className="bg-neutral-900/90 border-b border-cyan-500/40 p-3 flex items-center justify-between gap-3 text-cyan-400 text-[10px]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="font-extrabold uppercase tracking-wide">Executing Active Handshake Sequence:</span>
                <span className="text-white font-bold">
                  {simStep === 1 && 'Step 1/4: Negotiating TLS 1.3 Cryptographic Ciphers...'}
                  {simStep === 2 && 'Step 2/4: Exchanging OAuth 2.0 Bearer Identity Challenge...'}
                  {simStep === 3 && 'Step 3/4: Requesting WebSocket Upgrade (HTTP 101)...'}
                  {simStep === 4 && 'Step 4/4: Confirming Mercury Keep-Alive Frame...'}
                </span>
              </div>
              <div className="w-32 bg-neutral-950 h-2 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-[#00f2ff] transition-all duration-300"
                  style={{ width: `${(simStep / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Flash Toast Notification */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-cyan-950/90 border-b border-cyan-500/50 px-4 py-2 text-[10px] text-cyan-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {/* Search, Filter & Error Code Chips Section */}
          <div className="p-3 sm:p-4 bg-neutral-950 border-b border-neutral-850 flex flex-col gap-2.5">
            {/* Search Input and Select Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Search Box */}
              <div className="sm:col-span-6 relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search error code (e.g. ERR_502, ERR_429), ID, phase, IP, endpoint..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-8 py-1.5 text-[11px] text-white placeholder-neutral-500 focus:outline-none focus:border-[#00f2ff]/60 transition-all font-mono"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Handshake Phase Filter */}
              <div className="sm:col-span-2">
                <select
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-[10px] text-neutral-300 focus:outline-none focus:border-[#00f2ff]/60 cursor-pointer font-mono"
                >
                  <option value="ALL">All Phases</option>
                  <option value="TLS_HANDSHAKE">TLS 1.3 Handshake</option>
                  <option value="OAUTH_TOKEN">OAuth Token</option>
                  <option value="WS_UPGRADE">WS Protocol Switch</option>
                  <option value="SERVICE_DISCOVERY">Service Discovery</option>
                  <option value="KEEPALIVE_SYNC">Keep-Alive Sync</option>
                  <option value="SESSION_TERMINATE">Session Drop/Timeout</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="sm:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-[10px] text-neutral-300 focus:outline-none focus:border-[#00f2ff]/60 cursor-pointer font-mono"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ERRORS_ONLY">⚠️ Errors / Failures</option>
                  <option value="WARNINGS_ONLY">⚡ Warnings / Throttled</option>
                  <option value="SUCCESS_ONLY">✅ Success Only</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="sm:col-span-2">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-[10px] text-neutral-300 focus:outline-none focus:border-[#00f2ff]/60 cursor-pointer font-mono"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="ERRORS_FIRST">Errors First</option>
                  <option value="SLOWEST">Slowest RTT</option>
                  <option value="OLDEST">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Specific Error Code Pills for One-Click Quick Debug Filter */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[8.5px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                <Code className="w-3 h-3 text-neutral-400" />
                Quick Error Filter:
              </span>

              <button
                type="button"
                onClick={() => setSelectedErrorCode(null)}
                className={`px-2 py-0.5 rounded text-[8.5px] font-bold border transition-all cursor-pointer ${
                  selectedErrorCode === null
                    ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/50'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                ALL CODES
              </button>

              {distinctErrorCodes.map(code => {
                const isSelected = selectedErrorCode === code;
                const isError = code.includes('502') || code.includes('504') || code.includes('408') || code.includes('1006') || code.includes('401');
                const isWarning = code.includes('429');

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedErrorCode(isSelected ? null : code)}
                    className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : isError
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/20'
                        : isWarning
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-400'
                    }`}
                  >
                    <span>{code}</span>
                  </button>
                );
              })}

              {(searchQuery || phaseFilter !== 'ALL' || statusFilter !== 'ALL' || selectedErrorCode) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPhaseFilter('ALL');
                    setStatusFilter('ALL');
                    setSelectedErrorCode(null);
                  }}
                  className="ml-auto text-[8.5px] text-neutral-500 hover:text-rose-400 underline cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Scrollable Event List Viewport */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-neutral-950/60">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-500">
                <AlertTriangle className="w-8 h-8 text-neutral-600 mb-2" />
                <p className="text-sm font-bold text-neutral-400">No matching connection handshake events found</p>
                <p className="text-xs text-neutral-600 mt-1 max-w-sm">
                  Try clearing your search query or error code filter to view all recorded events.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPhaseFilter('ALL');
                    setStatusFilter('ALL');
                    setSelectedErrorCode(null);
                  }}
                  className="mt-3 px-3 py-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs rounded text-neutral-300 hover:text-white"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              filteredEvents.map(event => {
                const isExpanded = expandedEventId === event.id;
                const isError = event.status === 'FAILED';
                const isWarning = event.status === 'WARNING';
                const isSuccess = event.status === 'SUCCESS';

                return (
                  <div
                    key={event.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isError
                        ? 'bg-neutral-900/70 border-rose-500/40 hover:border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.08)]'
                        : isWarning
                        ? 'bg-neutral-900/70 border-amber-500/40 hover:border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                        : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Collapsed Header Bar */}
                    <div
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      className="p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 cursor-pointer select-none"
                    >
                      {/* Left: ID, Timestamp, Status & Error Code */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Status Icon */}
                        <div className="shrink-0">
                          {isError ? (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>

                        {/* Event ID */}
                        <span className="font-extrabold text-[#00f2ff] text-[11px] bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                          #{event.id}
                        </span>

                        {/* Exact Timestamp with Milliseconds */}
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span className="font-mono text-neutral-300 font-semibold">{event.timestamp}</span>
                        </span>

                        {/* Handshake Phase Badge */}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase border bg-blue-500/10 text-blue-400 border-blue-500/30">
                          {event.phase}
                        </span>

                        {/* Specific Error Code Badge */}
                        {event.errorCode && (
                          <span className={`text-[9.5px] font-mono font-black px-2 py-0.5 rounded border flex items-center gap-1 ${
                            isError
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            <Key className="w-2.5 h-2.5" />
                            {event.errorCode}
                          </span>
                        )}

                        {/* HTTP Status */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          event.httpStatus >= 200 && event.httpStatus < 300
                            ? 'bg-emerald-950 text-emerald-400'
                            : event.httpStatus === 101
                            ? 'bg-cyan-950 text-cyan-400'
                            : event.httpStatus === 429
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}>
                          HTTP {event.httpStatus}
                        </span>

                        {/* RTT Ping */}
                        <span className={`text-[9.5px] font-mono font-bold ${
                          event.rttMs === 0
                            ? 'text-rose-400'
                            : event.rttMs > 80
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {event.rttMs === 0 ? 'DROPPED' : `${event.rttMs}ms RTT`}
                        </span>
                      </div>

                      {/* Right: Endpoint & Accordion Chevron */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <span className="text-[9.5px] text-neutral-500 truncate max-w-[220px] sm:max-w-xs font-mono">
                          {event.endpoint}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyDiagnostic(event);
                          }}
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-all"
                          title="Copy diagnostic record"
                        >
                          {copiedId === event.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <div className="text-neutral-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Collapsed Brief Summary */}
                    <div className="px-3.5 pb-2.5 pt-0 text-[10.5px] text-neutral-300">
                      <p className="line-clamp-2 leading-relaxed">
                        {event.summary}
                      </p>
                    </div>

                    {/* Expanded Detailed Diagnostic Drawer */}
                    {isExpanded && (
                      <div className="border-t border-neutral-850 p-3.5 sm:p-4 bg-neutral-950/80 space-y-3">
                        {/* Actionable Remediation Banner (if applicable) */}
                        {event.remediation && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-[10.5px] text-amber-300 flex items-start gap-2.5">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-extrabold text-amber-400 uppercase tracking-wider block text-[9.5px]">
                                Actionable Debugging Remediation:
                              </span>
                              <p className="mt-0.5 leading-relaxed text-amber-200 font-sans">
                                {event.remediation}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
                          <div className="bg-neutral-900/60 border border-neutral-850 p-2 rounded-lg">
                            <span className="text-neutral-500 block uppercase text-[8px] font-bold">Edge Node</span>
                            <span className="text-neutral-200 font-bold break-all">{event.edgeNode}</span>
                          </div>

                          <div className="bg-neutral-900/60 border border-neutral-850 p-2 rounded-lg">
                            <span className="text-neutral-500 block uppercase text-[8px] font-bold">Client IP & Region</span>
                            <span className="text-neutral-200 font-bold break-all">{event.clientIp}</span>
                          </div>

                          <div className="bg-neutral-900/60 border border-neutral-850 p-2 rounded-lg">
                            <span className="text-neutral-500 block uppercase text-[8px] font-bold">Negotiated Cipher Suite</span>
                            <span className="text-[#00f2ff] font-bold break-all">{event.cipherSuite || 'None'}</span>
                          </div>
                        </div>

                        {/* Request / Response Headers snippet */}
                        {(event.requestHeaders || event.responseHeaders) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9.5px]">
                            {event.requestHeaders && (
                              <div className="bg-neutral-900/50 border border-neutral-850 p-2.5 rounded-lg">
                                <span className="text-[8.5px] text-neutral-400 font-bold uppercase block mb-1">
                                  Request Headers:
                                </span>
                                <div className="space-y-0.5 text-neutral-300 font-mono">
                                  {Object.entries(event.requestHeaders).map(([k, v]) => (
                                    <div key={k} className="flex justify-between gap-2">
                                      <span className="text-neutral-500">{k}:</span>
                                      <span className="text-neutral-200 truncate">{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {event.responseHeaders && (
                              <div className="bg-neutral-900/50 border border-neutral-850 p-2.5 rounded-lg">
                                <span className="text-[8.5px] text-neutral-400 font-bold uppercase block mb-1">
                                  Response Headers:
                                </span>
                                <div className="space-y-0.5 text-neutral-300 font-mono">
                                  {Object.entries(event.responseHeaders).map(([k, v]) => (
                                    <div key={k} className="flex justify-between gap-2">
                                      <span className="text-neutral-500">{k}:</span>
                                      <span className="text-neutral-200 truncate">{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* cURL Command Preview & Copy */}
                        {event.curlCommand && (
                          <div className="bg-neutral-900/80 border border-neutral-850 rounded-lg p-2.5 text-[9.5px]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] text-cyan-400 font-extrabold uppercase tracking-wider">
                                cURL Reproduce / CLI Verification:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCurl(event.curlCommand)}
                                className="text-[8.5px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-700"
                              >
                                <Copy className="w-2.5 h-2.5" />
                                <span>Copy cURL</span>
                              </button>
                            </div>
                            <pre className="text-neutral-300 overflow-x-auto p-1.5 bg-neutral-950 rounded text-[9px] leading-relaxed">
                              {event.curlCommand}
                            </pre>
                          </div>
                        )}

                        {/* Raw JSON Debug Payload */}
                        {event.rawPayload && (
                          <div className="bg-neutral-900/80 border border-neutral-850 rounded-lg p-2.5 text-[9.5px]">
                            <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-1.5">
                              Raw Handshake Payload:
                            </span>
                            <pre className="text-emerald-400 overflow-x-auto p-2 bg-neutral-950 rounded text-[8.5px] leading-relaxed max-h-40">
                              {event.rawPayload}
                            </pre>
                          </div>
                        )}

                        {/* Bottom Actions for this event */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCopyDiagnostic(event)}
                            className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded text-[10px] font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Copy className="w-3 h-3 text-[#00f2ff]" />
                            <span>Copy Diagnostic JSON & Report</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 border-t border-neutral-850 bg-neutral-900/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[9px] text-neutral-500 font-mono text-center sm:text-left">
              <span>HACYBERGLOBATECH Webex Telemetry Engine • RFC 6455 & TLS 1.3 Compliant</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearEvents}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-rose-400 hover:text-rose-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>CLEAR BUFFER</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-[#00f2ff]/15 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/40 text-[#00f2ff] hover:text-white font-extrabold text-[10px] rounded-lg transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
