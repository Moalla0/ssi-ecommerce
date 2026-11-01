"use client";

import { useEffect, useState } from "react";
import { getLatestOrders } from "@/lib/products";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import { Order as OrderItem } from "@shared/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const fetchAllOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Reuse the same mapper via getLatestOrders with a high limit to approximate "all"
      const result = await getLatestOrders(200);
      setOrders(result);
    } catch (e: any) {
      setError(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading orders...</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Order #</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Total</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2">{o.orderNumber}</td>
                  <td className="px-3 py-2">{o.customerName || "Unknown"}</td>
                  <td className="px-3 py-2">{o.customerEmail || "—"}</td>
                  <td className="px-3 py-2">${o.total?.toLocaleString()}</td>
                  <td className="px-3 py-2">{o.status}</td>
                  <td className="px-3 py-2">
                    {o.createdAt?.toDate
                      ? o.createdAt.toDate().toLocaleString()
                      : new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="text-primary underline"
                      onClick={() => setSelectedOrder(o)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onStatusUpdate={fetchAllOrders}
        />
      )}
    </div>
  );
}
