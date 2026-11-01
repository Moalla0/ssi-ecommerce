"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const uidSchema = z.string().min(1, "UID is required");

/**
 * Promotes a user to admin by setting a custom claim and updating their Firestore document.
 * @param uid The Firebase UID of the user to promote
 */
export async function promoteToAdmin(uid: string) {
  // Validate input
  uidSchema.parse(uid);
  if (!adminAuth || !adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  try {
    // 1. Set custom claim for JWT verification in middleware (Edge compatible)
    await adminAuth.setCustomUserClaims(uid, { admin: true });

    // 2. Update Firestore document for UI visibility
    const userRef = adminDb.collection("users").doc(uid);
    await userRef.update({
      role: "admin",
      updatedAt: new Date(),
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    throw new Error("Failed to promote user to admin");
  }
}

/**
 * Removes admin privileges from a user.
 * @param uid The Firebase UID of the user to demote
 */
export async function demoteFromAdmin(uid: string) {
  // Validate input
  uidSchema.parse(uid);

  if (!adminAuth || !adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  try {
    // 1. Remove custom claim
    await adminAuth.setCustomUserClaims(uid, { admin: false });

    // 2. Update Firestore
    const userRef = adminDb.collection("users").doc(uid);
    await userRef.update({
      role: "user",
      updatedAt: new Date(),
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error demoting user from admin:", error);
    throw new Error("Failed to demote user from admin");
  }
}
