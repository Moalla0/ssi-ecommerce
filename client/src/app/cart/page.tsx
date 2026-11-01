"use client";

import ShippingForm from "@/components/ShippingForm";
import ConfirmationStep from "@/components/ConfirmationStep";
import useCartStore from "@/stores/cartStore";
import { ShippingFormInputs } from "@/types";
import { ArrowRight, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  updateProductsAfterOrder,
  checkProductsStock,
  isDiscountValid,
  getCurrentPrice,
  formatPrice,
} from "@/lib/products";

const steps = [
  { id: 1, title: "Shopping Cart" },
  { id: 2, title: "Shipping Address" },
  { id: 3, title: "Confirm Details" },
];

const CartPage = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [shippingForm, setShippingForm] = useState<ShippingFormInputs | null>(
    null
  );
  const { cart, removeFromCart, clearCart } = useCartStore();
  const activeStep = parseInt(searchParams.get("step") || "1");

  const isCartEmpty = cart.length === 0;

  // Check for stock issues
  const [stockIssues, setStockIssues] = useState<
    Array<{
      id: string;
      name: string;
      requested: number;
      available: number;
      error: string;
    }>
  >([]);
  const [hasStockIssues, setHasStockIssues] = useState(false);

  // Check stock availability when cart changes
  useEffect(() => {
    const validateStock = async () => {
      if (cart.length === 0) {
        setStockIssues([]);
        setHasStockIssues(false);
        return;
      }

      try {
        const stockCheck = await checkProductsStock(
          cart.map((item) => ({
            id: item.id as string,
            quantity: item.quantity,
          }))
        );
        setStockIssues(stockCheck.stockIssues);
        setHasStockIssues(!stockCheck.allInStock);
      } catch (error) {
        console.error("Error checking stock:", error);
        // Fallback to basic validation
        const basicStockIssues = cart.filter((item) => {
          if (item.stock !== undefined && item.quantity > item.stock) {
            return true;
          }
          return false;
        });
        setStockIssues(
          basicStockIssues.map((item) => ({
            id: item.id as string,
            name: item.name,
            requested: item.quantity,
            available: item.stock || 0,
            error: `Insufficient stock. Available: ${item.stock}, Requested: ${item.quantity}`,
          }))
        );
        setHasStockIssues(basicStockIssues.length > 0);
      }
    };

    validateStock();
  }, [cart]);

  const handleConfirmOrder = async () => {
    console.log("handleConfirmOrder called");
    if (!user || !shippingForm || cart.length === 0) {
      console.log("Early return - missing data:", {
        user: !!user,
        shippingForm: !!shippingForm,
        cartLength: cart.length,
      });
      return;
    }

    // Check for stock issues before proceeding
    if (hasStockIssues) {
      alert(
        "Some items in your cart have insufficient stock. Please review your cart."
      );
      return;
    }

    try {
      console.log("Creating order...");

      // First, update product stock and sales count
      console.log("Updating product stock and sales count...");
      await updateProductsAfterOrder(
        cart.map((item) => ({ id: item.id as string, quantity: item.quantity }))
      );
      console.log("Product updates completed successfully");

      // Get the next order number
      const counterRef = doc(db, "counters", "orders");
      const counterDoc = await getDoc(counterRef);

      let orderNumber = 1;
      if (counterDoc.exists()) {
        orderNumber = counterDoc.data().current + 1;
        // Update the counter
        await updateDoc(counterRef, { current: increment(1) });
      } else {
        // Initialize the counter if it doesn't exist
        await setDoc(counterRef, { current: 1 });
      }

      // Validate cart items before creating order
      console.log("Cart items before order creation:", cart);
      
      // Check for undefined fields in cart items
      const invalidItems = cart.filter(item => {
        const hasUndefinedFields = Object.values(item).some(value => value === undefined);
        if (hasUndefinedFields) {
          console.error("Item with undefined fields:", item);
        }
        return hasUndefinedFields;
      });
      
      if (invalidItems.length > 0) {
        throw new Error("Some cart items have undefined fields. Please refresh the page and try again.");
      }

      const orderData = {
        orderNumber: orderNumber,
        userId: user.uid,
        items: cart,
        shippingInfo: shippingForm,
        total: cart.reduce((acc, item) => {
          const hasValidDiscount =
            item.hasDiscount &&
            item.discountPercentage &&
            isDiscountValid(item);
          const currentPrice = getCurrentPrice(item);
          return acc + currentPrice * item.quantity;
        }, 0),
        createdAt: serverTimestamp(),
        status: "pending",
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log(
        "Order created with ID:",
        docRef.id,
        "Order Number:",
        orderNumber
      );

      // Add order to user's order history
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        orderHistory: increment(1),
        orders: increment(1),
        lastOrderDate: serverTimestamp(),
      });

      clearCart();
      console.log("Cart cleared, redirecting to order-success");
      // Use URL parameters instead of localStorage
      router.push(`/order-success?orderId=${docRef.id}`, { scroll: false });
    } catch (error) {
      console.error("Error creating order:", error);
      // Show user-friendly error message
      alert(
        `Failed to create order: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center mt-12">
      <h1 className="text-2xl font-medium">Your Shopping Cart</h1>

      {/* STEPS */}
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {steps.map((step) => (
          <div
            className={`flex items-center gap-2 border-b-2 pb-4 ${
              step.id === activeStep ? "border-gray-800" : "border-gray-200"
            }`}
            key={step.id}
          >
            <div
              className={`w-6 h-6 rounded-full text-white p-4 flex items-center justify-center ${
                step.id === activeStep ? "bg-gray-800" : "bg-gray-400"
              }`}
            >
              {step.id}
            </div>
            <p
              className={`text-sm font-medium ${
                step.id === activeStep ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {step.title}
            </p>
          </div>
        ))}
      </div>

      {/* STEP CONTENT */}
      <div className="w-full flex flex-col gap-16">
        <div className="w-full shadow-lg border-1 border-gray-100 p-8 rounded-lg flex flex-col gap-8">
          {activeStep === 1 ? (
            isCartEmpty ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <img
                  src="/empty-cart.png"
                  alt="Empty shopping cart illustration"
                  className="object-contain"
                />
                <p className="text-sm text-gray-500 text-center">
                  Your cart is empty. Add items to continue.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Stock Warning */}
                {hasStockIssues && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-red-800 font-medium text-sm">
                        Stock Issues Detected
                      </p>
                    </div>
                    <p className="text-red-700 text-sm mt-2">
                      Some items in your cart have insufficient stock. Please
                      review and adjust quantities.
                    </p>
                    <div className="mt-3 space-y-2">
                      {stockIssues.map((item) => (
                        <div key={item.id} className="text-red-700 text-sm">
                          • {item.name}: Requested {item.requested}, Available{" "}
                          {item.available}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {cart.map((item) => {
                    const hasValidDiscount =
                      item.hasDiscount &&
                      item.discountPercentage &&
                      isDiscountValid(item);
                    const currentPrice = getCurrentPrice(item);
                    const totalPrice = currentPrice * item.quantity;
                    const originalTotal = item.price * item.quantity;
                    const savings = originalTotal - totalPrice;

                    return (
                      <div
                        className="flex items-center justify-between"
                        key={item.id}
                      >
                        <div className="flex gap-8">
                          <div className="relative w-32 h-32 bg-gray-50 rounded-lg overflow-hidden">
                            <Image
                              src={Object.values(item.images)[0]}
                              alt={item.name}
                              fill
                              className="object-contain"
                            />
                            {/* Discount Badge */}
                            {hasValidDiscount && (
                              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                                {item.discountPercentage}% OFF
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-between">
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                Quantity: {item.quantity}
                              </p>
                              {/* Price Display */}
                              <div className="flex flex-col">
                                {hasValidDiscount ? (
                                  <>
                                    <p className="font-medium text-green-600">
                                      {formatPrice(totalPrice)}
                                    </p>
                                    <p className="text-xs text-gray-500 line-through">
                                      {formatPrice(originalTotal)}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      You save {formatPrice(savings)}
                                    </p>
                                  </>
                                ) : (
                                  <p className="font-medium">
                                    {formatPrice(totalPrice)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item)}
                          className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-all duration-300 text-red-400 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : activeStep === 2 ? (
            <ShippingForm setShippingForm={setShippingForm} />
          ) : activeStep === 3 && shippingForm ? (
            <ConfirmationStep
              shippingForm={shippingForm}
              cart={cart}
              onCancel={() => router.push("/", { scroll: false })}
              onBack={() => router.push("/cart?step=2", { scroll: false })}
              onConfirm={handleConfirmOrder}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Please fill in the shipping form to continue.
            </p>
          )}
        </div>

        {/* SIDEBAR: ONLY SHOW ON STEP 1 */}
        {activeStep === 1 && (
          <div className="w-full shadow-lg border-1 border-gray-100 p-8 rounded-lg flex flex-col gap-8 h-max">
            <h2 className="font-semibold">Cart Details</h2>
            <div className="flex flex-col gap-4">
              {/* Calculate totals with discounts */}
              {(() => {
                const subtotal = cart.reduce(
                  (acc, item) => acc + item.price * item.quantity,
                  0
                );
                const totalWithDiscounts = cart.reduce((acc, item) => {
                  const hasValidDiscount =
                    item.hasDiscount &&
                    item.discountPercentage &&
                    isDiscountValid(item);
                  const currentPrice = getCurrentPrice(item);
                  return acc + currentPrice * item.quantity;
                }, 0);
                const totalSavings = subtotal - totalWithDiscounts;

                return (
                  <>
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-500">Subtotal</p>
                      <p className="font-medium">{formatPrice(subtotal)}</p>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-sm">
                        <p className="text-gray-500">Total Savings</p>
                        <p className="font-medium text-green-600">
                          -{formatPrice(totalSavings)}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-500">Shipping Fee</p>
                      <p className="font-medium">7,000 DT</p>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between">
                      <p className="text-gray-800 font-semibold">Total</p>
                      <p className="font-medium">
                        {formatPrice(totalWithDiscounts)}
                      </p>
                    </div>
                  </>
                );
              })()}

              <button
                onClick={() => {
                  if (!user) {
                    router.push("/login", { scroll: false });
                  } else if (!isCartEmpty && !hasStockIssues) {
                    router.push("/cart?step=2", { scroll: false });
                  }
                }}
                disabled={isCartEmpty || hasStockIssues}
                className={`w-full transition-all duration-300 text-white p-2 rounded-lg flex items-center justify-center gap-2 ${
                  isCartEmpty || hasStockIssues
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-900 cursor-pointer"
                }`}
              >
                {!user
                  ? "Login to Continue"
                  : hasStockIssues
                  ? "Resolve Stock Issues"
                  : "Continue"}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
