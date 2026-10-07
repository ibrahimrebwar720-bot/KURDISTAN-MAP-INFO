import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with experimentalAutoDetectLongPolling
// to prevent 10s backend connection timeouts in preview iframes and proxy networks.
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
