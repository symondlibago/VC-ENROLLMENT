import genSignature from '../assets/gensig.png';
import regSignature from '../assets/regsig.png';

/**
 * The two scanned signatures the grade slip carries.
 *
 * Kept as PNG rather than flattened to JPEG like the seal is: these are ink
 * on transparency, and a JPEG would paste a white rectangle over whatever the
 * signature is sitting on — including the ruled line it is meant to sit
 * across.
 *
 * Each is measured as well as loaded, so the slip can size it without
 * squashing a signature that was scanned at a different aspect to the other.
 *
 * Never rejects. A slip that prints without a signature can still be signed
 * by hand; one that does not print at all cannot.
 */
const load = (src) =>
  new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      try {
        resolve({
          data: src,
          format: 'PNG',
          width: image.naturalWidth || 1,
          height: image.naturalHeight || 1,
        });
      } catch (error) {
        console.error('Signature could not be prepared', error);
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });

let pending = null;

/** `{ prepared, approved }`, either of which may be null. */
export const loadSignatures = () => {
  if (pending) return pending;

  pending = Promise.all([load(genSignature), load(regSignature)])
    .then(([prepared, approved]) => ({ prepared, approved }))
    .catch(() => ({ prepared: null, approved: null }));

  return pending;
};
