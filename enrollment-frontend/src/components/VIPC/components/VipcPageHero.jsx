import { motion } from 'framer-motion';

/** Compact maroon banner used at the top of inner pages. */
export default function VipcPageHero({ eyebrow, title, subtitle }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-(--dominant-red) via-[#8a2227] to-[#5e1418] text-white">
      <div className="absolute inset-0 opacity-[0.13] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(135deg, #ffd740 0 3px, transparent 3px 26px)' }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
        {eyebrow && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-amber-300 font-bold tracking-[0.2em] text-xs uppercase">{eyebrow}</motion.p>
        )}
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-3 font-serif text-4xl sm:text-5xl font-bold">{title}</motion.h1>
        {subtitle && (
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-4 text-white/85 max-w-2xl mx-auto">{subtitle}</motion.p>
        )}
      </div>
    </section>
  );
}
