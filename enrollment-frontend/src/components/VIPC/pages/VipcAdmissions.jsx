import { motion } from 'framer-motion';
import {
  GraduationCap, Briefcase, Ship, UserPlus, Repeat, RotateCcw, School,
  FileText, ClipboardList, CreditCard, BadgeCheck, CheckCircle2, ArrowRight,
  HelpCircle, Hash, PlayCircle,
} from 'lucide-react';
import VipcPageHero from '../components/VipcPageHero';

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] } }),
};

// Flagship programs to spotlight (BSBA, BSHM, Cruise Line Services).
const HIGHLIGHTED = [
  {
    icon: Briefcase,
    tag: '4-Year Degree',
    code: 'BSBA',
    name: 'BS in Business Administration',
    text: 'Major in Marketing Management or Human Resource Management and build the business, leadership, and communication skills employers look for.',
  },
  {
    icon: GraduationCap,
    tag: '4-Year Degree',
    code: 'BSHM',
    name: 'BS in Hospitality Management',
    text: 'Train for the world’s fastest-growing industry with industry-standard facilities and globally recognized hospitality and tourism skills.',
  },
  {
    icon: Ship,
    tag: '2-Year Diploma',
    code: 'Cruise Line',
    name: 'Cruise Line Services',
    text: 'Prepare for a rewarding career aboard international cruise lines — guest service, safety, and onboard operations for a life at sea.',
  },
];

const APPLICANTS = [
  { icon: UserPlus, title: 'New Students', text: 'Incoming college freshmen and first-time enrollees.' },
  { icon: Repeat, title: 'Transferees', text: 'Students moving to VIPC from another school.' },
  { icon: RotateCcw, title: 'Returning Students', text: 'Old/continuing Vineyard students re-enrolling for the new term.' },
  { icon: School, title: 'Senior High School', text: 'Incoming Grade 11 & 12 (ABM and TVL tracks).' },
];

// Step-by-step process that mirrors the actual VIPC online enrollment system.
const STEPS = [
  {
    icon: PlayCircle,
    title: 'Start New Enrollment',
    text: 'On the Online Enrollment page, click “Start New Enrollment.” The system first checks that the enrollment period is open.',
  },
  {
    icon: FileText,
    title: 'Fill Out the Application Form',
    text: 'Complete the online enrollment form with your personal, contact, and academic details, choose your program, then submit.',
  },
  {
    icon: Hash,
    title: 'Get Your Reference Number',
    text: 'After submitting, you’ll receive a reference number (e.g. VIPC-2025-XXXX-XXX). Keep it safe — you’ll need it for the next steps.',
  },
  {
    icon: CreditCard,
    title: 'Pay & Upload Receipt',
    text: 'Settle the enrollment/reservation fee, then use “Upload Receipt” to submit your proof of payment together with your reference number.',
  },
  {
    icon: BadgeCheck,
    title: 'Track & Get Confirmed',
    text: 'Use “Check Status” with your reference number to monitor your application in real time. Once the Registrar approves it, you’re officially enrolled.',
  },
];

const REQUIREMENTS = [
  {
    title: 'New College Students',
    items: [
      'Form 138 (Senior High School Report Card)',
      'Form 137 (Permanent Record)',
      'PSA Birth Certificate (photocopy)',
      'Certificate of Good Moral Character',
      '2 pcs. 2×2 ID picture (white background)',
      'Photocopy of a valid ID of parent/guardian',
    ],
  },
  {
    title: 'Transferees',
    items: [
      'Transcript of Records / Certificate of Grades',
      'Honorable Dismissal (Transfer Credentials)',
      'Certificate of Good Moral Character',
      'PSA Birth Certificate (photocopy)',
      '2 pcs. 2×2 ID picture',
    ],
  },
  {
    title: 'Senior High School (Grade 11)',
    items: [
      'Grade 10 Report Card (Form 138)',
      'PSA Birth Certificate (photocopy)',
      'Certificate of Good Moral Character',
      '2 pcs. 2×2 ID picture',
      'ESC / QVR Certificate (voucher recipients, if any)',
    ],
  },
  {
    title: 'Returning Students',
    items: [
      'Settle any pending accountabilities / secure clearance',
      'Proceed directly to online enrollment & registration',
    ],
  },
];

const FAQS = [
  {
    q: 'Can I enroll completely online?',
    a: 'Yes. You can start your application, upload your payment receipt, and track your status online. Bring your original documents to campus for verification when advised.',
  },
  {
    q: 'What programs can I apply for?',
    a: 'Bachelor’s degrees (BSBA, BSHM, BTVTEd), 3-Year and 2-Year diplomas (including Cruise Line Services), Senior High School, and TESDA short courses.',
  },
  {
    q: 'When is the enrollment period?',
    a: 'VIPC accepts enrollees each semester. The system shows whether enrollment is currently open — for exact dates and deadlines, contact the Registrar.',
  },
  {
    q: 'Are scholarships available?',
    a: 'Yes. VIPC offers scholarship and financial-assistance options. Inquire with the Registrar for the requirements and qualifications.',
  },
];

function Section({ id, className = '', children }) {
  return <section id={id} className={`py-16 sm:py-20 ${className}`}>{children}</section>;
}

