import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface UserOrder {
  id: string;
  orderNumber: number;
  items: any[];
  total: number;
  status: string;
  createdAt: any;
  shippingInfo: any;
}

export const fetchUserOrders = async (userId: string): Promise<UserOrder[]> => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const orders: UserOrder[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        orderNumber: data.orderNumber,
        items: data.items,
        total: data.total,
        status: data.status,
        createdAt: data.createdAt,
        shippingInfo: data.shippingInfo,
      });
    });
    
    // Sort in memory instead of using orderBy in the query
    return orders.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
};
