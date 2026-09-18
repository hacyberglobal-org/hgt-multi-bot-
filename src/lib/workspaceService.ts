import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';

// In-memory cache for OAuth access token and ID token
let cachedAccessToken: string | null = null;
let cachedIdToken: string | null = null;
let isSigningIn = false;

export const getCachedAccessToken = () => cachedAccessToken;
export const getCachedIdToken = () => cachedIdToken;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        cachedIdToken = idToken;
      } catch (err) {
        console.error('Failed to get user ID token:', err);
      }

      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedIdToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{ user: User; accessToken: string; idToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = (result as any)._tokenResponse?.oauthAccessToken
      ? { accessToken: (result as any)._tokenResponse.oauthAccessToken }
      : null;

    // Firebase Auth credential helper
    let accessToken = credential?.accessToken;
    if (!accessToken && (result as any).credential) {
      accessToken = (result as any).credential.accessToken;
    }
    if (!accessToken && (result as any)._tokenResponse?.oauthIdToken) {
      accessToken = (result as any)._tokenResponse.oauthAccessToken;
    }

    if (!accessToken) {
      // Fallback extraction from token response
      const tokenResponse = (result as any)._tokenResponse;
      accessToken = tokenResponse?.oauthAccessToken || tokenResponse?.accessToken;
    }

    if (!accessToken) {
      throw new Error('Could not obtain Google Workspace access token from authentication result.');
    }

    cachedAccessToken = accessToken;
    const idToken = await result.user.getIdToken();
    cachedIdToken = idToken;

    // Also sync to Cloud SQL backend
    try {
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName: result.user.displayName,
          email: result.user.email,
          photoUrl: result.user.photoURL,
        }),
      });
    } catch (syncErr) {
      console.warn('Sync to Cloud SQL users table had a non-blocking error:', syncErr);
    }

    return { user: result.user, accessToken, idToken };
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const workspaceSignOut = async () => {
  cachedAccessToken = null;
  cachedIdToken = null;
  await signOut(auth);
};

// Generic fetch helper with OAuth token
async function callGoogleApi(url: string, options: RequestInit = {}) {
  if (!cachedAccessToken) {
    throw new Error('Google Workspace authentication required. Please sign in with Google first.');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${cachedAccessToken}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google API error (${res.status}): ${errorBody}`);
  }

  return res.json();
}

// ---------------- Gmail API ----------------
export async function listGmailMessages(maxResults = 10, q = '') {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
    ...(q ? { q } : {}),
  });
  const listData = await callGoogleApi(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`);
  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  const details = await Promise.all(
    listData.messages.slice(0, maxResults).map(async (m: { id: string }) => {
      try {
        return await callGoogleApi(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`);
      } catch {
        return m;
      }
    })
  );

  return details.map((d: any) => {
    const headers = d.payload?.headers || [];
    const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
    const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
    const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
    return {
      id: d.id,
      threadId: d.threadId,
      snippet: d.snippet,
      subject,
      from,
      date,
    };
  });
}

export async function sendGmailMessage(to: string, subject: string, bodyText: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText,
  ];
  const message = messageParts.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return callGoogleApi('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encodedMessage }),
  });
}

// ---------------- Google Sheets API ----------------
export async function listSpreadsheetFiles(pageSize = 10) {
  const q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed = false";
  return callGoogleApi(`https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,webViewLink)`);
}

export async function getSpreadsheetDetails(spreadsheetId: string) {
  return callGoogleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
}

export async function getSpreadsheetValues(spreadsheetId: string, range: string) {
  return callGoogleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
}

export async function appendSpreadsheetValues(spreadsheetId: string, range: string, values: any[][]) {
  return callGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
}

// ---------------- Google Docs API ----------------
export async function listDocFiles(pageSize = 10) {
  const q = "mimeType='application/vnd.google-apps.document' and trashed = false";
  return callGoogleApi(`https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,webViewLink)`);
}

export async function getDocContent(documentId: string) {
  return callGoogleApi(`https://docs.googleapis.com/v1/documents/${documentId}`);
}

// ---------------- Google Calendar API ----------------
export async function listCalendarEvents(maxResults = 10) {
  const now = new Date().toISOString();
  return callGoogleApi(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`
  );
}

export async function createCalendarEvent(event: { summary: string; description?: string; start: { dateTime: string }; end: { dateTime: string } }) {
  return callGoogleApi('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}

// ---------------- Google Slides API ----------------
export async function listPresentationFiles(pageSize = 10) {
  const q = "mimeType='application/vnd.google-apps.presentation' and trashed = false";
  return callGoogleApi(`https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,webViewLink)`);
}

export async function getPresentationDetails(presentationId: string) {
  return callGoogleApi(`https://slides.googleapis.com/v1/presentations/${presentationId}`);
}

// ---------------- Google Tasks API ----------------
export async function listTaskLists() {
  return callGoogleApi('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
}

export async function listTasks(taskListId = '@default', maxResults = 20) {
  return callGoogleApi(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?maxResults=${maxResults}`);
}

export async function createWorkspaceTask(taskListId = '@default', title: string, notes?: string, due?: string) {
  return callGoogleApi(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      notes: notes || '',
      due: due ? new Date(due).toISOString() : undefined,
    }),
  });
}

// ---------------- Google Forms API ----------------
export async function listFormFiles(pageSize = 10) {
  const q = "mimeType='application/vnd.google-apps.form' and trashed = false";
  return callGoogleApi(`https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,webViewLink)`);
}

export async function getFormDetails(formId: string) {
  return callGoogleApi(`https://forms.googleapis.com/v1/forms/${formId}`);
}

export async function getFormResponses(formId: string) {
  return callGoogleApi(`https://forms.googleapis.com/v1/forms/${formId}/responses`);
}

// ---------------- Google Contacts API (People API) ----------------
export async function listContacts(pageSize = 20) {
  return callGoogleApi(
    `https://people.googleapis.com/v1/people/me/connections?pageSize=${pageSize}&personFields=names,emailAddresses,phoneNumbers,photos`
  );
}
