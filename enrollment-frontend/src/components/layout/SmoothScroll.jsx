import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Smooth page scrolling for the whole app.
 *
 * It only takes over the main window scroll. Anything that scrolls on its own —
 * modals, dropdowns, tables with their own scrollbar — is left untouched so the
 * existing pages keep behaving the same way.
 */
const SmoothScroll = () => {
  const location = useLocation();

  useEffect(() => {
    // Respect the user's "reduce motion" setting; jumping straight to the
    // position is the accessible behaviour there.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices already scroll smoothly on their own, so leave them native.
      syncTouch: false,
      // Let elements with their own scrollbar (modal bodies, long tables,
      // dropdown lists) keep scrolling natively.
      allowNestedScroll: true,
      // Modals, menus, popovers and toasts are always left to the browser.
      prevent: (node) =>
        node.matches?.('[role="dialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper], [data-sonner-toaster]') ?? false,
    });

    let frame;
    const raf = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Expose it so other code can call window.lenis.scrollTo(...) if needed.
    window.lenis = lenis;

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete window.lenis;
    };
  }, []);

  // Start every page at the top, the way a normal page load behaves.
  useEffect(() => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return null;
};

export default SmoothScroll;
