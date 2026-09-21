import { motion } from 'framer-motion';
import {
  ArrowRight, UserPlus, Repeat, Award, GraduationCap, Heart, MessageCircle, Eye, ChevronRight,
} from 'lucide-react';
import VipcImage from '../components/VipcImage';
import VipcCarousel from '../components/VipcCarousel';
import { SCHOOL, WELCOME_PARAGRAPHS, ENROLL_CATEGORIES, NEWS } from '../data/vipcContent';

const CAROUSEL = ['/vipc/carousel.avif', '/vipc/carousel2.avif', '/vipc/carousel3.avif'];

const ENROLL_ICONS = { UserPlus, Repeat, Award, GraduationCap };

// Program category shortcuts shown in the green band (deep-link into Programs page).
const PROGRAM_HIGHLIGHTS = [
  { label: 'Bachelor Programs', target: 'bachelor' },
  { label: 'Senior High School', target: 'senior-high' },
  { label: 'Culinary Institute', target: 'culinary' },
  { label: 'Cruise Line & 2-Year', target: 'two-year' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] } }),
};

const Chevrons = ({ side }) => (
  <div
    className={`hidden md:block absolute top-0 bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} w-1/4 opacity-30 pointer-events-none`}
    style={{
      backgroundImage:
        'repeating-linear-gradient(135deg, transparent 0 10px, #ffd740 10px 12px, transparent 12px 22px),' +
        'repeating-linear-gradient(45deg, transparent 0 10px, #ffd740 10px 12px, transparent 12px 22px)',
      backgroundSize: '44px 44px',
      maskImage: side === 'left' ? 'linear-gradient(90deg, #000, transparent)' : 'linear-gradient(270deg, #000, transparent)',
      WebkitMaskImage: side === 'left' ? 'linear-gradient(90deg, #000, transparent)' : 'linear-gradient(270deg, #000, transparent)',
    }}
  />
);

export default function VipcHome({ onNavigate, onOnlineEnrollment }) {
  return (
    <div>
      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-(--dominant-red) to-[#7e1d22] text-white">
        <Chevrons side="left" />
        <Chevrons side="right" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15]"
          >
            {SCHOOL.tagline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 text-amber-200 tracking-[0.35em] font-semibold text-sm sm:text-base"
          >
            {SCHOOL.subTagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-4 justify-center"
          >
            <button onClick={onOnlineEnrollment}
              className="inline-flex items-center gap-2 bg-white text-(--dominant-red) font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
              Enroll Now <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => onNavigate('programs')}
              className="inline-flex items-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold px-7 py-3.5 rounded-xl transition-all cursor-pointer">
              Explore Programs
            </button>
          </motion.div>
        </div>
      </section>

      {/* ───────────── Welcome ───────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <p className="text-(--dominant-red) font-bold tracking-wider text-sm uppercase">Welcome</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">
              Welcome to {SCHOOL.name}
            </h2>
            <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
              {WELCOME_PARAGRAPHS.map((p, i) => (
                <p key={i} className={i === WELCOME_PARAGRAPHS.length - 1 ? 'font-semibold text-gray-800' : ''}>{p}</p>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <VipcImage src="/vipc/welcome.avif" caption="Vineyard Students" className="rounded-full aspect-square w-full max-w-md mx-auto shadow-2xl ring-8 ring-(--whitish-pink)" />
          </motion.div>
        </div>
      </section>

      {/* ───────────── Green programs band ───────────── */}
      <section className="relative overflow-hidden text-white">
        {/* Real campus photo behind a deep-green wash (editorial, not a flat block) */}
        <img src="/vipc/prog-culinary-3.avif" alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1d4524] via-[#286036]/92 to-[#2f6b3d]/45" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-28">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
            className="max-w-2xl">
            <p className="text-amber-300 font-bold tracking-[0.25em] text-xs uppercase">Our Programs</p>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.12]">
              A diverse range of programs to help you succeed in a changing world.
            </h2>
            <p className="mt-5 text-white/85 text-lg leading-relaxed max-w-xl">
              From bachelor&rsquo;s degrees to senior high, culinary arts, and TESDA-registered diplomas —
              built around hands-on, industry-aligned training.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button onClick={() => onNavigate('programs')}
                className="inline-flex items-center gap-2 bg-white text-[#1d4524] hover:bg-amber-300 font-bold px-7 py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                Explore All Programs <ArrowRight className="w-5 h-5" />
              </button>
              <span className="text-sm text-white/70">Registered with TESDA · CHED · DepEd</span>
            </div>

            {/* Program quick links — editorial row, not cards */}
            <div className="mt-12 pt-7 border-t border-white/20 flex flex-wrap gap-x-8 gap-y-3">
              {PROGRAM_HIGHLIGHTS.map((p) => (
                <button key={p.target} onClick={() => onNavigate('programs', p.target)}
                  className="group inline-flex items-center gap-2 font-semibold text-white/85 hover:text-amber-300 transition-colors cursor-pointer">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
                  {p.label}
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── Students carousel ───────────── */}
      <VipcCarousel images={CAROUSEL} className="h-[300px] sm:h-[460px]" />

      {/* ───────────── Enrollment categories ───────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {ENROLL_CATEGORIES.map((c, i) => {
              const Icon = ENROLL_ICONS[c.icon] || UserPlus;
              return (
                <motion.button
                  key={c.label} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                  onClick={() => onNavigate('admissions')}
                  className="group text-center bg-(--whitish-pink) hover:bg-(--dominant-red) rounded-2xl p-8 transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white text-(--dominant-red) flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-gray-900 group-hover:text-white transition-colors">{c.label}</h3>
                  <p className="mt-1.5 text-sm text-gray-500 group-hover:text-white/85 transition-colors">{c.text}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── Latest events & news ───────────── */}
      <section className="py-16 bg-(--snowy-white)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-12">
            <span className="bg-(--dominant-red) text-white font-bold tracking-wider px-8 py-3 rounded-full shadow-md text-sm sm:text-base">
              OUR LATEST EVENTS &amp; NEWS
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {NEWS.slice(0, 4).map((n, i) => (
              <motion.article
                key={n.title} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all"
              >
                <VipcImage src={n.image} caption={n.category} className="aspect-[16/10]" />
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
                    <span className="bg-(--whitish-pink) text-(--dominant-red) rounded-full px-2.5 py-0.5">{n.category}</span>
                    <span>{n.date}</span>
                    {n.readTime && <span>· {n.readTime}</span>}
                  </div>
                  <h3 className="mt-3 font-bold text-lg text-(--dominant-red) leading-snug">{n.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{n.excerpt}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {n.views} views</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {n.comments}</span>
                    <span className="flex items-center gap-1 ml-auto"><Heart className="w-3.5 h-3.5" /> {n.likes}</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => onNavigate('news')}
              className="inline-flex items-center gap-2 border-2 border-gray-300 hover:border-(--dominant-red) hover:text-(--dominant-red) text-gray-700 font-semibold px-7 py-3 rounded-full transition-all cursor-pointer">
              View More <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#5e1418] to-(--dominant-red) text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #ffd740 0 3px, transparent 3px 26px)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">Ready to start your journey?</h2>
          <p className="mt-4 text-white/85 max-w-xl mx-auto">
            Join our community and shape the leaders of tomorrow. Enroll online in just a few minutes.
          </p>
          <button onClick={onOnlineEnrollment}
            className="mt-8 inline-flex items-center gap-2 bg-white text-(--dominant-red) font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
            Begin Online Enrollment <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
