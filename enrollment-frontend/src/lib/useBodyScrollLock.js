import { useEffect } from 'react';

/**
 * Stops the page behind a dialog from scrolling while it is open.
 *
 * Two things have to be told, not one. Hiding the body's overflow handles
 * native and touch scrolling, but the app also runs Lenis, which drives the
 * window scroll from its own animation loop and keeps its own idea of the
 * page height and target position. Left running against a locked body those
 * two drift apart, and when the dialog closes Lenis spends the next while
 * easing towards a position that no longer exists — which is the lurching,
 * laggy scroll you get after closing a modal.
 *
 * So the lock also pauses Lenis, and on release re-measures the page before
 * letting it resume.
 *
 * The scrollbar's width is given back as padding, otherwise hiding it makes
 * the page jump sideways the moment the dialog appears. A counter keeps two
 * stacked dialogs from fighting over the lock: only the last one to close
 * gives the page back.
 */
let locks = 0;
let previousOverflow = '';
let previousPadding = '';

export const useBodyScrollLock = (active = true) => {
  useEffect(() => {
    if (!active) return undefined;

    if (locks === 0) {
      const { body } = document;
      const gap = window.innerWidth - document.documentElement.clientWidth;

      previousOverflow = body.style.overflow;
      previousPadding = body.style.paddingRight;

      body.style.overflow = 'hidden';
      if (gap > 0) {
        body.style.paddingRight = `${gap}px`;
      }

      window.lenis?.stop();
    }

    locks += 1;

    return () => {
      locks -= 1;

      if (locks > 0) return;

      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;

      // The page is scrollable again only after the styles above are applied,
      // so Lenis is re-measured on the next frame rather than this one.
      requestAnimationFrame(() => {
        window.lenis?.resize();
        window.lenis?.start();
      });
    };
  }, [active]);
};

export default useBodyScrollLock;
