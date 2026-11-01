import { db } from "@shared/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const COLLECTION = "users";

import { AdminUser } from "@shared/types";

/**
 * Fetches all users using the client SDK.
 * Suitable for use in Client Components.
 */
export const getAllUsers = async (): Promise<AdminUser[]> => {
  const q = query(collection(db, COLLECTION));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    const status: "active" | "inactive" =
      data.status === "inactive" ? "inactive" : "active";
    return {
      id: doc.id,
      uid: doc.id,
      avatar: data.photoURL || data.avatar || "/users/1.png",
      fullName:
        data.displayName ||
        data.fullName ||
        `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      email: data.email || "",
      role: data.role || "user",
      status,
    } as AdminUser;
  });
};

/**
 * Fetches users with the 'admin' role using the client SDK.
 */
export const getAdmins = async (): Promise<AdminUser[]> => {
  const q = query(collection(db, COLLECTION), where("role", "==", "admin"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      uid: doc.id,
      avatar: data.photoURL || data.avatar || "/users/1.png",
      fullName:
        data.displayName ||
        data.fullName ||
        `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      email: data.email || "",
      role: "admin",
      status: "active",
    } as AdminUser;
  });
};
