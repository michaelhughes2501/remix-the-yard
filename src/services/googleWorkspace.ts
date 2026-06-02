import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase.ts';

// Cache the access token in memory as requested by security constraints (no localStorage storing)
let cachedAccessToken: string | null = null;
let googleUser: any = null;

// Initialize Google OAuth provider with all target scopes requested
export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  
  // Scopes requested by user:
  provider.addScope('https://www.googleapis.com/auth/drive');
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  provider.addScope('https://www.googleapis.com/auth/chat.spaces');
  provider.addScope('https://www.googleapis.com/auth/chat.messages');
  provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
  provider.addScope('https://www.googleapis.com/auth/contacts');
  provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  provider.addScope('https://www.googleapis.com/auth/calendar');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  
  return provider;
}

/**
 * Connects the Google Workspace account by triggering signInWithPopup.
 */
export async function connectGoogleWorkspace() {
  try {
    const provider = getGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google OAuth access token.');
    }
    cachedAccessToken = credential.accessToken;
    googleUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Workspace Authentication Error:', error);
    throw error;
  }
}

/**
 * Checks if Google Workspace is authenticated in memory.
 */
export function isGoogleConnected(): boolean {
  return cachedAccessToken !== null;
}

/**
 * Gets cached access token.
 */
export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Disconnects Google Workspace.
 */
export function disconnectGoogleWorkspace() {
  cachedAccessToken = null;
  googleUser = null;
}

/**
 * Google Drive API Helpers
 */
export async function listGoogleDriveFiles() {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace not connected.');

  const res = await fetch('https://www.googleapis.com/drive/v3/files?q=trashed=false&fields=files(id,name,mimeType,size,createdTime,webViewLink)', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch files from Google Drive.');
  }
  const data = await res.json();
  return data.files || [];
}

export async function uploadFileToGoogleDrive(fileName: string, mimeType: string, base64Data: string) {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace not connected.');

  // Convert base64 to Blob
  let strippedBase64 = base64Data;
  if (base64Data.includes(';base64,')) {
    strippedBase64 = base64Data.split(';base64,')[1];
  }
  const byteCharacters = atob(strippedBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const fileBlob = new Blob([byteArray], { type: mimeType });

  // Multi-part metadata + media upload format for Drive API v3
  const metadata = {
    name: fileName,
    mimeType: mimeType
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to upload document to Google Drive.');
  }

  return await res.json();
}

/**
 * Gmail API Helpers
 */
export async function listGmailMessages() {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace not connected.');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch Gmail messages.');
  }
  const data = await res.json();
  const messagesList = data.messages || [];

  // Fetch details for each message in parallel
  const detailPromises = messagesList.map(async (msg: any) => {
    const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (detailRes.ok) {
      return await detailRes.json();
    }
    return null;
  });

  const rawDetails = await Promise.all(detailPromises);
  return rawDetails.filter(d => d !== null).map((raw: any) => {
    const headers = raw.payload?.headers || [];
    const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
    const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
    const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
    
    // Parse message snippet
    const snippet = raw.snippet || '';
    
    return {
      id: raw.id,
      threadId: raw.threadId,
      subject,
      from,
      date,
      snippet
    };
  });
}

export async function sendGmailMessage(to: string, subject: string, bodyText: string) {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace not connected.');

  // UTF-8 MIME email construction
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText
  ];
  const email = emailLines.join('\r\n');
  const base64SafeEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: base64SafeEmail })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to send email via Gmail.');
  }

  return await res.json();
}

/**
 * Google Chat API Helpers
 */
export async function listGoogleChatSpaces() {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace not connected.');

  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to list Google Chat spaces.');
  }
  const data = await res.json();
  return data.spaces || [];
}

/**
 * Google Meet API Helpers
 */
export async function createGoogleMeetSpace(meetingName?: string) {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace not connected.');

  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(meetingName ? { config: { accessionClass: 'OPEN' } } : {})
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to create Google Meet space.');
  }

  return await res.json();
}

/**
 * People / Contacts API Helpers
 */
export async function listGoogleContacts() {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace not connected.');

  const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=50', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch contacts from Google Contacts.');
  }
  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((conn: any) => {
    const name = conn.names?.[0]?.displayName || 'Unnamed Connection';
    const email = conn.emailAddresses?.[0]?.value || '';
    const phone = conn.phoneNumbers?.[0]?.value || '';
    return {
      resourceName: conn.resourceName,
      name,
      email,
      phone
    };
  });
}

/**
 * Google Calendar API Helpers
 */
export async function addGoogleCalendarEvent(summary: string, location: string, description: string, dateStr: string) {
  const token = getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace not connected.');

  const startDate = new Date(dateStr + "T00:00:00");
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 1);
  const endDateStr = endDate.toISOString().split('T')[0];

  const body = {
    summary,
    location,
    description,
    start: {
      date: dateStr
    },
    end: {
      date: endDateStr
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 1 day before email reminder
        { method: 'popup', minutes: 1440 },  // 1 day before popup reminder
        { method: 'popup', minutes: 60 }     // 1 hour before popup reminder
      ]
    }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to create Google Calendar event.');
  }

  return await res.json();
}
