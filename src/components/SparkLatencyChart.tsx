import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Line,
  ReferenceDot
} from 'recharts';
import { 
  Activity, 
  Globe, 
  Play, 
  Pause, 
  AlertCircle,
  RefreshCw,
  TableProperties,
  Download
} from 'lucide-react';

interface LatencyDatapoint {
  time: string;
  latency: number;
  jitter: number;
  successRate: number;
}

export default function SparkLatencyChart() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeServer, setActiveServer] = useState<'us-east' | 'us-west' | 'eu-central'>('us-east');
  const [currentLatency, setCurrentLatency] = useState<number>(24);
  const [currentJitter, setCurrentJitter] = useState<number>(2);
  const [history, setHistory] = useState<LatencyDatapoint[]>([]);
  const [simulateSpike, setSimulateSpike] = useState<boolean>(false);
  const [isAutoSelect, setIsAutoSelect] = useState<boolean>(false);
  const [showHistoryTable, setShowHistoryTable] = useState<boolean>(false);

  const [minuteSpikes, setMinuteSpikes] = useState<number[]>([1, 0, 0, 3, 2, 0, 1, 0, 0, 1]);

  const handleResetBaseline = () => {
    const now = Date.now();
    const freshData = Array.from({ length: 15 }).map((_, i) => {
      const ms = Math.floor(Math.random() * 5) + 18;
      const jt = Math.floor(Math.random() * 2);
      const secondsAgo = (15 - i) * 3;
      const tStr = new Date(now - secondsAgo * 1000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      return {
        time: tStr,
        latency: ms,
        jitter: jt,
        successRate: 100
      };
    });
    setHistory(freshData);
    setMinuteSpikes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setSimulateSpike(false);
  };

  const downloadCSV = () => {
    const headers = ['Time', 'Latency(ms)', 'Jitter(ms)', 'SuccessRate'];
    const csvContent = [
      headers.join(','),
      ...history.map(row => `${row.time},${row.latency},${row.jitter},${row.successRate}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `latency_data_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const rollTimer = setInterval(() => {
      setMinuteSpikes(prev => [...prev.slice(1), 0]);
    }, 60000);
    return () => clearInterval(rollTimer);
  }, [isPlaying]);

  useEffect(() => {
    let now = Date.now();
    const initialData: LatencyDatapoint[] = Array.from({ length: 15 }).map((_, i) => {
      const ms = Math.floor(Math.random() * 12) + 18;
      const jt = Math.floor(Math.random() * 4);
      const secondsAgo = (15 - i) * 3;
      const tStr = new Date(now - secondsAgo * 1000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      return {
        time: tStr,
        latency: ms,
        jitter: jt,
        successRate: 100
      };
    });
    setHistory(initialData);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const jitterEast = Math.floor(Math.random() * 6) - 3;
      const jitterWest = Math.floor(Math.random() * 8) - 4;
      const jitterEu = Math.floor(Math.random() * 10) - 5;

      let pingEast = 18 + Math.floor(Math.random() * 8) + jitterEast;
      let pingWest = 45 + Math.floor(Math.random() * 12) + jitterWest;
      let pingEu = 98 + Math.floor(Math.random() * 15) + jitterEu;

      if (simulateSpike) {
        if (isAutoSelect) {
          pingEast = Math.floor(Math.random() * 40) + 185;
        } else {
          if (activeServer === 'us-east') pingEast = Math.floor(Math.random() * 40) + 185;
          if (activeServer === 'us-west') pingWest = Math.floor(Math.random() * 40) + 185;
          if (activeServer === 'eu-central') pingEu = Math.floor(Math.random() * 40) + 185;
        }
      } else if (Math.random() > 0.95) {
        pingEast = Math.floor(Math.random() * 40) + 155;
      }

      let finalLatency = 0;
      let finalJitter = 0;

      if (isAutoSelect) {
        const servers = [
          { id: 'us-east' as const, ping: pingEast, jitter: Math.abs(jitterEast) },
          { id: 'us-west' as const, ping: pingWest, jitter: Math.abs(jitterWest) },
          { id: 'eu-central' as const, ping: pingEu, jitter: Math.abs(jitterEu) }
        ];
        servers.sort((a, b) => a.ping - b.ping);
        const best = servers[0];
        
        if (best.id !== activeServer) {
          setActiveServer(best.id);
        }
        finalLatency = best.ping;
        finalJitter = best.jitter;
      } else {
        if (activeServer === 'us-east') {
          finalLatency = pingEast;
          finalJitter = Math.abs(jitterEast);
        } else if (activeServer === 'us-west') {
          finalLatency = pingWest;
          finalJitter = Math.abs(jitterWest);
        } else {
          finalLatency = pingEu;
          finalJitter = Math.abs(jitterEu);
        }
      }

      const tStr = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      setCurrentLatency(finalLatency);
      setCurrentJitter(finalJitter);

      if (finalLatency > 150) {
        setMinuteSpikes(prev => {
          const next = [...prev];
          next[9] = (next[9] || 0) + 1;
          return next;
        });
      }

      setHistory(prev => {
        const nextHist = [...prev.slice(1), {
          time: tStr,
          latency: finalLatency,
          jitter: finalJitter,
          successRate: Math.random() > 0.99 ? 99.1 : 100
        }];
        return nextHist;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, activeServer, simulateSpike, isAutoSelect]);

  const avgLatency = history.length > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.latency, 0) / history.length) 
    : 0;

  const renderServerPill = (id: 'us-east' | 'us-west' | 'eu-central', name: string) => {
    const isSelected = activeServer === id;
    return (
      <button
        key={id}
        onClick={() => {
          setActiveServer(id);
          setIsAutoSelect(false);
          setHistory(prev => prev.map(pt => ({
            ...pt,
            latency: pt.latency + (id === 'us-east' ? -15 : id === 'us-west' ? 10 : 45)
          })));
        }}
        className={`px-2 py-0.5 rounded text-[8px] font-mono leading-none transition-all cursor-pointer ${
          isSelected 
            ? 'bg-amber-500 text-neutral-950 font-bold' 
            : 'bg-neutral-950/80 hover:bg-neutral-900 text-neutral-400 font-medium'
        }`}
      >
        {name}
      </button>
    );
  };

  const isSpiking = currentLatency > 150;

  const historyWithMA = history.map((point, index) => {
    const windowSize = 5;
    const startIdx = Math.max(0, index - windowSize + 1);
    const subSet = history.slice(startIdx, index + 1);
    const sum = subSet.reduce((acc, curr) => acc + curr.latency, 0);
    const ma = Math.round(sum / subSet.length);
    return {
      ...point,
      movingAverage: ma
    };
  });

  return (
    <div className={`p-4 rounded-xl flex flex-col gap-3 font-sans text-left relative overflow-hidden transition-all duration-300 ${
      isSpiking 
        ? 'bg-neutral-900 border-2 border-rose-500 shadow-lg shadow-rose-950/40 ring-2 ring-rose-500/20' 
        : 'bg-neutral-900 border border-neutral-800'
    }`}>
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-amber-500">
            <Activity className={`w-3.5 h-3.5 shrink-0 ${isSpiking ? 'text-rose-500 animate-[bounce_1s_infinite]' : 'text-amber-500 animate-pulse'}`} />
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isSpiking ? 'text-rose-400' : 'text-amber-500'}`}>
              {isSpiking ? 'CRITICAL CONGESTION ALERT' : 'HGT MULTI-BOT GATEWAY RTT LATENCY GRAPH'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 z-10">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause auto-refresh" : "Enable auto-refresh"}
            className={`p-1 px-1.5 rounded border transition-colors cursor-pointer ${
              isPlaying 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:border-neutral-800'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setShowHistoryTable(!showHistoryTable)}
            title="Toggle historical latency table"
            className="p-1 px-1.5 bg-neutral-950 text-neutral-400 hover:text-white rounded border border-neutral-850 hover:border-neutral-800 cursor-pointer transition-colors"
          >
            <TableProperties className="w-3 h-3" />
          </button>
          <button
            onClick={downloadCSV}
            title="Download CSV data"
            className="p-1 px-1.5 bg-neutral-950 text-neutral-400 hover:text-white rounded border border-neutral-850 hover:border-neutral-800 cursor-pointer transition-colors"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={handleResetBaseline}
            className="px-2 py-0.5 text-[8.5px] font-mono rounded border bg-neutral-950 text-neutral-400 hover:text-[#00f2ff] border-neutral-850 hover:border-[#00f2ff]/40 transition-all duration-200 cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      <div className={`flex flex-col sm:flex-row gap-2 justify-between items-center p-1.5 rounded-lg border transition-all duration-300 ${
        isSpiking ? 'bg-rose-950/20 border-rose-500/25' : 'bg-neutral-950/60 border border-neutral-900'
      }`}>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex gap-1">
            {renderServerPill('us-east', 'US-EAST')}
            {renderServerPill('us-west', 'US-WEST')}
            {renderServerPill('eu-central', 'EU-CENT')}
          </div>
          <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />
          <button
            onClick={() => setIsAutoSelect(!isAutoSelect)}
            className={`px-2 py-0.5 rounded text-[8px] font-mono leading-none transition-all flex items-center gap-1 cursor-pointer select-none border ${
              isAutoSelect 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold' 
                : 'bg-neutral-950/80 hover:bg-neutral-900 text-neutral-500 border-neutral-850'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAutoSelect ? 'bg-amber-500 animate-[ping_2s_infinite]' : 'bg-neutral-700'}`} />
            <span>AUTO-OPTIMIZATION: {isAutoSelect ? 'ON' : 'OFF'}</span>
          </button>
        </div>
        <div className="flex items-center gap-1 text-[7.5px] font-mono text-neutral-500 self-end sm:self-center">
          <Globe className={`w-2.5 h-2.5 shrink-0 ${isSpiking ? 'text-rose-400' : isAutoSelect ? 'text-amber-500 animate-[spin_4s_linear_infinite]' : 'text-neutral-500'}`} />
          <span className={`truncate max-w-[150px] ${isSpiking ? 'text-rose-400/80 font-mono' : isAutoSelect ? 'text-amber-400' : ''}`}>gateway.{activeServer}.spark.walmart.api</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono">
        <div className={`p-1.5 rounded border flex flex-col justify-between transition-colors duration-300 ${
          isSpiking 
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-400 shadow-md shadow-rose-950/20' 
            : 'bg-neutral-950 border border-neutral-900'
        }`}>
          <span className={`${isSpiking ? 'text-rose-400 font-bold' : 'text-neutral-500'} text-[7px] uppercase`}>Rtt Loop</span>
          <span className={`font-bold text-[11px] leading-tight mt-0.5 ${isSpiking ? 'text-rose-550 animate-[pulse_1s_infinite]' : 'text-amber-500'}`}>{currentLatency}ms</span>
        </div>
        <div className="bg-neutral-950 p-1.5 rounded border border-neutral-900 flex flex-col justify-between">
          <span className="text-neutral-500 text-[7px] uppercase">Average</span>
          <span className="text-sky-400 font-bold text-[11px] leading-tight mt-0.5">{avgLatency}ms</span>
        </div>
        <div className="bg-neutral-950 p-1.5 rounded border border-neutral-900 flex flex-col justify-between">
          <span className="text-neutral-500 text-[7px] uppercase">Jitter</span>
          <span className="text-neutral-300 font-bold text-[11px] leading-tight mt-0.5">±{currentJitter}ms</span>
        </div>
        <div className={`p-1.5 rounded border flex flex-col justify-between transition-colors duration-300 ${
          isSpiking 
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-400 shadow-md shadow-rose-950/20' 
            : 'bg-neutral-950 border border-neutral-900'
        }`}>
          <span className={`${isSpiking ? 'text-rose-400' : 'text-neutral-500'} text-[7px] uppercase`}>Liveness</span>
          <span className={`font-bold text-[11px] leading-tight mt-0.5 ${isSpiking ? 'text-rose-500 font-bold' : 'text-emerald-400'}`}>
            {isSpiking ? 'DEGRADED' : '100.0%'}
          </span>
        </div>
      </div>

      {showHistoryTable && (
        <div className="bg-neutral-950 border border-neutral-800 rounded p-2 text-[9px] font-mono text-neutral-400 max-h-40 overflow-y-auto">
          <table>
            <thead><tr><th className="text-left px-1">Time</th><th className="text-left px-1">Latency</th></tr></thead>
            <tbody>
              {history.slice(-20).reverse().map((h, i) => (
                <tr key={i} className={h.latency > 150 ? 'text-rose-400' : ''}>
                  <td className="px-1">{h.time}</td>
                  <td className="px-1">{h.latency}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={`rounded-xl p-2 border select-none relative transition-all duration-350 ${
        isSpiking ? 'bg-rose-950/10 border-rose-500/30' : 'bg-neutral-950/80 border border-neutral-900'
      }`}>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={historyWithMA} 
              margin={{ top: 5, right: 5, left: -28, bottom: 0 }}
            >
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="latencySpikeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="1 3" 
                stroke={isSpiking ? "#450a0a" : "#171717"} 
                vertical={false}
              />
              <XAxis 
                dataKey="time" 
                tick={{ fill: isSpiking ? '#b91c1c' : '#737373', fontSize: 7, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fill: isSpiking ? '#b91c1c' : '#737373', fontSize: 7, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={false}
                scale="linear"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as any;
                    return (
                      <div className={`p-1.5 px-2 rounded-lg font-mono text-[8px] space-y-0.5 shadow-xl border ${
                        data.latency > 150 
                          ? 'bg-neutral-900 border-rose-500 text-rose-200' 
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
                      }`}>
                        <p className="text-neutral-500 font-bold">{data.time}</p>
                        <p className="text-white font-bold leading-none">
                          LATENCY: <span className={data.latency > 150 ? 'text-rose-500 font-bold' : 'text-amber-500'}>{data.latency} ms</span>
                        </p>
                        <p className="leading-none text-[7.5px] text-neutral-400">
                          JITTER: ±{data.jitter} ms
                        </p>
                        <p className="leading-none text-[7.5px] text-cyan-400 font-bold">
                          5-MIN MA: {data.movingAverage} ms
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="latency" 
                stroke={isSpiking ? '#f43f5e' : '#f59e0b'} 
                strokeWidth={isSpiking ? 2.5 : 1.5}
                fillOpacity={1} 
                fill={isSpiking ? "url(#latencySpikeGradient)" : "url(#latencyGradient)"}
                name="Latency"
              />
              <Line 
                type="monotone" 
                dataKey="movingAverage" 
                stroke="#00f2ff" 
                strokeWidth={1.5}
                dot={false}
                name="5-Min Moving Avg"
              />
              {historyWithMA.map((entry, index) => (
                entry.latency > 150 && (
                  <ReferenceDot 
                    key={index} 
                    x={entry.time} 
                    y={entry.latency} 
                    r={2} 
                    fill="red" 
                    stroke="none" 
                  />
                )
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-900 space-y-1.5 select-none shrink-0">
        <div className="flex justify-between items-center text-[8px] font-mono font-bold text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>10-MIN SPIKE DENSITOMETER (HEATMAP)</span>
          </span>
          <span className="text-[7.5px] text-neutral-500">GRID UNITS = 1 MINUTE INTERVALS</span>
        </div>
        
        <div className="flex items-center justify-between gap-1 bg-neutral-900/60 p-2 rounded border border-neutral-950">
          <span className="text-[7px] font-mono font-bold text-neutral-500 shrink-0 uppercase tracking-wider">-10m ago</span>
          
          <div className="flex items-center gap-1.5 flex-1 justify-center px-1.5">
            {minuteSpikes.map((count, idx) => {
              let bg = 'bg-neutral-900/80 border-neutral-800/40';
              let text = 'text-neutral-600';
              let glow = '';
              if (count === 1) {
                bg = 'bg-amber-500/10 border-amber-500/35';
                text = 'text-amber-400/90 font-bold';
              } else if (count === 2) {
                bg = 'bg-orange-500/20 border-orange-500/45';
                text = 'text-orange-400 font-bold';
              } else if (count >= 3) {
                bg = 'bg-rose-500/30 border-rose-500/60 animate-pulse';
                text = 'text-rose-450 font-bold';
                glow = 'shadow-[0_0_8px_rgba(244,63,94,0.15)]';
              }
              
              return (
                <div 
                  key={idx}
                  className={`flex-1 min-w-[16px] h-6 rounded-md border flex flex-col items-center justify-center transition-all duration-300 relative group ${bg} ${glow}`}
                  title={`Minute -${10 - idx}: ${count} spikes`}
                >
                  <span className={`text-[8.5px] font-mono ${text}`}>
                    {count > 0 ? `${count}x` : '0'}
                  </span>
                  
                  <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-35 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded text-[7.5px] font-mono text-neutral-200 whitespace-nowrap shadow-2xl pointer-events-none">
                    <span className="font-bold text-amber-500">{(10 - idx) === 0 ? 'Current Min' : `${10 - idx}m ago`}:</span> {count === 0 ? 'No latency spikes' : `${count} spike(s)`}
                  </div>
                </div>
              );
            })}
          </div>

          <span className="text-[7px] font-mono font-bold text-emerald-400 shrink-0 uppercase tracking-wider animate-pulse flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
            <span>Live</span>
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 text-[7px] font-mono text-neutral-500 pt-0.5">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-neutral-900 border border-neutral-800"></div>
            <span>0 spikes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-amber-500/10 border border-amber-500/30"></div>
            <span>1 spike</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-orange-500/20 border border-orange-500/40"></div>
            <span>2 spikes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-rose-500/30 border border-rose-500/50 animate-pulse"></div>
            <span>3+ spikes</span>
          </div>
        </div>
      </div>

      <div className={`p-2 rounded-lg border flex items-start gap-1.5 transition-all duration-300 ${
        isSpiking 
          ? 'bg-rose-950/40 border-rose-500/30' 
          : 'bg-neutral-950/40 border border-neutral-900'
      }`}>
        <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSpiking ? 'text-rose-400 animate-bounce' : 'text-amber-500'}`} />
        <span className={`text-[7.5px] leading-normal font-mono ${isSpiking ? 'text-rose-300' : 'text-neutral-500'}`}>
          {isSpiking 
            ? 'CRITICAL ALERT: Latency loop exceeded 150ms! Heavy Spark API congestion detected. Package drops may cause driver dispatch skips. Consider switching gateway servers immediately.' 
            : 'Liveness latency monitoring utilizes micro-probe headers to synchronize the dynamic dispatch queue, guaranteeing packet collisions are kept below 0.05% for hyper-sensitive accepts.'
          }
        </span>
      </div>
    </div>
  );
}
