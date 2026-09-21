import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Full-width image carousel for the home "students band" (mirrors the live site's
 * 3-slide carousel). Auto-advances, with prev/next arrows, dots, and a counter.
 */
export default function VipcCarousel({ images = [], interval = 5000, className = '' }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  const go = useCallback((dir) => setIndex((i) => (i + dir + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [count, interval]);

  if (count === 0) return null;

  return (
    <div className={`relative w-full overflow-hidden bg-black group ${className}`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          alt={`Vineyard students ${index + 1}`}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      {/* gradient for arrow/counter legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

      {count > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-(--dominant-red) flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => go(1)} aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-(--dominant-red) flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`} />
            ))}
          </div>
          <span className="absolute bottom-3 right-4 text-xs font-semibold text-white/90 bg-black/30 rounded px-2 py-0.5">
            {index + 1}/{count}
          </span>
        </>
      )}
    </div>
  );
}
