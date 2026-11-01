import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const initializeOrderCounter = async () => {
  try {
    const counterRef = doc(db, "counters", "orders");
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      // Initialize the counter if it doesn't exist
      await setDoc(counterRef, { current: 0 });
      console.log("Order counter initialized");
    } else {
      console.log("Order counter already exists:", counterDoc.data().current);
    }
  } catch (error) {
    console.error("Error initializing order counter:", error);
  }
};
