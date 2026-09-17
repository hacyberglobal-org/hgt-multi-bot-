import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FileText,
  Trash2,
  ExternalLink,
  Upload,
  RefreshCw,
  Search,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  LogOut,
  ShieldCheck,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  FileCheck,
  Plus
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  listDriveFiles,
  getDriveQuota,
  uploadTextFileToDrive,
  deleteDriveFile,
  DriveFileItem,
  DriveAboutQuota
} from '../lib/googleDriveService';

interface GoogleDriveIntegrationProps {
  systemLogs?: Array<any>;
  onLogEvent?: (type: 'info' | 'warning' | 'error', message: string, component?: string) => void;
}

export const GoogleDriveIntegration: React.FC<GoogleDriveIntegrationProps> = ({
  systemLogs = [],
  onLogEvent
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive Data State
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [quota, setQuota] = useState<DriveAboutQuota | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fileFilter, setFileFilter] = useState<'all' | 'docs' | 'sheets' | 'reports'>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Confirmation Modal for Destructive Operations (MANDATORY)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Create New File Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileContent, setNewFileContent] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Auto-clear transient status messages
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Auth listener initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, authedToken) => {
        setUser(authedUser);
        setToken(authedToken);
        setAuthError(null);
      },
      () => {
        setUser(null);
        setToken(null);
        setFiles([]);
        setQuota(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Drive Files and Quota
  const fetchDriveData = useCallback(async (accessToken: string, query?: string) => {
    setIsLoadingFiles(true);
    try {
      const [filesRes, quotaRes] = await Promise.all([
        listDriveFiles(accessToken, query),
        getDriveQuota(accessToken).catch(() => null)
      ]);
      setFiles(filesRes.files);
      if (quotaRes) setQuota(quotaRes);
      onLogEvent?.('info', `Fetched ${filesRes.files.length} Google Drive items`, 'GOOGLE_DRIVE');
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch Google Drive files.';
      setStatusMessage({ type: 'error', text: msg });
      onLogEvent?.('error', `Google Drive sync error: ${msg}`, 'GOOGLE_DRIVE');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [onLogEvent]);

  // Fetch data when token becomes available
  useEffect(() => {
    if (token) {
      fetchDriveData(token);
    }
  }, [token, fetchDriveData]);

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setStatusMessage({
          type: 'success',
          text: `Connected to Google Drive as ${res.user.displayName || res.user.email}!`
        });
        onLogEvent?.('info', `User authorized Google Drive session: ${res.user.email}`, 'GOOGLE_DRIVE');
      }
    } catch (err: any) {
      console.error('Sign-in failure:', err);
      const msg = err.message?.includes('popup-closed-by-user')
        ? 'Sign-in window was closed. Please try again.'
        : err.message || 'Authentication failed. Please check network and permissions.';
      setAuthError(msg);
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setFiles([]);
      setQuota(null);
      setStatusMessage({ type: 'info', text: 'Disconnected Google Drive account.' });
      onLogEvent?.('info', 'Google Drive session closed.', 'GOOGLE_DRIVE');
    } catch (e: any) {
      console.error('Logout error:', e);
    }
  };

  // Trigger File Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      fetchDriveData(token, searchQuery);
    }
  };

  // Backup System & Dispatch Logs to Google Drive
  const handleBackupLogsToDrive = async () => {
    if (!token) return;
    setIsUploading(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `HGT_Spark_Dispatch_Report_${timestamp}.json`;
      const reportPayload = {
        title: 'HACYBERGLOBATECH Dispatch & Lead Verification Report',
        timestamp: new Date().toISOString(),
        environment: 'AppDeploy Production (Project: 8808707299)',
        domains: [
          'https://web.hacyberglobal.dgdns.org/',
          'https://support.hacyberglobal.dgdns.org/'
        ],
        recentLogsCount: systemLogs.length,
        systemLogsSummary: systemLogs.slice(0, 50),
        exportedBy: user?.email || 'Authorized Operator'
      };

      const uploaded = await uploadTextFileToDrive(
        token,
        fileName,
        JSON.stringify(reportPayload, null, 2),
        'application/json'
      );

      setStatusMessage({
        type: 'success',
        text: `Successfully uploaded report "${uploaded.name}" to your Google Drive!`
      });
      onLogEvent?.('info', `Backup report saved to Google Drive: ${uploaded.name}`, 'GOOGLE_DRIVE');
      fetchDriveData(token, searchQuery);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload backup report.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Custom File Creation
  const handleCreateCustomFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFileName.trim()) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadTextFileToDrive(
        token,
        newFileName.trim(),
        newFileContent,
        newFileName.endsWith('.json') ? 'application/json' : 'text/plain'
      );
      setStatusMessage({
        type: 'success',
        text: `Created "${uploaded.name}" in your Google Drive!`
      });
      setIsUploadModalOpen(false);
      setNewFileName('');
      setNewFileContent('');
      fetchDriveData(token, searchQuery);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Creation failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Execute Confirmed File Deletion (Destructive Operation Handler)
  const handleConfirmDelete = async () => {
    if (!token || !fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(token, fileToDelete.id);
      setStatusMessage({
        type: 'success',
        text: `Deleted "${fileToDelete.name}" from Google Drive.`
      });
      onLogEvent?.('warning', `Deleted file from Drive: ${fileToDelete.name} (${fileToDelete.id})`, 'GOOGLE_DRIVE');
      setFileToDelete(null);
      fetchDriveData(token, searchQuery);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete file.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format File Size
  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
    return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format Storage Quota
  const formatQuotaPercent = () => {
    if (!quota?.limit || !quota?.usage) return 0;
    const limit = parseInt(quota.limit, 10);
    const usage = parseInt(quota.usage, 10);
    if (isNaN(limit) || isNaN(usage) || limit === 0) return 0;
    return Math.min(Math.round((usage / limit) * 100), 100);
  };

  // Filter Files
  const filteredFiles = files.filter((f) => {
    if (fileFilter === 'docs') {
      return f.mimeType.includes('document') || f.mimeType.includes('text');
    }
    if (fileFilter === 'sheets') {
      return f.mimeType.includes('spreadsheet') || f.mimeType.includes('csv');
    }
    if (fileFilter === 'reports') {
      return f.name.toLowerCase().includes('report') || f.name.toLowerCase().includes('log') || f.name.endsWith('.json');
    }
    return true;
  });

  // Icon helper based on MIME type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="w-5 h-5 text-amber-400" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('code')) return <FileCode className="w-5 h-5 text-cyan-400" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="w-full space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <HardDrive className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Google Drive Integration</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  OAuth Verified
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Access, store, and manage delivery receipts, daily dispatch logs, and driver documentation securely on Google Drive with user permission.
              </p>
            </div>
          </div>

          {/* Connect / User Info Section */}
          <div className="flex items-center gap-3">
            {!user ? (
              <button
                id="gsi-drive-signin-btn"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1f1f1f',
                  border: '1px solid #747775',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  cursor: isAuthenticating ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  fontFamily: 'Roboto, arial, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'background-color .218s, border-color .218s, box-shadow .218s'
                }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="gsi-material-button-icon" style={{ marginRight: '10px', height: '20px', width: '20px' }}>
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block', width: '20px', height: '20px' }}
                    >
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isAuthenticating ? 'Connecting to Drive...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Account'}
                    className="w-8 h-8 rounded-full border border-slate-600 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left leading-tight pr-2">
                  <div className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {user.displayName || 'Drive User'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                    {user.email}
                  </div>
                </div>
                <button
                  id="drive-signout-btn"
                  onClick={handleSignOut}
                  title="Sign out of Google Drive"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Storage Quota Bar */}
        {user && quota && (
          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div>
              <div className="flex justify-between mb-1">
                <span>Google Drive Storage Quota</span>
                <span className="text-white font-medium">{formatQuotaPercent()}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    formatQuotaPercent() > 85 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${formatQuotaPercent()}%` }}
                ></div>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Space Used:</span>{' '}
              <span className="text-white font-medium">{formatFileSize(quota.usage)}</span>
              {quota.limit && (
                <> / <span className="text-slate-400">{formatFileSize(quota.limit)}</span></>
              )}
            </div>
            <div>
              <span className="text-slate-500">Trash Bin Usage:</span>{' '}
              <span className="text-white font-medium">{formatFileSize(quota.usageInDriveTrash)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Notifications / Status Feedback */}
      {statusMessage && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {statusMessage.type === 'info' && <Cloud className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Auth error fallback message */}
      {authError && !statusMessage && (
        <div className="px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Main Drive Controls & Workspace Table */}
      {!user ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
            <Cloud className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white">Connect Your Google Account</h3>
            <p className="text-sm text-slate-400 mt-1">
              Authenticate via the official Google Sign-In prompt to view your Drive documents, export delivery logs, and store proof of payment receipts directly in your cloud storage.
            </p>
          </div>
          <button
            id="gsi-drive-main-btn"
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-sm transition-colors text-sm inline-flex items-center gap-2"
          >
            {isAuthenticating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
            {isAuthenticating ? 'Authorizing Session...' : 'Authenticate Google Drive'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="drive-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files in Google Drive..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFileFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    fileFilter === 'all' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({files.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFileFilter('reports')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    fileFilter === 'reports' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Reports / Logs
                </button>
                <button
                  type="button"
                  onClick={() => setFileFilter('docs')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    fileFilter === 'docs' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Docs
                </button>
                <button
                  type="button"
                  onClick={() => setFileFilter('sheets')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    fileFilter === 'sheets' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sheets
                </button>
              </div>

              {/* Refresh */}
              <button
                id="drive-refresh-btn"
                type="button"
                onClick={() => fetchDriveData(token!, searchQuery)}
                disabled={isLoadingFiles}
                title="Refresh Drive Files"
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              </button>

              {/* Create/Upload Note */}
              <button
                id="drive-create-note-btn"
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Document
              </button>

              {/* Backup Logs to Drive */}
              <button
                id="drive-backup-logs-btn"
                type="button"
                onClick={handleBackupLogsToDrive}
                disabled={isUploading}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Backup Logs to Drive
              </button>
            </div>
          </div>

          {/* Files List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {isLoadingFiles ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-sm">Connecting to Google Drive...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-white text-sm font-medium">No files found</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `No files matching "${searchQuery}". Clear your search query to view all items.`
                    : 'Your Google Drive has no files in this view or none match the active filter. Click "Backup Logs to Drive" or "New Document" to create a file.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">File Name</th>
                      <th className="py-3 px-4 font-semibold hidden md:table-cell">MIME Type</th>
                      <th className="py-3 px-4 font-semibold">Size</th>
                      <th className="py-3 px-4 font-semibold hidden sm:table-cell">Last Modified</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {getFileIcon(file.mimeType)}
                            <div className="truncate max-w-[200px] sm:max-w-[320px] font-medium text-slate-200">
                              {file.name}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 hidden md:table-cell truncate max-w-[160px]">
                          {file.mimeType.replace('application/', '').replace('vnd.google-apps.', '')}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">
                          {file.modifiedTime
                            ? new Date(file.modifiedTime).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in Google Drive"
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors inline-block"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {/* Explicit Confirmation Trigger for Deletion */}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              title="Delete from Drive"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE OPERATION */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Confirm Google Drive Deletion</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This destructive operation requires explicit user confirmation.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
              <div className="text-slate-400">
                Target File: <span className="text-white font-medium break-all">{fileToDelete.name}</span>
              </div>
              <div className="text-slate-400">
                File ID: <span className="font-mono text-slate-300">{fileToDelete.id}</span>
              </div>
              <div className="text-slate-400">
                Size: <span className="text-slate-300">{formatFileSize(fileToDelete.size)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove this file from your personal Google Drive account? This action cannot be undone automatically.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-drive-file-btn"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW DOCUMENT / NOTE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Create New Document in Google Drive
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomFile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  File Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. Dallas_Route_Notes.txt or Driver_Summary.json"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  File Contents
                </label>
                <textarea
                  rows={6}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Enter notes, delivery checkpoints, or JSON logs here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !newFileName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {isUploading ? 'Uploading...' : 'Save to Google Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
