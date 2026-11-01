"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { fetchProducts, formatPrice } from "@/lib/products";
import { Product as ProductType } from "@shared/types";
import Link from "next/link";
import Image from "next/image";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const products = await fetchProducts({
          searchTerm: query.trim(),
          page: 1,
          productsPerPage: 20, // Limit results for modal
        });
        setResults(products);
        setHasSearched(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleResultClick = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Search className="h-5 w-5 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-lg outline-none"
              />
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Searching...</span>
                </div>
              )}

              {!isSearching && query && hasSearched && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Search className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">No products found</p>
                  <p className="text-xs">Try different keywords</p>
                </div>
              )}

              {!isSearching && !query && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Search className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">Start typing to search products</p>
                </div>
              )}

              {!isSearching && results.length > 0 && (
                <div className="p-2">
                  <div className="text-sm text-gray-500 mb-3 px-2">
                    {results.length} result{results.length !== 1 ? "s" : ""}{" "}
                    found
                  </div>
                  <div className="space-y-2">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {product.images &&
                          Object.values(product.images)[0] ? (
                            <Image
                              src={Object.values(product.images)[0] as string}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Search className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          {product.brand && (
                            <p className="text-sm text-gray-500 truncate">
                              {product.brand}
                            </p>
                          )}
                          <p className="text-sm font-medium text-blue-600">
                            {product.price
                              ? formatPrice(product.price)
                              : "Price N/A"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {results.length >= 20 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <Link
                        href={`/products?q=${encodeURIComponent(query)}`}
                        onClick={onClose}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View all results for "{query}"
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchModal;
