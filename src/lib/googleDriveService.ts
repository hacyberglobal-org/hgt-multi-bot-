import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase app instance if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// All Google Drive scopes configured for the applet
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.scripts'
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory - NEVER in localStorage / sessionStorage
let cachedAccessToken: string | null = null;

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
}

export interface DriveAboutQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
}

/**
 * Initialize auth state listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not in memory; requires user to sign in to obtain access token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign-in popup with Google Drive scopes.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token from authentication result');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns the in-memory cached access token.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Signs the user out and wipes in-memory token cache.
 */
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * List files from Google Drive
 */
export async function listDriveFiles(
  token: string,
  searchQuery?: string,
  pageSize = 25
): Promise<{ files: DriveFileItem[]; nextPageToken?: string }> {
  let q = "trashed = false";
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const fields = 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, owners)';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=${encodeURIComponent(fields)}&q=${encodeURIComponent(q)}&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken
  };
}

/**
 * Fetch Google Drive storage quota & user profile information
 */
export async function getDriveQuota(token: string): Promise<DriveAboutQuota> {
  const url = 'https://www.googleapis.com/drive/v3/about?fields=storageQuota,user';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch Drive quota (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    limit: data.storageQuota?.limit,
    usage: data.storageQuota?.usage,
    usageInDrive: data.storageQuota?.usageInDrive,
    usageInDriveTrash: data.storageQuota?.usageInDriveTrash,
    user: data.user
  };
}

/**
 * Create/Upload a text/json/markdown file into Google Drive
 */
export async function uploadTextFileToDrive(
  token: string,
  fileName: string,
  content: string,
  mimeType = 'text/plain'
): Promise<DriveFileItem> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: mimeType
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Delete a file permanently or move to trash.
 * IMPORTANT: This operation requires explicit user confirmation prior to execution!
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Google Drive delete error (${res.status}): ${err}`);
  }

  return true;
}
