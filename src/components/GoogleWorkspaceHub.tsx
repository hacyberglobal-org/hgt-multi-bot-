import React, { useState, useEffect } from 'react';
import {
  Mail,
  FileSpreadsheet,
  FileText,
  Calendar as CalendarIcon,
  Presentation,
  CheckSquare,
  FileQuestion,
  Users,
  Database,
  ShieldCheck,
  RefreshCw,
  Send,
  Plus,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  LogOut,
  Sparkles,
  Info
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initWorkspaceAuth,
  signInWithGoogleWorkspace,
  workspaceSignOut,
  listGmailMessages,
  sendGmailMessage,
  listSpreadsheetFiles,
  getSpreadsheetDetails,
  appendSpreadsheetValues,
  listDocFiles,
  listCalendarEvents,
  createCalendarEvent,
  listPresentationFiles,
  listTasks,
  createWorkspaceTask,
  listFormFiles,
  listContacts,
} from '../lib/workspaceService.ts';

type ActiveWorkspaceTab = 'gmail' | 'sheets' | 'docs' | 'calendar' | 'slides' | 'tasks' | 'forms' | 'contacts' | 'cloudsql';

export const GoogleWorkspaceHub: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('gmail');
  const [loading, setLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Tab Data States
  const [emails, setEmails] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetDetails, setSheetDetails] = useState<any>(null);
  const [newRowData, setNewRowData] = useState<string>('Spark Offer, 18.50, 4.2 mi, Accepted');
  const [docs, setDocs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [cloudSqlProfile, setCloudSqlProfile] = useState<any>(null);
  const [cloudSqlLogs, setCloudSqlLogs] = useState<any[]>([]);

  // Compose Email Modal
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [confirmSendDialog, setConfirmSendDialog] = useState(false);

  // Add Calendar Event Modal
  const [eventSummary, setEventSummary] = useState('Walmart Spark Driver Shift');
  const [eventStart, setEventStart] = useState(new Date().toISOString().slice(0, 16));
  const [eventEnd, setEventEnd] = useState(new Date(Date.now() + 3600000 * 3).toISOString().slice(0, 16));

  // Add Task Input
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (authedUser, authedToken) => {
        setUser(authedUser);
        setToken(authedToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (token) {
      loadCurrentTabData();
    }
  }, [activeTab, token]);

  const loadCurrentTabData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (activeTab === 'gmail') {
        const msgs = await listGmailMessages(8);
        setEmails(msgs);
      } else if (activeTab === 'sheets') {
        const resp = await listSpreadsheetFiles(10);
        setSheets(resp.files || []);
      } else if (activeTab === 'docs') {
        const resp = await listDocFiles(10);
        setDocs(resp.files || []);
      } else if (activeTab === 'calendar') {
        const resp = await listCalendarEvents(10);
        setEvents(resp.items || []);
      } else if (activeTab === 'slides') {
        const resp = await listPresentationFiles(10);
        setSlides(resp.files || []);
      } else if (activeTab === 'tasks') {
        const resp = await listTasks('@default', 15);
        setTasks(resp.items || []);
      } else if (activeTab === 'forms') {
        const resp = await listFormFiles(10);
        setForms(resp.files || []);
      } else if (activeTab === 'contacts') {
        const resp = await listContacts(15);
        setContacts(resp.connections || []);
      } else if (activeTab === 'cloudsql') {
        await loadCloudSqlData();
      }
    } catch (err: any) {
      console.error('Error loading data for tab', activeTab, err);
      setStatusNotice({ type: 'error', message: err.message || 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const loadCloudSqlData = async () => {
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) return;

      const [profRes, logsRes] = await Promise.all([
        fetch('/api/user/profile', { headers: { Authorization: `Bearer ${idToken}` } }),
        fetch('/api/user/activity', { headers: { Authorization: `Bearer ${idToken}` } })
      ]);

      if (profRes.ok) {
        const data = await profRes.json();
        setCloudSqlProfile(data.profile);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setCloudSqlLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load Cloud SQL status:', err);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusNotice(null);
    try {
      const res = await signInWithGoogleWorkspace();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setStatusNotice({ type: 'success', message: `Connected as ${res.user.email}. Google Workspace APIs active.` });
      }
    } catch (err: any) {
      setStatusNotice({ type: 'error', message: err.message || 'Authentication failed' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await workspaceSignOut();
    setUser(null);
    setToken(null);
    setStatusNotice({ type: 'info', message: 'Signed out of Google Workspace' });
  };

  const handleSendEmailConfirmed = async () => {
    setConfirmSendDialog(false);
    if (!emailTo || !emailSubject || !emailBody) {
      setStatusNotice({ type: 'error', message: 'All email fields are required' });
      return;
    }
    setLoading(true);
    try {
      await sendGmailMessage(emailTo, emailSubject, emailBody);
      setStatusNotice({ type: 'success', message: `Email sent to ${emailTo}` });
      setShowComposeModal(false);
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
      loadCurrentTabData();
    } catch (err: any) {
      setStatusNotice({ type: 'error', message: err.message || 'Failed to send email' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalendarEvent = async () => {
    if (!eventSummary) return;
    setLoading(true);
    try {
      await createCalendarEvent({
        summary: eventSummary,
        description: 'Auto-scheduled from HGT BotGrabber Dispatch Engine',
        start: { dateTime: new Date(eventStart).toISOString() },
        end: { dateTime: new Date(eventEnd).toISOString() },
      });
      setStatusNotice({ type: 'success', message: `Calendar event "${eventSummary}" scheduled!` });
      loadCurrentTabData();
    } catch (err: any) {
      setStatusNotice({ type: 'error', message: err.message || 'Failed to add calendar event' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    setLoading(true);
    try {
      await createWorkspaceTask('@default', newTaskTitle.trim(), 'Created from BotGrabber');
      setNewTaskTitle('');
      setStatusNotice({ type: 'success', message: 'Task added to Google Tasks' });
      loadCurrentTabData();
    } catch (err: any) {
      setStatusNotice({ type: 'error', message: err.message || 'Failed to create task' });
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSheet = async (sheetId: string) => {
    setSelectedSheetId(sheetId);
    setLoading(true);
    try {
      const details = await getSpreadsheetDetails(sheetId);
      setSheetDetails(details);
    } catch (err: any) {
      setStatusNotice({ type: 'error', message: err.message || 'Failed to read sheet' });
    } finally {
      setLoading(false);
    }
  };

  const handleAppendRow = async () => {
    if (!selectedSheetId || !newRowData) return;
    setLoading(true);
    try {
      const parsedValues = [newRowData.split(',').map((s) => s.trim())];
      await appendSpreadsheetValues(selectedSheetId, 'A1', parsedValues);
      setStatusNotice({ type: 'success', message: 'Row appended to Google Sheet' });
      handleInspectSheet(selectedSheetId);
    } catch (err: any) {
      setStatusNotice({ type: 'error', message: err.message || 'Failed to append row' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="google-workspace-hub" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Google Workspace & Cloud SQL Hub</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active OAuth & DB
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Real integration with Gmail, Google Sheets, Docs, Calendar, Slides, Tasks, Forms, Contacts, Firebase Firestore, and Cloud SQL PostgreSQL (us-west1).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3.5 py-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-600"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-200 truncate max-w-[160px]">{user.displayName || user.email}</div>
                  <div className="text-slate-400 truncate max-w-[160px]">{user.email}</div>
                </div>
                <button
                  id="workspace-signout-btn"
                  onClick={handleSignOut}
                  className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="workspace-signin-btn"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-medium text-sm transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
              </button>
            )}
          </div>
        </div>

        {statusNotice && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusNotice.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : statusNotice.type === 'error'
                ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
            }`}
          >
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : statusNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span>{statusNotice.message}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'gmail', label: 'Gmail', icon: Mail, count: emails.length },
          { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, count: sheets.length },
          { id: 'docs', label: 'Google Docs', icon: FileText, count: docs.length },
          { id: 'calendar', label: 'Google Calendar', icon: CalendarIcon, count: events.length },
          { id: 'slides', label: 'Google Slides', icon: Presentation, count: slides.length },
          { id: 'tasks', label: 'Google Tasks', icon: CheckSquare, count: tasks.length },
          { id: 'forms', label: 'Google Forms', icon: FileQuestion, count: forms.length },
          { id: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
          { id: 'cloudsql', label: 'Cloud SQL & Firebase', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id as ActiveWorkspaceTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        <button
          id="refresh-workspace-tab-btn"
          onClick={loadCurrentTabData}
          disabled={loading || !token}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-colors disabled:opacity-40"
          title="Refresh current data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      {!token ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mx-auto flex items-center justify-center text-blue-400 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Google Workspace Authentication</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Sign in with your Google account to grant permission to access Gmail, Sheets, Docs, Calendar, Slides, Tasks, Forms, and Contacts with safe in-memory token handling.
          </p>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB: GMAIL */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Gmail Integration</h3>
                  <p className="text-xs text-slate-400">View recent messages and send email updates with explicit confirmation.</p>
                </div>
                <button
                  id="compose-email-btn"
                  onClick={() => setShowComposeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compose Email</span>
                </button>
              </div>

              {emails.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  No recent messages found or loading...
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs truncate max-w-xs">{msg.from}</span>
                          <span className="text-[11px] text-slate-500">{msg.date}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-200 mt-0.5 truncate">{msg.subject}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{msg.snippet}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Google Sheets Integration</h3>
                  <p className="text-xs text-slate-400">List spreadsheets, view grid sheets, and append bot dispatch & payout logs.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Drive Spreadsheets</h4>
                  {sheets.length === 0 ? (
                    <p className="text-xs text-slate-500">No spreadsheets found in your Google Drive.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {sheets.map((sheet) => (
                        <div
                          key={sheet.id}
                          onClick={() => handleInspectSheet(sheet.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                            selectedSheetId === sheet.id
                              ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                              : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="truncate font-medium">{sheet.name}</div>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sheet Rows & Append</h4>
                  {sheetDetails ? (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-300 font-medium">Title: {sheetDetails.properties?.title}</div>
                      <div className="text-[11px] text-slate-400">
                        Sheets: {sheetDetails.sheets?.map((s: any) => s.properties?.title).join(', ')}
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <label className="text-[11px] text-slate-400">Append Row Data (CSV format):</label>
                        <input
                          type="text"
                          value={newRowData}
                          onChange={(e) => setNewRowData(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                        <button
                          onClick={handleAppendRow}
                          disabled={loading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Append Values</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Select a spreadsheet from the left list to view and append rows.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Google Docs Integration</h3>
                <p className="text-xs text-slate-400">Access and view document files from your Google Drive.</p>
              </div>

              {docs.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  No Google Docs documents found in Drive.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {docs.map((doc) => (
                    <div key={doc.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-500">Modified: {new Date(doc.modifiedTime).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {doc.webViewLink && (
                        <a
                          href={doc.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Google Calendar Integration</h3>
                  <p className="text-xs text-slate-400">Sync driver dispatch schedules and create shifts in Google Calendar.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Upcoming Calendar Events</h4>
                  {events.length === 0 ? (
                    <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-lg text-xs text-slate-500">
                      No upcoming calendar events found.
                    </div>
                  ) : (
                    events.map((ev) => (
                      <div key={ev.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">{ev.summary}</div>
                          <div className="text-[11px] text-slate-400">
                            {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString() : ev.start?.date}
                          </div>
                        </div>
                        {ev.htmlLink && (
                          <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Add Shift to Calendar</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Summary / Title</label>
                      <input
                        type="text"
                        value={eventSummary}
                        onChange={(e) => setEventSummary(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Start Time</label>
                      <input
                        type="datetime-local"
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">End Time</label>
                      <input
                        type="datetime-local"
                        value={eventEnd}
                        onChange={(e) => setEventEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <button
                      onClick={handleCreateCalendarEvent}
                      disabled={loading}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Calendar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SLIDES */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Google Slides Integration</h3>
                <p className="text-xs text-slate-400">Access slide decks and pitch decks directly from Google Drive.</p>
              </div>

              {slides.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  No Google Slides presentations found in Drive.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {slides.map((slide) => (
                    <div key={slide.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Presentation className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate">{slide.name}</div>
                          <div className="text-[10px] text-slate-500">Modified: {new Date(slide.modifiedTime).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {slide.webViewLink && (
                        <a
                          href={slide.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Google Tasks Integration</h3>
                  <p className="text-xs text-slate-400">Keep track of driver checklist items and dispatch tasks.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add new task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
                <button
                  onClick={handleCreateTask}
                  disabled={loading || !newTaskTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  No tasks currently in your Google Tasks list.
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center gap-3">
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white truncate">{task.title}</div>
                        {task.notes && <div className="text-[11px] text-slate-400">{task.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: FORMS */}
          {activeTab === 'forms' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Google Forms Integration</h3>
                <p className="text-xs text-slate-400">Inspect driver surveys and customer delivery rating forms.</p>
              </div>

              {forms.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  No Google Forms found in your Google Drive.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {forms.map((form) => (
                    <div key={form.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileQuestion className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate">{form.name}</div>
                          <div className="text-[10px] text-slate-500">Modified: {new Date(form.modifiedTime).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {form.webViewLink && (
                        <a
                          href={form.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Google Contacts (People API)</h3>
                <p className="text-xs text-slate-400">View driver dispatch contacts and delivery contacts.</p>
              </div>

              {contacts.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  No contacts found in Google Contacts.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {contacts.map((c, idx) => {
                    const name = c.names?.[0]?.displayName || 'Unnamed Contact';
                    const email = c.emailAddresses?.[0]?.value;
                    const phone = c.phoneNumbers?.[0]?.value;
                    const photo = c.photos?.[0]?.url;

                    return (
                      <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center gap-3">
                        {photo ? (
                          <img src={photo} alt={name} className="w-8 h-8 rounded-full border border-slate-700" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            {name[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate">{name}</div>
                          {email && <div className="text-[10px] text-slate-400 truncate">{email}</div>}
                          {phone && <div className="text-[10px] text-slate-500 truncate">{phone}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: CLOUD SQL & FIREBASE */}
          {activeTab === 'cloudsql' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Cloud SQL PostgreSQL & Firebase Engine</h3>
                <p className="text-xs text-slate-400">
                  Provisioned Cloud SQL instance in <span className="text-emerald-400 font-mono">us-west1</span> for project{' '}
                  <span className="text-blue-400 font-mono">flutter-ai-playground-cb2b3</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>PostgreSQL Database Status</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Instance:</span>
                      <span className="text-white font-mono">ai-studio-b8b338e8</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Region:</span>
                      <span className="text-emerald-400 font-mono">us-west1</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">GCP Project:</span>
                      <span className="text-blue-400 font-mono">flutter-ai-playground-cb2b3</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">ORM & Driver:</span>
                      <span className="text-slate-200">Drizzle ORM + node-postgres pool</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Synced User Email:</span>
                      <span className="text-slate-200">{cloudSqlProfile?.email || user.email}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Firebase Firestore & Auth Status</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Firebase Project:</span>
                      <span className="text-white font-mono">flutter-ai-playground-cb2b3</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Firestore Rules:</span>
                      <span className="text-emerald-400 font-semibold">Deployed & Active</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Authenticated UID:</span>
                      <span className="text-slate-300 font-mono text-[11px] truncate max-w-[180px]">{user.uid}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Tokens In-Memory:</span>
                      <span className="text-emerald-400 font-medium">Secured (No LocalStorage)</span>
                    </div>
                  </div>
                </div>
              </div>

              {cloudSqlLogs.length > 0 && (
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cloud SQL Activity History</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {cloudSqlLogs.map((log) => (
                      <div key={log.id} className="p-2 bg-slate-800/40 rounded text-xs flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{log.action}</span>
                        <span className="text-[11px] text-slate-400">{log.details}</span>
                        <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compose Email Modal with Mandatory Destructive/Send Confirmation Dialog */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <span>Compose Gmail Message</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">To Email Address</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Subject</label>
                <input
                  type="text"
                  placeholder="Walmart Spark / Gig Dispatch Notification"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Message Body</label>
                <textarea
                  rows={4}
                  placeholder="Enter message details..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmSendDialog(true)}
                disabled={!emailTo || !emailSubject || !emailBody}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog before sending/mutating data */}
      {confirmSendDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-yellow-500/50 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Confirm Sending Email</h4>
              <p className="text-xs text-slate-300 mt-1">
                Are you sure you want to send this email to <span className="text-blue-400 font-semibold">{emailTo}</span> with subject{' '}
                <span className="text-white font-semibold">"{emailSubject}"</span> on behalf of your Google account?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConfirmSendDialog(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmailConfirmed}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                {loading ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
