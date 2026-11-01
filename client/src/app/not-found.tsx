import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft, Search, ShoppingCart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto text-center px-4">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/SSI-logo.png"
            alt="SSI Logo"
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Soutènement de la Société des Informations
          </h1>
        </div>

        {/* 404 Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-4">404</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or doesn't exist.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
            
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Products
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/products"
              className="flex items-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="text-sm">All Products</span>
            </Link>
            
            <Link
              href="/products?sort=newest"
              className="flex items-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <Search className="w-4 h-4 mr-2" />
              <span className="text-sm">New Arrivals</span>
            </Link>
            
            <Link
              href="/contact"
              className="flex items-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              <span className="text-sm">Contact Us</span>
            </Link>
            
            <Link
              href="/cart"
              className="flex items-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="text-sm">Shopping Cart</span>
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
