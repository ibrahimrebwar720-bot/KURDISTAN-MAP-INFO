import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with experimentalForceLongPolling: true
// to connect immediately without 10s WebSockets auto-detect timeouts in preview iframes and proxy networks.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