export default function VipcAdmissions({ onNavigate, onOnlineEnrollment }) {
  return (
    <div>
      <VipcPageHero
        eyebrow="Admissions"
        title="How to Enroll at VIPC"
        subtitle="Joining the Vineyard community is quick and fully online — start your application, upload your receipt, and track your status, all in a few simple steps."
      />

      {/* Quick CTA strip */}
      <div className="bg-(--whitish-pink) border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-700 font-medium text-center sm:text-left">
            Ready to begin? Enrollment is done through our official online enrollment system.
          </p>
          <button onClick={onOnlineEnrollment}
            className="shrink-0 inline-flex items-center gap-2 bg-(--dominant-red) hover:bg-red-800 text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
            Online Enrollment <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ───────────── How to Enroll (our system) ───────────── */}
      <Section id="how-to-enroll" className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-(--dominant-red) font-bold tracking-[0.2em] text-xs uppercase">The Process</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">Step-by-Step Online Enrollment</h2>
            <p className="mt-4 text-gray-600">Follow these five steps in the VIPC online enrollment system.</p>
          </div>

          <ol className="relative space-y-6">
            <div className="hidden sm:block absolute left-[35px] top-4 bottom-4 w-0.5 bg-red-100" />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.li key={s.title} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
                  className="relative flex items-start gap-5 bg-white">
                  <div className="relative shrink-0">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-(--dominant-red) text-white flex flex-col items-center justify-center shadow-md">
                      <Icon className="w-6 h-6" />
                      <span className="text-[10px] font-bold tracking-wider mt-0.5">STEP {i + 1}</span>
                    </div>
                  </div>
                  <div className="pt-1.5">
                    <h3 className="font-bold text-lg text-gray-900">{s.title}</h3>
                    <p className="mt-1 text-gray-600 leading-relaxed">{s.text}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>

          <div className="mt-12 text-center">
            <button onClick={onOnlineEnrollment}
              className="inline-flex items-center gap-2 bg-(--dominant-red) hover:bg-red-800 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
              Start Your Online Enrollment <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-3 text-sm text-gray-500">Already enrolled before? Use the same system and choose <span className="font-semibold">Login</span> to access your account.</p>
          </div>
        </div>
      </Section>

      {/* ───────────── Requirements ───────────── */}
      <Section id="requirements" className="bg-(--snowy-white)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-(--dominant-red) font-bold tracking-[0.2em] text-xs uppercase">What to Prepare</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">Admission Requirements</h2>
            <p className="mt-4 text-gray-600">Prepare these documents based on your applicant type. Bring the originals to campus for verification.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {REQUIREMENTS.map((r, i) => (
              <motion.div key={r.title} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{r.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {r.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4.5 h-4.5 text-(--dominant-red) shrink-0 mt-0.5" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">Requirements may vary slightly per program. Contact the Registrar to confirm the latest checklist.</p>
        </div>
      </Section>

      {/* ───────────── Who can apply ───────────── */}
      <Section id="who-can-apply" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-(--dominant-red) font-bold tracking-[0.2em] text-xs uppercase">Eligibility</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">Who Can Apply</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {APPLICANTS.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div key={a.title} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                  className="text-center bg-(--whitish-pink) rounded-2xl p-7">
                  <div className="w-14 h-14 rounded-2xl bg-white text-(--dominant-red) flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-gray-900">{a.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-500">{a.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ───────────── Flagship programs (BSBA / BSHM / Cruise Line) ───────────── */}
      <Section id="featured-programs" className="bg-(--snowy-white)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-(--dominant-red) font-bold tracking-[0.2em] text-xs uppercase">Most In-Demand</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-gray-900">Popular Programs to Apply For</h2>
            <p className="mt-4 text-gray-600">Among our most sought-after courses — BSBA, BSHM, and Cruise Line Services.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HIGHLIGHTED.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.code} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                  className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-(--dominant-red) text-white flex items-center justify-center mb-5 shadow-md">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-(--dominant-red) tracking-wider">{p.tag} · {p.code}</span>
                  <h3 className="mt-1.5 font-serif text-xl font-bold text-gray-900 leading-snug">{p.name}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed flex-1">{p.text}</p>
                  <button onClick={() => onNavigate('programs')}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-(--dominant-red) cursor-pointer">
                    View program <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ───────────── FAQ ───────────── */}
      <Section id="faq" className="bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <HelpCircle className="w-9 h-9 text-(--dominant-red) mx-auto" />
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <motion.details key={f.q} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="group bg-(--snowy-white) rounded-2xl border border-gray-100 p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-4 cursor-pointer font-semibold text-gray-900">
                  {f.q}
                  <span className="shrink-0 text-(--dominant-red) transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </Section>

      {/* ───────────── CTA ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#5e1418] to-(--dominant-red) text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #ffd740 0 3px, transparent 3px 26px)' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">Start your journey at Vineyard</h2>
          <p className="mt-4 text-white/85 max-w-xl mx-auto">Begin your application now — it only takes a few minutes through our online enrollment system.</p>
          <button onClick={onOnlineEnrollment}
            className="mt-8 inline-flex items-center gap-2 bg-white text-(--dominant-red) font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
            Begin Online Enrollment <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
