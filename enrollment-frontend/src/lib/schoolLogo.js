import circleLogo from '../assets/circlelogo.jpg';

/**
 * The school seal, prepared once per session for jsPDF to embed.
 *
 * Handing jsPDF the bundled asset URL also works, but only because it falls
 * back to a synchronous XHR — which blocks the tab for as long as the fetch
 * takes. Loading it properly costs one promise and nothing afterwards.
 *
 * Never rejects: a document that prints without its seal is a far smaller
 * problem than one that does not print.
 */
let logoPromise = null;

export const loadSchoolLogo = () => {
  if (logoPromise) return logoPromise;

  logoPromise = new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      try {
        // The seal is never printed larger than about 15mm, so 256px is
        // already beyond what a 300dpi printer can use. Scaling down here
        // keeps every generated file small.
        const size = Math.min(256, image.naturalWidth || 256);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);

        resolve({ data: canvas.toDataURL('image/jpeg', 0.92), format: 'JPEG' });
      } catch (error) {
        console.error('School logo could not be prepared', error);
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = circleLogo;
  });

  return logoPromise;
};
