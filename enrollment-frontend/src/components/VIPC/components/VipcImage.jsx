import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

/**
 * Image with a branded fallback. Tries to load `src` (e.g. a real photo dropped
 * into /public/vipc/...); if it's missing or fails, shows a maroon gradient
 * placeholder with an icon + caption. This lets the site look polished now and
 * automatically pick up real photos later — just drop the file at the `src` path.
 */
// `natural` shows the full image at its own aspect ratio (no cropping) — use it
// when cropping would cut people/details off. Default keeps the cover-fill behavior.
export default function VipcImage({ src, alt = '', caption, icon: Icon = ImageIcon, className = '', imgClassName = '', natural = false }) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;

  if (natural) {
    return showImg ? (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`w-full h-auto block ${className} ${imgClassName}`}
      />
    ) : (
      <div className={`relative overflow-hidden bg-gradient-to-br from-(--dominant-red) to-red-900 min-h-[280px] flex flex-col items-center justify-center text-white/90 p-6 text-center ${className}`}>
        <Icon className="w-10 h-10 mb-2" strokeWidth={1.5} />
        {caption && <span className="text-xs font-medium tracking-wide">{caption}</span>}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-(--dominant-red) to-red-900 ${className}`}>
      {showImg ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover ${imgClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 p-6 text-center">
          {/* subtle chevron motif */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 16px)' }} />
          <Icon className="w-10 h-10 mb-2 relative" strokeWidth={1.5} />
          {caption && <span className="text-xs font-medium tracking-wide relative">{caption}</span>}
        </div>
      )}
    </div>
  );
}
