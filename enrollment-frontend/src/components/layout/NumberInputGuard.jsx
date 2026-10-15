import { useEffect } from 'react';

/**
 * Stops the mouse wheel from quietly changing number fields.
 *
 * A focused <input type="number"> treats a wheel tick as a step, so scrolling
 * a form with the cursor still over an amount silently edits it — 600 becomes
 * 599.98 on a step of 0.01, and nobody sees it happen. Blurring the field on
 * wheel leaves the page scrolling normally and the value alone.
 */
const NumberInputGuard = () => {
  useEffect(() => {
    const onWheel = (event) => {
      const field = document.activeElement;
      if (
        field instanceof HTMLInputElement &&
        field.type === 'number' &&
        field === event.target
      ) {
        field.blur();
      }
    };

    document.addEventListener('wheel', onWheel, { capture: true, passive: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, []);

  return null;
};

export default NumberInputGuard;
