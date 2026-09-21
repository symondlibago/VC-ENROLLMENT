import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { SCHOOL, PROGRAM_NAV } from '../data/vipcContent';

export const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'programs', label: 'Our Programs', dropdown: true },
  { id: 'admissions', label: 'Admissions' },
  { id: 'news', label: 'News & Articles' },
  { id: 'contact', label: 'Contact Us' },
];

export default function VipcNavbar({ current, onNavigate, onOnlineEnrollment }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progOpen, setProgOpen] = useState(false);
  const [mobileProgOpen, setMobileProgOpen] = useState(false);
  const progRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const h = (e) => { if (progRef.current && !progRef.current.contains(e.target)) setProgOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (id, anchor = null) => {
    onNavigate(id, anchor);
    setMobileOpen(false);
    setProgOpen(false);
    setMobileProgOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <button onClick={() => go('home')} className="flex items-center gap-3 cursor-pointer shrink-0">
            <img src={SCHOOL.logo} alt={SCHOOL.shortName} className="h-70 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = current === item.id;
              if (item.dropdown) {
                return (
                  <div key={item.id} ref={progRef} className="relative">
                    <button
                      onClick={() => setProgOpen((o) => !o)}
                      className={`relative flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${active ? 'text-(--dominant-red)' : 'text-gray-700 hover:text-(--dominant-red)'}`}
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${progOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {progOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{ duration: 0.16 }}
                          className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1.5"
                        >
                          {PROGRAM_NAV.map((p) => (
                            <button key={p.label} onClick={() => go('programs', p.target)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-(--whitish-pink) hover:text-(--dominant-red) transition-colors">
                              {p.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <button key={item.id} onClick={() => go(item.id)}
                  className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${active ? 'text-(--dominant-red)' : 'text-gray-700 hover:text-(--dominant-red)'}`}>
                  {item.label}
                  {active && <motion.span layoutId="vipcNavUnderline" className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-(--dominant-red)" />}
                </button>
              );
            })}
          </nav>

          {/* CTA + MEMO + mobile toggle */}
          <div className="flex items-center gap-2">
            <button onClick={onOnlineEnrollment}
              className="hidden sm:inline-flex items-center gap-2 bg-(--dominant-red) hover:bg-red-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
              Online Enrollment <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => go('news')}
              className="hidden md:inline-flex items-center bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold tracking-wider px-3 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer">
              MEMO
            </button>
            <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer" aria-label="Menu">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden bg-white border-t border-gray-100">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                if (item.dropdown) {
                  return (
                    <div key={item.id}>
                      <button onClick={() => setMobileProgOpen((o) => !o)}
                        className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${current === item.id ? 'bg-(--whitish-pink) text-(--dominant-red)' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {item.label}
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileProgOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileProgOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-3">
                            {PROGRAM_NAV.map((p) => (
                              <button key={p.label} onClick={() => go('programs', p.target)}
                                className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-(--whitish-pink) hover:text-(--dominant-red) transition-colors">
                                {p.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                  <button key={item.id} onClick={() => go(item.id)}
                    className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${current === item.id ? 'bg-(--whitish-pink) text-(--dominant-red)' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {item.label}
                  </button>
                );
              })}
              <button onClick={() => { onOnlineEnrollment(); setMobileOpen(false); }}
                className="flex items-center justify-center gap-2 w-full bg-(--dominant-red) text-white text-sm font-bold px-5 py-3 rounded-xl mt-2">
                Online Enrollment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
