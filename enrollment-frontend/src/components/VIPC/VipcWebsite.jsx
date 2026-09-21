import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VipcNavbar from './components/VipcNavbar';
import VipcFooter from './components/VipcFooter';
import VipcHome from './pages/VipcHome';
import VipcAbout from './pages/VipcAbout';
import VipcPrograms from './pages/VipcPrograms';
import VipcAdmissions from './pages/VipcAdmissions';
import VipcNews from './pages/VipcNews';
import VipcContact from './pages/VipcContact';
import { setPageSeo } from './data/seo';
import Lenis from '../../lib/lenis.mjs';

export default function VipcWebsite({ onOnlineEnrollment }) {
  const [page, setPage] = useState('home');
  const pendingAnchor = useRef(null);
  const lenisRef = useRef(null);

  // Offset (px) so deep-linked sections land just below the sticky navbar.
  const ANCHOR_OFFSET = 112;

  // Initialise Lenis smooth scrolling for the marketing site only; it is torn
  // down when the visitor leaves (e.g. heads into Online Enrollment).
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;
    let rafId;
    const raf = (time) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToTop = () => {
    if (lenisRef.current) lenisRef.current.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Smoothly scroll to a section by id, retrying until it has mounted
  // (the page swap waits for AnimatePresence's exit animation to finish).
  const scrollToAnchor = (anchorId) => {
    let tries = 0;
    const tick = () => {
      const el = document.getElementById(anchorId);
      if (el) {
        if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -ANCHOR_OFFSET });
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (tries++ < 40) setTimeout(tick, 50);
    };
    setTimeout(tick, 60);
  };

  // On page change, update SEO (title/description) and jump to anchor or top.
  useEffect(() => {
    setPageSeo(page);
    if (pendingAnchor.current) {
      const a = pendingAnchor.current;
      pendingAnchor.current = null;
      scrollToAnchor(a);
    } else {
      scrollToTop();
    }
  }, [page]);

  const navigate = (id, anchorId = null) => {
    // Already on the target page — scroll directly (no page change to react to).
    if (id === page) {
      if (anchorId) scrollToAnchor(anchorId);
      else scrollToTop();
      return;
    }
    pendingAnchor.current = anchorId;
    setPage(id);
  };

  const PAGES = {
    home: <VipcHome onNavigate={navigate} onOnlineEnrollment={onOnlineEnrollment} />,
    about: <VipcAbout onOnlineEnrollment={onOnlineEnrollment} />,
    programs: <VipcPrograms onOnlineEnrollment={onOnlineEnrollment} />,
    admissions: <VipcAdmissions onNavigate={navigate} onOnlineEnrollment={onOnlineEnrollment} />,
    news: <VipcNews onOnlineEnrollment={onOnlineEnrollment} />,
    contact: <VipcContact onOnlineEnrollment={onOnlineEnrollment} />,
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <VipcNavbar current={page} onNavigate={navigate} onOnlineEnrollment={onOnlineEnrollment} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            {PAGES[page] || PAGES.home}
          </motion.div>
        </AnimatePresence>
      </main>

      <VipcFooter onNavigate={navigate} onOnlineEnrollment={onOnlineEnrollment} />
    </div>
  );
}
