import * as jose from "jose";

const GOOGLE_PUBLIC_KEYS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let cachedKeys: Record<string, string> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

async function getGooglePublicKeys() {
  const now = Date.now();
  if (cachedKeys && now - lastFetchTime < CACHE_TTL) {
    return cachedKeys;
  }

  const response = await fetch(GOOGLE_PUBLIC_KEYS_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch Google public keys");
  }

  cachedKeys = await response.json();
  lastFetchTime = now;
  return cachedKeys;
}

export interface FirebaseTokenPayload extends jose.JWTPayload {
  admin?: boolean;
  email?: string;
  email_verified?: boolean;
  user_id?: string;
  picture?: string;
  name?: string;
}

/**
 * Verifies a Firebase ID token in the Edge Runtime.
 * This does not use firebase-admin, making it compatible with Next.js Middleware.
 */
export async function verifyIdToken(
  token: string,
): Promise<FirebaseTokenPayload | null> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
      return null;
    }

    // Decode header to get kid
    const header = jose.decodeProtectedHeader(token);
    const kid = header.kid;
    if (!kid) return null;

    // Get public keys
    const keys = await getGooglePublicKeys();
    const cert = keys[kid];
    if (!cert) return null;

    // Import the certificate as a public key
    // Firebase certs are in x509 format
    const publicKey = await jose.importX509(cert, "RS256");

    // Verify the JWT
    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    return payload as FirebaseTokenPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
