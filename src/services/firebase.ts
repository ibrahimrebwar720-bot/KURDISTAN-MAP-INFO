import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

async function validateFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'facts', '__connection_check__'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore appears offline. Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  validateFirestoreConnection();
}

export default app;
