import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, FileText, AlertTriangle } from 'lucide-react';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

const mimeFor = (ext) => {
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'svg') return 'image/svg+xml';
  if (IMAGE_EXTS.includes(ext)) return `image/${ext}`;
  return 'application/octet-stream';
};

export default function FilePreviewModal({ open, onClose, fileName, fetchBlob, onDownload }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [url, setUrl] = useState(null);

  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  const kind = ext === 'pdf' ? 'pdf' : IMAGE_EXTS.includes(ext) ? 'image' : 'unsupported';

  const cleanup = useCallback((u) => { if (u) window.URL.revokeObjectURL(u); }, []);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    let objectUrl = null;

    // Word and other non-previewable types: don't fetch, just show the fallback.
    if (kind === 'unsupported') { setLoading(false); setError(''); setUrl(null); return undefined; }

    setLoading(true);
    setError('');
    (async () => {
      try {
        const blob = await fetchBlob();
        if (!active) return;
        // Re-wrap with the correct MIME so the browser renders it inline.
        const typed = new Blob([blob], { type: mimeFor(ext) });
        objectUrl = window.URL.createObjectURL(typed);
        setUrl(objectUrl);
      } catch (e) {
        if (active) setError('Could not load this file for preview.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; cleanup(objectUrl); };
  }, [open, ext, kind, fetchBlob, cleanup]);

  const handleClose = () => { cleanup(url); setUrl(null); onClose?.(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white shadow-2xl w-screen h-screen flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — school brand + close only */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-(--dominant-red) text-white">
              <span className="font-bold tracking-wide text-lg">VIPC LMS</span>
              <button
                onClick={handleClose}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-white text-(--dominant-red) hover:bg-gray-100 shadow-sm transition cursor-pointer"
                title="Close preview"
              >
                <X className="w-5 h-5" /> Close
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 bg-gray-100">
              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading preview…</span>
                </div>
              )}

              {!loading && error && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 px-6 text-center">
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                  <p className="text-sm">{error}</p>
                  {onDownload && (
                    <button onClick={onDownload} className="mt-2 flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-(--dominant-red) text-white">
                      <Download className="w-4 h-4" /> Download instead
                    </button>
                  )}
                </div>
              )}

              {!loading && !error && kind === 'unsupported' && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 px-6 text-center">
                  <FileText className="w-10 h-10 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">In-browser preview isn’t available for .{ext} files</p>
                  <p className="text-xs text-gray-500 max-w-sm">Word documents can’t be displayed directly in the browser. Download it to view in Word, or ask submitters to upload PDFs for instant preview.</p>
                  {onDownload && (
                    <button onClick={onDownload} className="mt-2 flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-(--dominant-red) text-white">
                      <Download className="w-4 h-4" /> Download to view
                    </button>
                  )}
                </div>
              )}

              {!loading && !error && url && kind === 'pdf' && (
                <iframe title={fileName} src={url} className="w-full h-full border-0" />
              )}

              {!loading && !error && url && kind === 'image' && (
                <div className="h-full overflow-auto flex items-center justify-center p-4">
                  <img src={url} alt={fileName} className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
