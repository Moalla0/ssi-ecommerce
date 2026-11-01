"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CartItemsType, ShippingFormInputs } from "@/types";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatPrice } from "@/lib/products";

const OrderSuccess = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderedItems, setOrderedItems] = useState<CartItemsType>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingFormInputs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("OrderSuccess useEffect running");
    const orderIdFromUrl = searchParams.get('orderId');
    console.log("OrderId from URL:", orderIdFromUrl);
    
    if (!orderIdFromUrl) {
      console.log("No orderId found in URL, redirecting to cart");
      router.push("/cart");
      return;
    }

    const fetchOrderData = async () => {
      try {
        console.log("Fetching order data from Firebase...");
        const orderDoc = await getDoc(doc(db, "orders", orderIdFromUrl));
        
        if (!orderDoc.exists()) {
          console.log("Order not found in Firebase, redirecting to cart");
          router.push("/cart");
          return;
        }

        const orderData = orderDoc.data();
        console.log("Order data from Firebase:", orderData);
        
        setOrderId(orderIdFromUrl);
        setOrderNumber(orderData.orderNumber);
        setOrderedItems(orderData.items);
        setShippingInfo(orderData.shippingInfo);
      } catch (error) {
        console.error("Error fetching order data:", error);
        router.push("/cart");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [searchParams, router]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Processing your order...</p>
      </div>
    );

  const total = orderedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-6">
      <CheckCircle className="w-16 h-16 text-green-500" />
      <h1 className="text-2xl font-semibold">Thank you for your order!</h1>
      <p className="text-gray-600 text-center">
        Your order has been successfully placed.
      </p>

      {orderNumber && (
        <p className="text-sm text-gray-500">
          Order #: <span className="font-medium">{orderNumber}</span>
        </p>
      )}

      {/* Order Summary */}
      <div className="w-full max-w-md shadow-lg border rounded-lg p-6 flex flex-col gap-4">
        <h3 className="font-medium text-gray-700">Ordered Items</h3>
        {orderedItems.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50">
                <Image
                  src={Object.values(item.images)[0]}
                  alt={item.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
            <p className="font-medium">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}

        <hr className="border-gray-200" />
        <div className="flex justify-between font-semibold">
          <p>Total</p>
          <p>{formatPrice(total)}</p>
        </div>
      </div>

      <button
        onClick={() => router.push("/")}
        className="bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-lg w-full max-w-md mt-4"
      >
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderSuccess;
