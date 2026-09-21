import { motion } from 'framer-motion';
import { CalendarDays, ArrowRight, Eye, MessageCircle, Heart, User } from 'lucide-react';
import VipcPageHero from '../components/VipcPageHero';
import VipcImage from '../components/VipcImage';
import { NEWS } from '../data/vipcContent';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] } }),
};

const Meta = ({ n }) => (
  <div className="flex items-center gap-4 text-xs text-gray-400">
    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {n.views}</span>
    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {n.comments}</span>
    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {n.likes}</span>
  </div>
);

export default function VipcNews({ onOnlineEnrollment }) {
  const [featured, ...rest] = NEWS;

  return (
    <div>
      <VipcPageHero
        eyebrow="News & Articles"
        title="What's Happening at VIPC"
        subtitle="Stay up to date with the latest events, achievements, and stories from the Vineyard community."
      />

      {/* Featured */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.article
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center bg-(--whitish-pink) rounded-3xl overflow-hidden border border-red-100"
          >
            <VipcImage src={featured.image} caption={featured.category} className="h-full min-h-[280px] lg:min-h-[420px]" />
            <div className="p-8 lg:pr-12">
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="bg-(--dominant-red) text-white rounded-full px-3 py-1 uppercase tracking-wide">Featured</span>
                <span className="text-gray-400">{featured.date} · {featured.readTime}</span>
              </div>
              <h2 className="mt-4 font-serif text-2xl sm:text-3xl font-bold text-(--dominant-red) leading-tight">{featured.title}</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">{featured.excerpt}</p>
              <div className="mt-6 flex items-center justify-between border-t border-red-100 pt-4">
                <span className="flex items-center gap-1.5 text-sm text-gray-500"><User className="w-4 h-4" /> {featured.author}</span>
                <Meta n={featured} />
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-serif text-2xl font-bold text-gray-900 mb-8">More Stories</h3>
          <div className="grid md:grid-cols-3 gap-7">
            {rest.map((n, i) => (
              <motion.article key={n.title} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <VipcImage src={n.image} caption={n.category} icon={CalendarDays} className="aspect-[16/10]" />
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
                    <span className="bg-(--whitish-pink) text-(--dominant-red) rounded-full px-2.5 py-0.5">{n.category}</span>
                    <span>{n.date}</span>
                  </div>
                  <h3 className="mt-3 font-bold text-lg text-(--dominant-red) leading-snug">{n.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">{n.excerpt}</p>
                  <div className="mt-4 border-t border-gray-100 pt-3"><Meta n={n} /></div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-(--whitish-pink)">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Want to be part of the story?</h2>
          <button onClick={onOnlineEnrollment}
            className="mt-7 inline-flex items-center gap-2 bg-(--dominant-red) text-white font-bold px-7 py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
            Online Enrollment <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
