"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { updateOrderStatus, formatPrice, getFirstProductImage } from "@/lib/products";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: number;
    userId: string;
    total: number;
    status: string;
    createdAt: any;
    customerName?: string;
    customerEmail?: string;
    items?: any[];
    shippingInfo?: any;
  } | null;
  onStatusUpdate?: () => void;
}

const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onStatusUpdate,
}: OrderDetailsModalProps) => {
  const [status, setStatus] = useState(order?.status || "pending");
  const [isUpdating, setIsUpdating] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  useEffect(() => {
    if (order) setStatus(order.status);
  }, [order]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatOrderDate = (timestamp: any) => {
    if (!timestamp) return "Unknown Date";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };



  const handleStatusUpdate = async () => {
    if (!order || status === order.status) return;

    setIsUpdating(true);
    setSubmitStatus("idle");
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Order #${order.orderNumber} updated to ${status}`);
      setSubmitStatus("success");
      onStatusUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
      setSubmitStatus("error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getSubmitButtonContent = () => {
    if (isUpdating) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
        </>
      );
    }
    if (submitStatus === "success") {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" /> Updated Successfully!
        </>
      );
    }
    if (submitStatus === "error") {
      return (
        <>
          <AlertCircle className="mr-2 h-4 w-4" /> Try Again
        </>
      );
    }
    return "Save Changes";
  };

  const getSubmitButtonVariant = () => {
    if (submitStatus === "success") return "default";
    if (submitStatus === "error") return "destructive";
    return "default";
  };

  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            Order #{order.orderNumber}
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </SheetTitle>
          <SheetDescription asChild>
            <div className="space-y-6 mt-6">
              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm bg-muted p-4 rounded-lg">
                  <div>
                    <span className="text-muted-foreground">Order Date:</span>
                    <p className="font-medium">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <p className="font-medium text-lg">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {order.shippingInfo && (
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted p-4 rounded-lg">
                    <p className="break-all">
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {order.shippingInfo.name || "N/A"}
                    </p>
                    <p className="break-all">
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {order.shippingInfo.email || "N/A"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {order.shippingInfo.phone || "N/A"}
                    </p>
                    <p className="break-all">
                      <span className="text-muted-foreground">Address:</span>{" "}
                      {order.shippingInfo.address || "N/A"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">City:</span>{" "}
                      {order.shippingInfo.city || "N/A"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">State:</span>{" "}
                      {order.shippingInfo.state || "N/A"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">ZIP:</span>{" "}
                      {order.shippingInfo.zip || "N/A"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Country:</span>{" "}
                      {order.shippingInfo.country || "N/A"}
                    </p>
                  </div>
                </div>
              )}

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Order Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                      >
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={getFirstProductImage(item.images)}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback to default image if the product image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = "/products/1g.png";
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm break-words">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>

                        {/* Price Info */}
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(item.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total: {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h3 className="font-semibold mb-2">Update Order Status</h3>
                <div className="flex gap-3">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || status === order.status}
                    variant={getSubmitButtonVariant()}
                  >
                    {getSubmitButtonContent()}
                  </Button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isUpdating}
                >
                  Close
                </Button>
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsModal;
