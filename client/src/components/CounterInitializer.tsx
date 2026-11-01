"use client";

import { useEffect } from "react";
import { initializeOrderCounter } from "@/lib/initCounter";

const CounterInitializer = () => {
  useEffect(() => {
    // Initialize the order counter when the app loads
    initializeOrderCounter();
  }, []);

  return null; // This component doesn't render anything
};

export default CounterInitializer;
