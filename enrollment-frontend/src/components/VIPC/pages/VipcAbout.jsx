import { motion } from 'framer-motion';
import { Eye, Target, ShieldCheck, Building2, Globe2, ArrowRight, Flag, GraduationCap, HeartHandshake, Users, RefreshCw, Award } from 'lucide-react';
import VipcImage from '../components/VipcImage';
import { SCHOOL, ABOUT, FACILITY_GALLERY } from '../data/vipcContent';

const TIMELINE = [
  { year: '2007', title: 'VIPC Opened Its Doors', icon: Flag, text: 'Initially offering 2-year programs — a bundle of TESDA-registered programs mainly focused on the hospitality and tourism sector.' },
  { year: '2009', title: 'First Graduation Rites', icon: GraduationCap, text: 'Held its first graduation rites for the 2-year programs, marking the first batch of Vineyard graduates.' },
  { year: 'Today', title: 'A Full-Fledged College', icon: Building2, text: 'Now offering bachelor degrees, senior high school, and specialized TESDA institutes — registered with DepEd, TESDA, CHED, and DOT.' },
];

const STRENGTH_ICONS = { ShieldCheck, Building2, Globe2 };

// Icon + short label for each core value (paired by index with ABOUT.coreValues).
const CORE_VALUE_META = [
  { icon: HeartHandshake, title: 'Respect & Care' },
  { icon: Users, title: 'Collaboration' },
  { icon: RefreshCw, title: 'Adaptability' },
  { icon: Award, title: 'Leadership' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] } }),
};

export default function VipcAbout({ onOnlineEnrollment }) {
  return (
    <div>
      {/* Building banner hero (real campus photo) */}
      <section className="relative h-[300px] sm:h-[420px] overflow-hidden">
        <img src="/vipc/about-hero.avif" alt="Vineyard International Polytechnic College" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center text-white">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-amber-300 font-bold tracking-[0.3em] text-xs uppercase">About Us</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-3 font-serif text-4xl sm:text-6xl font-bold drop-shadow-lg">Our School</motion.h1>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p className="text-(--dominant-red) font-bold tracking-wider text-sm uppercase">Who We Are</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">A non-stock, non-profit institution of quality education</h2>
            <p className="mt-6 text-gray-600 leading-relaxed">{ABOUT.intro}</p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Established in {SCHOOL.established}, {SCHOOL.name} is committed to providing quality basic,
              technical/vocational, higher, and advanced education that is responsive to the needs of the times and society.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <VipcImage src="/vipc/inst-3.avif" caption="Vineyard Campus" icon={Building2} className="rounded-3xl aspect-[4/3] shadow-xl" />
          </motion.div>
        </div>
      </section>

      {/* Strengths */}
      <section className="py-16 bg-(--whitish-pink)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {ABOUT.strengths.map((s, i) => {
              const Icon = STRENGTH_ICONS[s.icon] || ShieldCheck;
              return (
                <motion.div key={s.title} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                  className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-(--dominant-red) text-white flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{s.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-7">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl p-9 bg-gradient-to-br from-(--dominant-red) to-[#5e1418] text-white">
            <Eye className="w-10 h-10 text-amber-300 mb-4" />
            <h3 className="font-serif text-2xl font-bold">Our Vision</h3>
            <p className="mt-4 text-white/90 leading-relaxed">{ABOUT.vision}</p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="rounded-3xl p-9 bg-(--whitish-pink) border border-red-100">
            <Target className="w-10 h-10 text-(--dominant-red) mb-4" />
            <h3 className="font-serif text-2xl font-bold text-gray-900">Our Mission</h3>
            <p className="mt-4 text-gray-700 leading-relaxed">{ABOUT.mission}</p>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-(--snowy-white)">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-(--dominant-red) font-bold tracking-wider text-sm uppercase">Our Journey</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">A Timeline of Excellence</h2>
          </div>
          <div className="relative">
            <div className="absolute left-5 sm:left-1/2 sm:-translate-x-px top-2 bottom-2 w-0.5 bg-red-100" />
            <div className="space-y-10">
              {TIMELINE.map((t, i) => {
                const Icon = t.icon;
                const left = i % 2 === 0;
                return (
                  <motion.div key={t.year} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                    className={`relative flex sm:items-center gap-6 ${left ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                    <div className="absolute left-5 sm:left-1/2 sm:-translate-x-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-(--dominant-red) text-white flex items-center justify-center ring-4 ring-white shadow z-10">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={`ml-16 sm:ml-0 sm:w-1/2 ${left ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'}`}>
                      <span className="text-(--dominant-red) font-extrabold text-lg">{t.year}</span>
                      <h3 className="font-bold text-gray-900 mt-0.5">{t.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{t.text}</p>
                    </div>
                    <div className="hidden sm:block sm:w-1/2" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Program Registrations */}
      <section className="py-14 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 font-semibold text-sm uppercase tracking-wider mb-8">Program Registrations</p>
          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
            <img src="/vipc/acc-tesda.avif" alt="TESDA" className="h-16 sm:h-20 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <img src="/vipc/acc-ched.avif" alt="CHED" className="h-16 sm:h-20 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <img src="/vipc/acc-deped.avif" alt="DepEd" className="h-16 sm:h-20 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="relative overflow-hidden py-20 bg-(--snowy-white)">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-(--dominant-red) font-bold tracking-[0.2em] text-xs uppercase">What We Stand For</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">Our Core Values</h2>
            <p className="mt-3 text-gray-600">The principles that guide our community every day.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ABOUT.coreValues.map((v, i) => {
              const meta = CORE_VALUE_META[i] || CORE_VALUE_META[0];
              const Icon = meta.icon;
              return (
                <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                  className="group relative overflow-hidden bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                  {/* number watermark */}
                  <span className="absolute -top-2 right-1 font-serif text-7xl font-bold text-(--whitish-pink) select-none pointer-events-none group-hover:text-red-100 transition-colors">
                    0{i + 1}
                  </span>
                  {/* animated top accent */}
                  <span className="absolute left-0 top-0 h-1 w-0 bg-(--dominant-red) group-hover:w-full transition-all duration-500" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-(--dominant-red) to-[#5e1418] text-white flex items-center justify-center shadow-md mb-5 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-gray-900">{meta.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{v}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Institution — facility gallery (real campus photos) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-(--dominant-red) font-bold tracking-wider text-sm uppercase">Campus Tour</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">Our Institution</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Industry-standard, air-conditioned facilities that simulate the real workplace.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FACILITY_GALLERY.map((f, i) => (
              <motion.div
                key={f.src} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl aspect-square shadow-sm"
              >
                <img src={f.src} alt={f.label} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white font-semibold text-sm">{f.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-(--dominant-red) text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">Become part of the Vineyard community</h2>
          <button onClick={onOnlineEnrollment}
            className="mt-7 inline-flex items-center gap-2 bg-white text-(--dominant-red) font-bold px-7 py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
            Online Enrollment <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
