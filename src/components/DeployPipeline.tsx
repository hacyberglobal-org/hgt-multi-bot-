import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Github, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Terminal, 
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  GitBranch,
  Search,
  Server,
  Activity,
  GitCommit,
  UploadCloud,
  KeyRound,
  Link,
  Copy,
  Check,
  Lock
} from 'lucide-react';

interface DeployPipelineProps {
  activeDomain: string;
  onAddLog: (type: any, message: string, offerId?: string, badge?: string) => void;
}

type PipelineStep = {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  logs: string[];
};

interface GitRepoStatus {
  initialized: boolean;
  branch: string;
  lastCommit: string;
  commitCount: number;
  dirty: boolean;
  uncommittedChanges: number;
  remoteUrl: string | null;
  userEmail: string;
  userName: string;
}

export default function DeployPipeline({ activeDomain, onAddLog }: DeployPipelineProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: 'trigger', name: 'Trigger GitHub Action', status: 'idle', logs: [] },
    { id: 'build', name: 'Build Container Image', status: 'idle', logs: [] },
    { id: 'test', name: 'Security & Integrity Scan', status: 'idle', logs: [] },
    { id: 'push', name: 'Push to Cloud Run Registry', status: 'idle', logs: [] },
    { id: 'cname', name: 'Verify CNAME Mapping', status: 'idle', logs: [] },
    { id: 'propagation', name: 'Global DNS Propagation', status: 'idle', logs: [] },
    { id: 'activation', name: 'Final Service Activation', status: 'idle', logs: [] },
  ]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [globalLogs, setGlobalLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Live Git Repo Push State
  const [gitStatus, setGitStatus] = useState<GitRepoStatus | null>(null);
  const [gitRemoteInput, setGitRemoteInput] = useState('');
  const [gitTokenInput, setGitTokenInput] = useState('');
  const [commitMessageInput, setCommitMessageInput] = useState('');
  const [isPushingGit, setIsPushingGit] = useState(false);
  const [isCommittingGit, setIsCommittingGit] = useState(false);
  const [gitFeedback, setGitFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchGitStatus = async () => {
    try {
      const res = await fetch('/api/git/status');
      if (res.ok) {
        const data = await res.json();
        setGitStatus(data);
        if (data.remoteUrl && !gitRemoteInput) {
          setGitRemoteInput(data.remoteUrl);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Git status:', err);
    }
  };

  useEffect(() => {
    fetchGitStatus();
    const timer = setInterval(fetchGitStatus, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveRemote = async () => {
    if (!gitRemoteInput.trim()) {
      setGitFeedback({ type: 'error', message: 'Please enter a valid Git repository URL.' });
      return;
    }
    try {
      const res = await fetch('/api/git/remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl: gitRemoteInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setGitFeedback({ type: 'success', message: 'Remote origin updated to: ' + gitRemoteInput.trim() });
        onAddLog('info', `🔗 GIT REMOTE: Origin configured -> ${gitRemoteInput.trim()}`, undefined, 'GIT_REMOTE');
        fetchGitStatus();
      } else {
        setGitFeedback({ type: 'error', message: data.error || 'Failed to update remote.' });
      }
    } catch (err: any) {
      setGitFeedback({ type: 'error', message: err.message || 'Network error updating remote.' });
    }
  };

  const handleCommitChanges = async () => {
    setIsCommittingGit(true);
    setGitFeedback(null);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessageInput.trim() || undefined })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setGitFeedback({ type: 'success', message: `Committed: ${data.lastCommit}` });
        setCommitMessageInput('');
        onAddLog('info', `💾 GIT COMMIT: ${data.lastCommit}`, undefined, 'GIT_COMMIT');
        fetchGitStatus();
      } else {
        setGitFeedback({ type: 'error', message: data.error || 'Commit failed.' });
      }
    } catch (err: any) {
      setGitFeedback({ type: 'error', message: err.message || 'Error executing git commit.' });
    } finally {
      setIsCommittingGit(false);
    }
  };

  const handlePushToGit = async () => {
    setIsPushingGit(true);
    setGitFeedback(null);
    const targetRemote = gitRemoteInput.trim() || (gitStatus?.remoteUrl ?? '');

    if (!targetRemote) {
      setIsPushingGit(false);
      setGitFeedback({
        type: 'error',
        message: 'No remote repository URL set. Enter your GitHub repo URL (e.g., https://github.com/username/multi-bot.git) and PAT token.'
      });
      return;
    }

    onAddLog('info', `🚀 GIT PUSH: Initiating push to ${targetRemote}...`, undefined, 'GIT_PUSH');

    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remoteUrl: targetRemote,
          token: gitTokenInput.trim() || undefined,
          branch: gitStatus?.branch || 'main'
        })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setGitFeedback({
          type: 'success',
          message: `Successfully pushed to ${targetRemote} on branch '${gitStatus?.branch || 'main'}'!`
        });
        onAddLog('bot_accept', `✅ GIT PUSH SUCCESS: Repository synced to ${targetRemote}.`, undefined, 'GIT_PUSHED');
        fetchGitStatus();
      } else {
        setGitFeedback({
          type: 'error',
          message: data.error || 'Git push rejected. Ensure remote exists and valid Personal Access Token (PAT) is supplied.'
        });
        onAddLog('error', `❌ GIT PUSH FAILED: ${data.error || 'Auth/remote error'}`, undefined, 'GIT_ERR');
      }
    } catch (err: any) {
      setGitFeedback({
        type: 'error',
        message: err.message || 'Network error attempting Git push.'
      });
    } finally {
      setIsPushingGit(false);
    }
  };

  const startDeployment = async () => {
    if (isDeploying) return;
    setIsDeploying(true);
    setIsComplete(false);
    setCurrentStepIdx(0);
    setGlobalLogs([]);
    setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'idle', logs: [] })));

    onAddLog('info', `🚀 CI/CD PIPELINE: Initiating global deployment sequence for ${activeDomain}...`, undefined, 'DEPLOY_START');

    const runStep = async (idx: number) => {
      if (idx >= pipelineSteps.length) {
        setIsDeploying(false);
        setIsComplete(true);
        onAddLog('bot_accept', `✅ DEPLOYMENT SUCCESS: New build is LIVE at ${activeDomain}.`, undefined, 'DEPLOY_OK');
        return;
      }

      setPipelineSteps(prev => {
        const next = [...prev];
        next[idx].status = 'running';
        return next;
      });

      const step = pipelineSteps[idx];
      const mockLogs = [
        `[${step.name}] Initializing...`,
        `[${step.name}] Connecting to GitHub API...`,
        step.id === 'cname' ? `[${step.name}] Querying ghs.googlehosted.com for ${activeDomain}...` : `[${step.name}] Fetching latest commit 8a2f1b4...`,
        step.id === 'cname' ? `[${step.name}] CNAME Match Found: Target host verified.` : `[${step.name}] Processing payload...`,
        step.id === 'activation' ? `[${step.name}] Activating production clusters...` : `[${step.name}] Verification successful.`
      ];

      for (let i = 0; i < mockLogs.length; i++) {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
        setGlobalLogs(prev => [...prev, mockLogs[i]]);
        setPipelineSteps(prev => {
          const next = [...prev];
          next[idx].logs = [...next[idx].logs, mockLogs[i]];
          return next;
        });
      }

      setPipelineSteps(prev => {
        const next = [...prev];
        next[idx].status = 'completed';
        return next;
      });

      setCurrentStepIdx(idx + 1);
      runStep(idx + 1);
    };

    runStep(0);
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-left">
      {/* Header */}
      <div>
        <span className="text-[9px] font-mono text-neutral-500 block uppercase font-bold tracking-wider">Cloud CI/CD Pipeline Simulator</span>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[9.5px] text-neutral-400">
            Simulate an enterprise-grade GitHub Actions pipeline to push bot updates to your active custom domain.
          </p>
          <button
            onClick={startDeployment}
            disabled={isDeploying}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold transition-all ${
              isDeploying 
                ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 cursor-pointer'
            }`}
          >
            {isDeploying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isDeploying ? 'DEPLOYING...' : 'TRIGGER NEW BUILD'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pipeline Steps View */}
        <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-900 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-2">
            <Github className="w-4 h-4 text-white" />
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">GitHub Actions Workflow</span>
          </div>

          <div className="space-y-3">
            {pipelineSteps.map((step, idx) => (
              <div key={step.id} className="relative">
                {idx < pipelineSteps.length - 1 && (
                  <div className={`absolute left-3 top-6 w-0.5 h-6 transition-colors ${
                    step.status === 'completed' ? 'bg-emerald-500' : 'bg-neutral-800'
                  }`} />
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    step.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' :
                    step.status === 'running' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500 animate-pulse' :
                    'bg-neutral-900 border-neutral-800 text-neutral-600'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     step.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                     <span className="text-[10px] font-bold">{idx + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10.5px] font-mono font-bold uppercase ${
                        step.status === 'completed' ? 'text-emerald-400' :
                        step.status === 'running' ? 'text-cyan-400' :
                        'text-neutral-500'
                      }`}>{step.name}</span>
                      <span className="text-[8px] font-mono text-neutral-600">
                        {step.status === 'completed' ? 'SUCCESS' : step.status === 'running' ? 'IN_PROGRESS' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isComplete && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Build Integrated Globally</span>
              </div>
              <p className="text-[9px] text-neutral-400 leading-tight">
                All containers have been updated. The latest bot logic is now active for all authenticated clients on <span className="text-emerald-400">{activeDomain}</span>.
              </p>
              <button className="text-[9px] font-mono font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors">
                View Build Artifacts <ExternalLink className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Real-time Terminal Logs */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900 space-y-3 flex flex-col h-[340px]">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">Build Console</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-mono text-neutral-500 uppercase font-bold tracking-tighter">Live Stream</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 space-y-1 font-mono text-[9px] text-neutral-400">
            {globalLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-600 italic">
                Awaiting pipeline trigger...
              </div>
            ) : (
              globalLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-neutral-700 select-none">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <span className={log.includes('ERROR') ? 'text-rose-400' : log.includes('SUCCESS') ? 'text-emerald-400' : ''}>{log}</span>
                </div>
              ))
            )}
            <div id="logs-end" />
          </div>

          <div className="pt-2 border-t border-neutral-900 grid grid-cols-3 gap-2">
            <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800">
              <span className="text-[7px] text-neutral-500 uppercase block leading-none mb-1">Build ID</span>
              <span className="text-[9px] font-mono text-white font-bold">#ACTIONS-8291</span>
            </div>
            <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800">
              <span className="text-[7px] text-neutral-500 uppercase block leading-none mb-1">Target Cluster</span>
              <span className="text-[9px] font-mono text-white font-bold">US-EAST5</span>
            </div>
            <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800">
              <span className="text-[7px] text-neutral-500 uppercase block leading-none mb-1">Registry</span>
              <span className="text-[9px] font-mono text-white font-bold">GCR.IO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Status Bar */}
      <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-900 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[7px] text-neutral-500 uppercase font-bold">Pipeline Origin</span>
            <span className="text-[10px] font-mono text-white flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-cyan-400" /> {gitStatus?.branch || 'main'}
            </span>
          </div>
          <div className="w-px h-6 bg-neutral-900" />
          <div className="flex flex-col">
            <span className="text-[7px] text-neutral-500 uppercase font-bold">Compute Region</span>
            <span className="text-[10px] font-mono text-white flex items-center gap-1">
              <Server className="w-3 h-3 text-emerald-400" /> GCP-CLOUD-RUN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[7px] text-neutral-500 uppercase font-bold">System Load</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-mono text-white">0.42%</span>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase">Safe for Live</span>
          </div>
        </div>
      </div>

      {/* Connected Git Repository Sync & Push Controls */}
      <div className="bg-neutral-950 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(0,242,255,0.05)] space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-extrabold text-white uppercase tracking-wider">
                  Git Remote Repository Connector & Push Hub
                </span>
                <span className="text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                  LIVE GIT v2.34
                </span>
              </div>
              <p className="text-[9px] text-neutral-400">
                Synchronize, commit, and push full HGT Multi-Bot codebase directly to your connected remote repository (GitHub, GitLab, Cloudflare).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchGitStatus}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-800 text-[9px] font-mono transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Git</span>
          </button>
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-neutral-500 uppercase font-bold">Local Branch</span>
            <div className="flex items-center gap-1.5 mt-1">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-white">{gitStatus?.branch || 'main'}</span>
            </div>
          </div>

          <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-neutral-500 uppercase font-bold">Latest Commit</span>
            <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
              <GitCommit className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[9px] font-mono text-neutral-300 truncate" title={gitStatus?.lastCommit || 'N/A'}>
                {gitStatus?.lastCommit || 'feat: complete HGT Multi-Bot'}
              </span>
            </div>
          </div>

          <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-neutral-500 uppercase font-bold">Pending Changes</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${gitStatus?.dirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-mono font-bold text-white">
                {gitStatus?.dirty ? `${gitStatus.uncommittedChanges} files modified` : 'Working tree clean'}
              </span>
            </div>
          </div>

          <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
            <span className="text-[7.5px] font-mono text-neutral-500 uppercase font-bold">Connected Remote</span>
            <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
              <Link className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[9px] font-mono text-neutral-300 truncate" title={gitStatus?.remoteUrl || 'No remote origin set'}>
                {gitStatus?.remoteUrl || 'origin: none (set below)'}
              </span>
            </div>
          </div>
        </div>

        {/* Remote Origin & Push Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="space-y-2 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800">
            <label className="text-[8.5px] font-mono text-neutral-400 uppercase font-bold flex items-center gap-1">
              <Link className="w-3 h-3 text-cyan-400" />
              Remote Git Repository URL (HTTPS / SSH)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gitRemoteInput}
                onChange={(e) => setGitRemoteInput(e.target.value)}
                placeholder="https://github.com/hacybertech/multi-bot.git"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-[9.5px] font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleSaveRemote}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-white rounded border border-neutral-700 text-[9px] font-mono font-bold uppercase transition-colors shrink-0"
              >
                Set Origin
              </button>
            </div>
            <p className="text-[8px] text-neutral-500 font-mono">
              Example: https://github.com/YOUR_USERNAME/multi-bot.git
            </p>
          </div>

          <div className="space-y-2 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800">
            <label className="text-[8.5px] font-mono text-neutral-400 uppercase font-bold flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-amber-400" />
              GitHub Personal Access Token (PAT) (Optional for auth)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={gitTokenInput}
                onChange={(e) => setGitTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-[9.5px] font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
              />
              <span className="px-2 py-1.5 bg-neutral-950/60 border border-neutral-800 rounded text-[8px] font-mono text-neutral-500 flex items-center">
                <Lock className="w-2.5 h-2.5 mr-1 text-emerald-400" /> Encrypted
              </span>
            </div>
            <p className="text-[8px] text-neutral-500 font-mono">
              Required by GitHub when pushing over HTTPS without saved SSH credentials.
            </p>
          </div>
        </div>

        {/* Commit & Push Bar */}
        <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800 flex flex-col md:flex-row items-center gap-2 justify-between">
          <div className="w-full md:flex-1 flex items-center gap-2">
            <input
              type="text"
              value={commitMessageInput}
              onChange={(e) => setCommitMessageInput(e.target.value)}
              placeholder="Commit message (defaults to timestamped sync)..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-[9.5px] font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleCommitChanges}
              disabled={isCommittingGit}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 text-[9px] font-mono font-bold uppercase transition-colors shrink-0 flex items-center gap-1"
            >
              {isCommittingGit ? <RefreshCw className="w-3 h-3 animate-spin" /> : <GitCommit className="w-3 h-3" />}
              <span>Commit</span>
            </button>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <button
              type="button"
              id="git-push-origin-btn"
              onClick={handlePushToGit}
              disabled={isPushingGit}
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-neutral-950 font-mono font-extrabold text-[10px] uppercase shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPushingGit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-950" />
                  <span>PUSHING TO REPO...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-neutral-950" />
                  <span>PUSH TO GIT REPO CONNECTED</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {gitFeedback && (
          <div className={`p-2.5 rounded-lg border text-[9px] font-mono flex items-start gap-2 ${
            gitFeedback.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : gitFeedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          }`}>
            {gitFeedback.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider block">
                {gitFeedback.type === 'success' ? 'Git Sync OK' : 'Git Push Notice'}:
              </span>
              <span className="whitespace-pre-wrap">{gitFeedback.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
