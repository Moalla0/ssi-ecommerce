import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
// This should only be used in server-side code (API routes, Server Components)

if (!admin.apps.length) {
  try {
    // Attempt to use environment variables for service account
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: serviceAccount
          ? admin.credential.cert(serviceAccount)
          : admin.credential.applicationDefault(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin initialized successfully");
    } else {
      console.warn(
        "Firebase Admin credentials not found. Some server-side features may not work.",
      );
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;
