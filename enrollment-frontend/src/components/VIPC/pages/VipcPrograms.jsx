import { motion } from 'framer-motion';
import { GraduationCap, School, ChefHat, Layers, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import VipcPageHero from '../components/VipcPageHero';
import VipcImage from '../components/VipcImage';
import { PROGRAM_GROUPS } from '../data/vipcContent';

const ICONS = { GraduationCap, School, ChefHat, Layers };

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] } }),
};

// One alternating image/text program row (mirrors the live Bachelor Programs page).
function ProgramRow({ program, index, onApply }) {
  const flip = index % 2 === 1;
  return (
    <motion.div
      variants={fadeUp} custom={index} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
      className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
    >
      <div className={`relative ${flip ? 'lg:order-2' : ''}`}>
        <VipcImage src={program.image} caption={program.name} natural className="rounded-3xl shadow-xl ring-1 ring-black/5" />
        <div className={`hidden lg:block absolute -z-10 w-40 h-40 rounded-3xl bg-(--whitish-pink) ${flip ? '-right-5 -bottom-5' : '-left-5 -bottom-5'}`} />
      </div>
      <div className={flip ? 'lg:order-1' : ''}>
        {program.meta && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-(--whitish-pink) text-(--dominant-red) rounded-full px-3 py-1 mb-3">
            <Clock className="w-3.5 h-3.5" /> {program.meta}
          </span>
        )}
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{program.name}</h3>
        <p className="mt-4 text-gray-600 leading-relaxed">{program.text}</p>
        <button onClick={onApply}
          className="mt-6 inline-flex items-center gap-2 border-2 border-(--dominant-red) text-(--dominant-red) hover:bg-(--dominant-red) hover:text-white font-bold px-7 py-3 rounded-full transition-all cursor-pointer">
          Apply Now <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function VipcPrograms({ onOnlineEnrollment }) {
  return (
    <div>
      <VipcPageHero
        eyebrow="Our Programs"
        title="Academic Programs & Courses"
        subtitle="A diverse range of programs designed to equip our graduates with the skills and expertise needed to succeed in today's rapidly changing world."
      />

      {PROGRAM_GROUPS.map((g, gi) => {
        const Icon = ICONS[g.icon] || GraduationCap;
        const hasImages = g.programs.some((p) => p.image);
        return (
          <section key={g.id} id={g.id} className={`py-20 scroll-mt-28 ${gi % 2 === 0 ? 'bg-white' : 'bg-(--snowy-white)'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Centered group header (like "BACHELOR DEGREE PROGRAMS (4-Year Courses)") */}
              <div className="text-center max-w-3xl mx-auto mb-14">
                <div className="w-16 h-16 rounded-2xl bg-(--dominant-red) text-white flex items-center justify-center mx-auto mb-5 shadow-md">
                  <Icon className="w-8 h-8" />
                </div>
                <p className="text-(--dominant-red) font-bold tracking-[0.2em] text-xs uppercase">{g.badge}</p>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">{g.label}</h2>
                <p className="mt-4 text-gray-600">{g.blurb}</p>
              </div>

              {hasImages ? (
                <div className="space-y-16 lg:space-y-20">
                  {g.programs.map((p, i) => (
                    <ProgramRow key={p.name} program={p} index={i} onApply={onOnlineEnrollment} />
                  ))}
                </div>
              ) : (
                // Image-less institutes -> compact card grid
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {g.programs.map((p, i) => (
                    <motion.div key={p.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
                      className="group bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-200 transition-all">
                      <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{p.text}</p>
                      <button onClick={onOnlineEnrollment}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-(--dominant-red) cursor-pointer">
                        Apply Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Program Registrations */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Program Registrations</h2>
          <p className="mt-2 text-gray-500 text-sm">Our programs are registered with the following national agencies.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
            <img src="/vipc/acc-tesda.avif" alt="TESDA" className="h-16 sm:h-24 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <img src="/vipc/acc-ched.avif" alt="CHED" className="h-16 sm:h-24 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <img src="/vipc/acc-deped.avif" alt="DepEd" className="h-16 sm:h-24 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        </div>
      </section>

      {/* Admission note + CTA */}
      <section className="bg-(--dominant-red) text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-amber-300" /> Admission is quick and easy
          </div>
          <h2 className="mt-5 font-serif text-3xl font-bold">Found the program for you?</h2>
          <p className="mt-3 text-white/85">Apply for any program through our fast, fully online enrollment.</p>
          <button onClick={onOnlineEnrollment}
            className="mt-8 inline-flex items-center gap-2 bg-white text-(--dominant-red) font-bold px-8 py-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
            Start Online Enrollment <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
