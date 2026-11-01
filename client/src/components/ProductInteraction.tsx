"use client";

import useCartStore from "@/stores/cartStore";
import { ProductType } from "@/types";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { isDiscountValid, getCurrentPrice, formatPrice } from "@/lib/products";

const ProductInteraction = ({
  product,
}: {
  product: ProductType;
}) => {
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCartStore();

  // Get current price (discounted if valid, original if not)
  const currentPrice = getCurrentPrice(product);
  const hasValidDiscount = product.hasDiscount && product.discountPercentage && isDiscountValid(product);

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      // Check stock limit if stock exists
      if (!product.unlimited && product.stock !== undefined && quantity >= product.stock) {
        return; // Don't increment beyond available stock
      }
      setQuantity((prev) => prev + 1);
    } else {
      if (quantity > 1) {
        setQuantity((prev) => prev - 1);
      }
    }
  };

  const handleAddToCart = () => {
    // Check if there's sufficient stock
    if (!product.unlimited && product.stock !== undefined && quantity > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }
    
    addToCart({
      ...product,
      quantity,
    });
    toast.success("Product added to cart")
  };
  
  // Check if product is out of stock
  const isOutOfStock = !product.unlimited && product.stock !== undefined && product.stock === 0;
  const hasLimitedStock = !product.unlimited && product.stock !== undefined && product.stock > 0 && product.stock <= 10;
  
  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* DISCOUNT INFO */}
      {hasValidDiscount && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Special Offer!</span>
              <span className="text-lg font-bold">{formatPrice(currentPrice)}</span>
            </div>
            <div className="text-xs text-green-600">
              You save {formatPrice(product.price - currentPrice)} ({product.discountPercentage}% off original price)
            </div>
          </div>
        </div>
      )}
      
      {/* STOCK STATUS */}
      {(!product.unlimited && product.stock !== undefined) && (
        <div className="text-sm">
          {isOutOfStock ? (
            <span className="text-red-600 font-medium">Out of Stock</span>
          ) : hasLimitedStock ? (
            <span className="text-orange-600 font-medium">Only {product.stock} left in stock</span>
          ) : (
            <span className="text-green-600 font-medium">In Stock</span>
          )}
        </div>
      )}
      
      {/* QUANTITY */}
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-gray-500">Quantity</span>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer border-1 border-gray-300 p-1"
            onClick={() => handleQuantityChange("decrement")}
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span>{quantity}</span>
          <button
            className="cursor-pointer border-1 border-gray-300 p-1"
            onClick={() => handleQuantityChange("increment")}
            disabled={!product.unlimited && product.stock !== undefined && quantity >= product.stock}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* TOTAL PRICE */}
      <div className="text-sm text-gray-600">
        Total: <span className="font-medium">{formatPrice(currentPrice * quantity)}</span>
        {hasValidDiscount && (
          <span className="text-xs text-gray-500 ml-2">
            (Original: {formatPrice(product.price * quantity)})
          </span>
        )}
      </div>
      
      {/* BUTTONS */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`px-4 py-2 rounded-md shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm font-medium ${
          isOutOfStock 
            ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
            : "bg-gray-800 text-white hover:bg-gray-900"
        }`}
      >
        <Plus className="w-4 h-4" />
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
      
      <button 
        className="ring-1 ring-gray-400 shadow-lg text-gray-800 px-4 py-2 rounded-md flex items-center justify-center cursor-pointer gap-2 text-sm font-medium"
        disabled={isOutOfStock}
      >
        <ShoppingCart className="w-4 h-4" />
        Buy this Item
      </button>
    </div>
  );
};

export default ProductInteraction;
