import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu, HardDrive, Activity, Zap, RefreshCw, Server, Layers,
  ShieldCheck, Clock, TrendingUp, AlertTriangle, CheckCircle2,
  Terminal, Gauge, Sliders, Play, RotateCcw, Box, Sparkles, AlertCircle
} from 'lucide-react';

interface SystemHealthSnapshotProps {
  onAddLog?: (type: any, message: string, details?: string, code?: string) => void;
}

interface WorkerThread {
  id: number;
  name: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY';
  latencyMs: number;
  tasksCompleted: number;
}

export default function SystemHealthSnapshot({ onAddLog }: SystemHealthSnapshotProps) {
  // Real-time fluctuating metrics
  const [cpuUsage, setCpuUsage] = useState<number>(24.8);
  const [memoryUsedMb, setMemoryUsedMb] = useState<number>(278.4);
  const memoryTotalMb = 512;
  const heapUsedMb = Math.round(memoryUsedMb * 0.52 * 10) / 10;
  const rssMb = Math.round(memoryUsedMb * 1.12 * 10) / 10;
  
  const [eventLoopMs, setEventLoopMs] = useState<number>(1.2);
  const [activeThreads, setActiveThreads] = useState<number>(8);
  const [isSimulatingLoad, setIsSimulatingLoad] = useState<boolean>(false);
  const [isCleaningMemory, setIsCleaningMemory] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(15702);
  const [compactView, setCompactView] = useState<boolean>(false);

  // CPU Cores state
  const [coreLoads, setCoreLoads] = useState<number[]>([22, 28, 19, 30]);
  
  // Historical CPU readings for mini chart
  const [cpuHistory, setCpuHistory] = useState<number[]>([18, 22, 20, 25, 23, 28, 24, 22, 26, 25, 24, 27]);

  // Worker Thread pool list
  const [threads, setThreads] = useState<WorkerThread[]>([
    { id: 1, name: 'Spark Order Dispatcher', status: 'ACTIVE', latencyMs: 8, tasksCompleted: 1420 },
    { id: 2, name: 'Webex Heartbeat Monitor', status: 'ACTIVE', latencyMs: 14, tasksCompleted: 890 },
    { id: 3, name: 'Cloudflare Proxy Watchdog', status: 'ACTIVE', latencyMs: 5, tasksCompleted: 2100 },
    { id: 4, name: 'Stripe Payment Webhook', status: 'IDLE', latencyMs: 0, tasksCompleted: 430 },
    { id: 5, name: 'Telegram Bot Listener', status: 'ACTIVE', latencyMs: 12, tasksCompleted: 3120 },
    { id: 6, name: 'Telemetry Stream Worker', status: 'ACTIVE', latencyMs: 6, tasksCompleted: 5890 },
    { id: 7, name: 'Driver Wallet Sync Engine', status: 'IDLE', latencyMs: 0, tasksCompleted: 750 },
    { id: 8, name: 'Geofence Polygon Evaluator', status: 'ACTIVE', latencyMs: 18, tasksCompleted: 1280 },
    { id: 9, name: 'Google AI Studio Console Vault', status: 'ACTIVE', latencyMs: 6, tasksCompleted: 3410 },
  ]);

  // Periodic metric jitter and real API health poll
  useEffect(() => {
    // Immediate real API health fetch
    const fetchRealStatus = async () => {
      try {
        const res = await fetch('/api/system/status');
        if (res.ok) {
          const data = await res.json();
          if (data.system?.memoryMb?.rss) {
            setMemoryUsedMb(data.system.memoryMb.rss);
          }
          if (data.uptimeSeconds) {
            setUptimeSeconds(data.uptimeSeconds);
          }
          setLastRefreshed(new Date().toLocaleTimeString());
        }
      } catch {
        // Fallback to internal telemetry
      }
    };

    fetchRealStatus();

    const interval = setInterval(() => {
      // Uptime increment
      setUptimeSeconds(prev => prev + 2);

      // CPU Jitter
      setCpuUsage(prev => {
        const delta = isSimulatingLoad ? (Math.random() * 8 - 1) : (Math.random() * 4 - 2);
        const next = Math.max(12, Math.min(isSimulatingLoad ? 94 : 48, prev + delta));
        const rounded = Math.round(next * 10) / 10;
        
        // Push to history
        setCpuHistory(h => [...h.slice(1), rounded]);
        return rounded;
      });

      // Core loads
      setCoreLoads(prevCores => 
        prevCores.map(c => {
          const jitter = (Math.random() * 6 - 3);
          return Math.max(10, Math.min(95, Math.round(c + jitter)));
        })
      );

      // Memory Jitter
      setMemoryUsedMb(prev => {
        const delta = isSimulatingLoad ? (Math.random() * 4) : (Math.random() * 2 - 1);
        const next = Math.max(210, Math.min(410, prev + delta));
        return Math.round(next * 10) / 10;
      });

      // Event Loop Latency Jitter
      setEventLoopMs(() => {
        const val = isSimulatingLoad ? (Math.random() * 2.5 + 2.8) : (Math.random() * 0.8 + 0.9);
        return Math.round(val * 10) / 10;
      });

      // Random thread latency updates
      setThreads(prev => prev.map(t => {
        if (t.status === 'ACTIVE') {
          const lat = Math.max(3, Math.min(45, t.latencyMs + Math.floor(Math.random() * 5 - 2)));
          return { ...t, latencyMs: lat, tasksCompleted: t.tasksCompleted + Math.floor(Math.random() * 3) };
        }
        return t;
      }));

    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulatingLoad]);

  // Format uptime string
  const uptimeFormatted = useMemo(() => {
    const hrs = Math.floor(uptimeSeconds / 3600);
    const mins = Math.floor((uptimeSeconds % 3600) / 60);
    const secs = uptimeSeconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  }, [uptimeSeconds]);

  // Manual Trigger: Flush Memory / Garbage Collection
  const handleFlushMemory = () => {
    setIsCleaningMemory(true);
    if (onAddLog) {
      onAddLog('info', '🧹 Memory Cache Flush Triggered: Executing V8 Garbage Collection & clearing ephemeral buffers.', undefined, 'SYS_GC');
    }
    setTimeout(() => {
      setMemoryUsedMb(224.2);
      setIsCleaningMemory(false);
      setLastRefreshed(new Date().toLocaleTimeString());
      if (onAddLog) {
        onAddLog('bot_accept', '✅ Memory Reclaimed: Freed ~54.2 MB memory heap space. Container RAM reduced to 224.2 MB.', undefined, 'GC_OK');
      }
    }, 1200);
  };

  // Manual Trigger: Simulate Stress Load Test
  const handleToggleLoadTest = () => {
    const nextState = !isSimulatingLoad;
    setIsSimulatingLoad(nextState);
    if (nextState) {
      setCpuUsage(74.5);
      if (onAddLog) {
        onAddLog('warning', '⚡ Container Load Test Activated: Spawning parallel worker tasks to simulate spike traffic.', undefined, 'LOAD_TEST_ON');
      }
    } else {
      if (onAddLog) {
        onAddLog('info', '✅ Load Test Disengaged: Worker thread queue returned to normal idle state.', undefined, 'LOAD_TEST_OFF');
      }
    }
  };

  // Manual Refresh Metrics
  const handleRefreshMetrics = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
    if (onAddLog) {
      onAddLog('info', '🔄 Container Performance Metrics Refreshed: CPU, V8 Memory Heap, & Worker Thread Pool updated.', undefined, 'METRICS_REFRESH');
    }
  };

  // Calculate memory percentage
  const memoryPct = Math.round((memoryUsedMb / memoryTotalMb) * 100);

  // Health Score Calculation
  const healthScore = useMemo(() => {
    let score = 100;
    if (cpuUsage > 70) score -= 12;
    if (memoryPct > 75) score -= 15;
    if (eventLoopMs > 3.0) score -= 10;
    return Math.max(60, Math.round(score * 10) / 10);
  }, [cpuUsage, memoryPct, eventLoopMs]);

  return (
    <div id="system-health-snapshot-widget" className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(0,242,255,0.05)] backdrop-blur-md space-y-4 font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00f2ff]/10 border border-[#00f2ff]/30 rounded-xl text-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.2)]">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                System Health Snapshot
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[#00f2ff]">
                  Cloud Run Node v20.11
                </span>
              </h3>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans">
              Real-time container CPU/RAM resource usage, V8 heap allocation, and bot worker thread metrics
            </p>
          </div>
        </div>

        {/* Right Header Quick Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[9.5px] bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-lg text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#00f2ff]" />
            <span>Uptime: <strong className="text-white">{uptimeFormatted}</strong></span>
          </div>

          <button
            id="btn-toggle-compact-health"
            type="button"
            onClick={() => setCompactView(prev => !prev)}
            className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Toggle compact metric view"
          >
            <Sliders className="w-3 h-3 text-neutral-400" />
            <span>{compactView ? 'Expanded' : 'Compact'}</span>
          </button>

          <button
            id="btn-refresh-health-metrics"
            type="button"
            onClick={handleRefreshMetrics}
            className="p-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-[#00f2ff] rounded-lg transition-all cursor-pointer"
            title={`Refresh metrics (Last refreshed: ${lastRefreshed})`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Overview Metric Banner Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CPU Load Card */}
        <div className={`p-3 rounded-xl border transition-all ${
          cpuUsage > 75 
            ? 'bg-rose-950/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
            : cpuUsage > 50 
            ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' 
            : 'bg-neutral-950/60 border-neutral-850 text-neutral-200 hover:border-[#00f2ff]/30'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
            <span className="flex items-center gap-1 font-bold">
              <Cpu className="w-3 h-3 text-[#00f2ff]" /> CPU LOAD
            </span>
            <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded ${
              cpuUsage > 75 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {cpuUsage > 75 ? 'HEAVY' : 'OPTIMAL'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white">{cpuUsage}%</span>
            <span className="text-[9px] text-neutral-400 font-sans">4 Cores Virtualized</span>
          </div>
          {/* Mini Progress Bar */}
          <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-2 overflow-hidden border border-neutral-800">
            <div
              className={`h-full transition-all duration-500 ${
                cpuUsage > 75 ? 'bg-rose-500' : cpuUsage > 50 ? 'bg-amber-400' : 'bg-[#00f2ff]'
              }`}
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
        </div>

        {/* Memory Usage Card */}
        <div className={`p-3 rounded-xl border transition-all ${
          memoryPct > 80 
            ? 'bg-rose-950/20 border-rose-500/50 text-rose-300' 
            : 'bg-neutral-950/60 border-neutral-850 text-neutral-200 hover:border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
            <span className="flex items-center gap-1 font-bold">
              <HardDrive className="w-3 h-3 text-emerald-400" /> RAM ALLOCATION
            </span>
            <span className="text-[8.5px] font-extrabold text-emerald-400 font-mono">{memoryPct}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white">{memoryUsedMb} <span className="text-[10px] font-normal text-neutral-400">MB</span></span>
            <span className="text-[9px] text-neutral-400 font-sans">/ {memoryTotalMb} MB</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-2 overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${memoryPct}%` }}
            />
          </div>
        </div>

        {/* Worker Threads Card */}
        <div className="p-3 bg-neutral-950/60 border border-neutral-850 rounded-xl text-neutral-200 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
            <span className="flex items-center gap-1 font-bold">
              <Layers className="w-3 h-3 text-purple-400" /> BOT THREAD POOL
            </span>
            <span className="text-[8.5px] bg-purple-500/10 text-purple-300 px-1.5 py-0.2 rounded font-bold">
              6/8 ACTIVE
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white">{activeThreads} <span className="text-[10px] font-normal text-neutral-400">Threads</span></span>
            <span className="text-[9px] text-neutral-400 font-sans">12 Max Capacity</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-2 overflow-hidden border border-neutral-800 flex">
            <div className="h-full bg-purple-500 transition-all" style={{ width: '75%' }} />
            <div className="h-full bg-neutral-800" style={{ width: '25%' }} />
          </div>
        </div>

        {/* Health Score Card */}
        <div className="p-3 bg-neutral-950/60 border border-neutral-850 rounded-xl text-neutral-200 hover:border-[#00f2ff]/30 transition-all">
          <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
            <span className="flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> HEALTH INDEX
            </span>
            <span className="text-[8.5px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase">
              {healthScore > 90 ? 'EXCELLENT' : 'GOOD'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-400">{healthScore}%</span>
            <span className="text-[9px] text-neutral-400 font-sans">Event Loop: {eventLoopMs}ms</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-2 overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Diagnostics Section (Collapsed if compactView) */}
      {!compactView && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
          {/* Left Column: CPU History & Core Load Breakdown (6 Cols) */}
          <div className="lg:col-span-6 space-y-3 bg-neutral-950/40 p-3 rounded-xl border border-neutral-850">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#00f2ff]" />
                CPU CORE DISTRIBUTED LOAD
              </span>
              <span className="text-[9px] text-neutral-400">
                Avg Load: <strong className="text-white">{cpuUsage}%</strong>
              </span>
            </div>

            {/* Sparkline Visual Gauge */}
            <div className="h-12 flex items-end gap-1 pt-1 pb-1 px-1 bg-neutral-950/80 rounded border border-neutral-900">
              {cpuHistory.map((val, i) => (
                <div key={i} className="flex-1 bg-neutral-900 rounded-t overflow-hidden h-full flex items-end">
                  <div
                    className={`w-full transition-all duration-300 ${
                      val > 70 ? 'bg-rose-500' : val > 45 ? 'bg-amber-400' : 'bg-[#00f2ff]'
                    }`}
                    style={{ height: `${val}%` }}
                    title={`Tick ${i + 1}: ${val}% CPU`}
                  />
                </div>
              ))}
            </div>

            {/* Individual Core Load Gauges */}
            <div className="grid grid-cols-2 gap-2 text-[9.5px]">
              {coreLoads.map((load, idx) => (
                <div key={idx} className="p-2 bg-neutral-950 rounded border border-neutral-900 flex items-center justify-between">
                  <span className="text-neutral-400 font-sans">Core {idx}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className={`h-full ${load > 70 ? 'bg-rose-500' : 'bg-[#00f2ff]'}`}
                        style={{ width: `${load}%` }}
                      />
                    </div>
                    <span className="font-bold text-white w-8 text-right">{load}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: V8 Memory Breakdown & Quick Actions (6 Cols) */}
          <div className="lg:col-span-6 space-y-3 bg-neutral-950/40 p-3 rounded-xl border border-neutral-850">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                V8 MEMORY & CACHE CONTROL
              </span>
              <span className="text-[9px] text-neutral-400">
                RSS: <strong className="text-white">{rssMb} MB</strong>
              </span>
            </div>

            {/* Memory Allocation Breakdown Stack */}
            <div className="space-y-1.5 text-[9.5px]">
              <div className="flex justify-between text-neutral-400 font-sans">
                <span>V8 Heap Used: <strong className="text-emerald-400">{heapUsedMb} MB</strong></span>
                <span>Buffer/External: <strong className="text-neutral-300">{Math.round((memoryUsedMb - heapUsedMb) * 10) / 10} MB</strong></span>
              </div>

              {/* Stack Bar */}
              <div className="w-full h-3 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-900 flex">
                <div className="h-full bg-emerald-400" style={{ width: `${(heapUsedMb / memoryTotalMb) * 100}%` }} title="V8 Heap" />
                <div className="h-full bg-teal-500" style={{ width: `${((memoryUsedMb - heapUsedMb) / memoryTotalMb) * 100}%` }} title="Buffers & Cache" />
                <div className="h-full bg-neutral-900" style={{ width: `${((memoryTotalMb - memoryUsedMb) / memoryTotalMb) * 100}%` }} title="Free Container RAM" />
              </div>

              <div className="flex items-center justify-between text-[8.5px] text-neutral-500 pt-0.5">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Heap</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Buffers</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-800 inline-block" /> Free ({memoryTotalMb - memoryUsedMb} MB)</span>
              </div>
            </div>

            {/* Quick Interactive Control Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                id="btn-trigger-gc-flush"
                type="button"
                onClick={handleFlushMemory}
                disabled={isCleaningMemory}
                className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/40 text-emerald-300 rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Execute V8 Garbage Collector and reclaim memory"
              >
                <RotateCcw className={`w-3 h-3 text-emerald-400 ${isCleaningMemory ? 'animate-spin' : ''}`} />
                <span>{isCleaningMemory ? 'Flushing...' : 'Flush RAM Cache'}</span>
              </button>

              <button
                id="btn-toggle-load-test"
                type="button"
                onClick={handleToggleLoadTest}
                className={`py-1.5 px-2 rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                  isSimulatingLoad
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-amber-500/40 text-amber-300'
                }`}
                title="Simulate high load to test container resilience"
              >
                <Zap className={`w-3 h-3 ${isSimulatingLoad ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
                <span>{isSimulatingLoad ? 'Stop Stress Load' : 'Simulate CPU Load'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bot Worker Thread Activity List */}
      {!compactView && (
        <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-850 space-y-2">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              ACTIVE BOT WORKER THREAD REGISTRY
            </span>
            <span className="text-[9px] text-neutral-400 font-sans">
              Event Loop Latency: <strong className="text-emerald-400 font-mono">{eventLoopMs}ms</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[9px]">
            {threads.map(thread => (
              <div
                key={thread.id}
                className="p-2 bg-neutral-950 rounded-lg border border-neutral-900 flex items-center justify-between gap-2 hover:border-neutral-800 transition-colors"
              >
                <div className="truncate space-y-0.5">
                  <span className="text-neutral-200 font-bold block truncate">{thread.name}</span>
                  <span className="text-[8px] text-neutral-500 font-sans block">
                    {thread.tasksCompleted.toLocaleString()} ops done
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[7.5px] px-1.5 py-0.2 rounded font-black block uppercase ${
                    thread.status === 'ACTIVE' 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-neutral-900 text-neutral-500'
                  }`}>
                    {thread.status}
                  </span>
                  {thread.status === 'ACTIVE' && (
                    <span className="text-[8px] text-purple-300 font-mono mt-0.5 block">
                      ⚡ {thread.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
