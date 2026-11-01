"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ProductGallery = ({ images }: { images: Record<string, string> }) => {
  const imageEntries = useMemo(() => Object.entries(images) as [string, string][], [images]);
  const [index, setIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const clampIndex = useCallback((i: number) => {
    if (i < 0) return imageEntries.length - 1;
    if (i >= imageEntries.length) return 0;
    return i;
  }, [imageEntries.length]);

  const goPrev = useCallback(() => setIndex((i) => clampIndex(i - 1)), [clampIndex]);
  const goNext = useCallback(() => setIndex((i) => clampIndex(i + 1)), [clampIndex]);

  if (!imageEntries.length) return null;

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape" && lightboxOpen) setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, lightboxOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      if (touchDeltaX.current > 0) goPrev(); else goNext();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const selectedKey = imageEntries[index]?.[0];
  const selectedSrc = imageEntries[index]?.[1];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="w-full relative aspect-[2/3] group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {selectedSrc && (
          <Image
            src={selectedSrc}
            alt={selectedKey || "product"}
            fill
            priority
            className="object-contain rounded-md"
          />
        )}
        {imageEntries.length > 1 && (
          <>
            <button
              aria-label="Previous"
              onClick={goPrev}
              className="flex absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-white/60 backdrop-blur-sm shadow hover:bg-black/60 z-20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button
              aria-label="Next"
              onClick={goNext}
              className="flex absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-white/60 backdrop-blur-sm shadow hover:bg-black/60 z-20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </>
        )}
        <button
          aria-label="Open image"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 z-10"
        />
      </div>
      {imageEntries.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {imageEntries.map(([key, src], i) => (
            <button
              key={key}
              onClick={() => setIndex(i)}
              className={`relative aspect-square rounded-md overflow-hidden border ${
                i === index ? "border-black" : "border-gray-200"
              }`}
            >
              <Image src={src} alt={key} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button aria-label="Close" onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white text-2xl">×</button>
          <div className="relative w-[90vw] max-w-4xl aspect-[3/2]">
            <Image src={selectedSrc} alt={selectedKey || "product"} fill className="object-contain" />
            {imageEntries.length > 1 && (
              <>
                <button aria-label="Previous" onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white/90 text-3xl">‹</button>
                <button aria-label="Next" onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white/90 text-3xl">›</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;


