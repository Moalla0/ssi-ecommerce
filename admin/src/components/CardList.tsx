"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useEffect, useState } from "react";
import {
  getProducts,
  getPopularProducts,
  getLatestOrders,
  formatPrice,
  getFirstProductImage,
} from "@/lib/products";
import { Product } from "@shared/types";
import OrderDetailsModal from "./OrderDetailsModal";

const CardList = ({ title }: { title: string }) => {
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [latestOrders, setLatestOrders] = useState<
    Array<{
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
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (title === "Popular Products") {
      const fetchPopularProducts = async () => {
        setLoading(true);
        setError(null);
        try {
          const { products } = await getProducts();
          console.log(
            "CardList: Test - Total products in current subset:",
            products.length,
          );

          const popularProducts = await getPopularProducts(5);
          console.log("CardList: Received popular products:", products);
          setPopularProducts(products);
        } catch (error) {
          console.error("CardList: Error fetching popular products:", error);
          setError(
            `Failed to load popular products: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        } finally {
          setLoading(false);
        }
      };

      fetchPopularProducts();
    } else if (title === "Latest Orders") {
      fetchLatestOrders();
    }
  }, [title]);

  // Helper function to get status badge variant
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

  // Helper function to format order date
  const formatOrderDate = (timestamp: any) => {
    if (!timestamp) return "Unknown Date";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);

    // Refresh the orders list if we were showing orders
    if (title === "Latest Orders") {
      fetchLatestOrders();
    }
  };

  const fetchLatestOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("CardList: Starting to fetch latest orders...");
      const orders = await getLatestOrders(5);
      console.log("CardList: Received latest orders:", orders);
      setLatestOrders(orders);
    } catch (error) {
      console.error("CardList: Error fetching latest orders:", error);
      setError(
        `Failed to load latest orders: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      <div className="flex flex-col gap-1.5">
        {title === "Popular Products" ? (
          loading ? (
            // Loading skeleton while fetching data
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="flex-row items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-sm bg-muted animate-pulse flex-shrink-0"></div>
                <CardContent className="flex-1 p-0 min-w-0">
                  <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                </CardContent>
                <div className="flex-shrink-0">
                  <div className="h-4 bg-muted rounded animate-pulse w-12"></div>
                </div>
              </Card>
            ))
          ) : popularProducts.length > 0 ? (
            popularProducts.map((item) => (
              <Card key={item.id} className="flex-row items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-sm relative overflow-hidden flex-shrink-0">
                  <Image
                    src={getFirstProductImage(item.images)}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to default image if the product image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = "/products/1g.png";
                    }}
                  />
                </div>
                <CardContent className="flex-1 p-0 min-w-0">
                  <CardTitle
                    className="text-sm font-medium truncate"
                    title={item.name}
                  >
                    {item.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {item.salesCount || 0} sales
                  </Badge>
                </CardContent>
                <div className="flex-shrink-0 text-sm font-medium text-right">
                  {formatPrice(item.price)}
                </div>
              </Card>
            ))
          ) : error ? (
            // Error state
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            // No products found
            <div className="text-center text-muted-foreground py-4">
              No products with sales found
            </div>
          )
        ) : // Latest Orders
        loading ? (
          // Loading skeleton for orders
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="flex-row items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-sm bg-muted animate-pulse flex-shrink-0"></div>
              <CardContent className="flex-1 p-0 min-w-0">
                <div className="h-4 bg-muted rounded animate-pulse w-24 mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-16"></div>
              </CardContent>
              <div className="flex-shrink-0">
                <div className="h-4 bg-muted rounded animate-pulse w-12"></div>
              </div>
            </Card>
          ))
        ) : latestOrders.length > 0 ? (
          latestOrders.map((order) => (
            <Card
              key={order.id}
              className="flex-row items-center gap-3 p-3 cursor-pointer"
              onClick={() => handleOrderClick(order)}
            >
              <div className="w-10 h-10 rounded-sm relative overflow-hidden bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors cursor-pointer flex-shrink-0">
                <span className="text-blue-600 text-xs font-medium">
                  #{order.orderNumber}
                </span>
              </div>
              <CardContent className="flex-1 p-0 min-w-0">
                <CardTitle
                  className="text-sm font-medium truncate"
                  title={`Order #${order.orderNumber}`}
                >
                  Order #{order.orderNumber}
                </CardTitle>
                <Badge
                  variant={getStatusBadgeVariant(order.status)}
                  className="text-xs mt-1"
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {order.customerName} • {formatOrderDate(order.createdAt)}
                </div>
              </CardContent>
              <div className="flex-shrink-0 text-sm font-medium text-right">
                {formatPrice(order.total)}
              </div>
            </Card>
          ))
        ) : error ? (
          // Error state for orders
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : (
          // No orders found
          <div className="text-center text-muted-foreground py-4">
            <div className="text-sm">No orders yet</div>
            <div className="text-xs mt-1">
              Orders will appear here once customers start shopping
            </div>
          </div>
        )}
      </div>
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        onStatusUpdate={fetchLatestOrders}
      />
    </div>
  );
};

export default CardList;
