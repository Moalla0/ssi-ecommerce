"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const Footer = () => {
  const { user } = useAuth();

  return (
    <div className="mt-16 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between md:gap-0 bg-gray-800 p-8 rounded-lg">
      <div className="flex flex-col gap-4 items-center md:items-start">
        <Link href="/" className="flex items-center">
          <p className="hidden md:block text-md font-medium tracking-wider text-white">
            Soutènement de la Société des Informations.
          </p>
        </Link>
        <p className="text-sm text-gray-400">© 2025 All rights reserved.</p>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">Company</p>
        <Link href="/" className="hover:text-white transition-colors">Homepage</Link>
        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        <Link href="/products" className="hover:text-white transition-colors">All Products</Link>
        <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">Products</p>
        <Link href="/products" className="hover:text-white transition-colors">All Products</Link>
        <Link href="/products?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link>
        <Link href="/products?sort=desc" className="hover:text-white transition-colors">Best Sellers</Link>
        <Link href="/products" className="hover:text-white transition-colors">On Sale</Link>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">Account</p>
        {user ? (
          <>
            <Link href="/profile" className="hover:text-white transition-colors">My Profile</Link>
            <Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
            <Link href="/products" className="hover:text-white transition-colors">Browse Products</Link>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Footer;
