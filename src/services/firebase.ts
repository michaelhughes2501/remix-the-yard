import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Firebase is optional (the core app runs on the Express/SQLite API). Only
// initialize it when an API key is configured; otherwise getAuth() throws
// auth/invalid-api-key at import time and blanks the whole app.
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isFirebaseConfigured = Boolean(apiKey);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  // Initialize Firebase App
  app = initializeApp({
    ...firebaseConfig,
    apiKey,
  });
  // Export Authentication and Firestore references
  dbInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */
  authInstance = getAuth(app);
}

export const db = dbInstance;

/**
 * Returns the Firebase Auth instance, or throws a descriptive error when
 * VITE_FIREBASE_API_KEY is not set.
 */
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_API_KEY to enable Google sign-in.');
  }
  return authInstance;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Handles Firestore errors by wrapping them into a descriptive JSON string structure.
 * This is crucial for security rule diagnostics and debugging.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to the Firestore backend.
 */
export async function testConnection() {
  if (!dbInstance) return;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client appears to be offline.");
    }
  }
}

// Perform initial connection check
testConnection();
