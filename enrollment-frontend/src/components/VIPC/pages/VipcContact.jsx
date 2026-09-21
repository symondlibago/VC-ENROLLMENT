import { MapPin, Phone, Mail, Clock, ArrowRight, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import VipcPageHero from '../components/VipcPageHero';
import { CONTACT } from '../data/vipcContent';

const SOCIAL_ICON = { Facebook, Twitter, Instagram, YouTube: Youtube };

const Item = ({ icon: Icon, title, children }) => (
  <div className="flex gap-4">
    <div className="w-11 h-11 rounded-xl bg-(--whitish-pink) text-(--dominant-red) flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="font-bold text-gray-900">{title}</p>
      <div className="text-sm text-gray-600 mt-0.5">{children}</div>
    </div>
  </div>
);

export default function VipcContact({ onOnlineEnrollment }) {
  const mapQuery = encodeURIComponent('Vineyard International Polytechnic College, A. Luna St., Cagayan de Oro City');

  return (
    <div>
      <VipcPageHero
        eyebrow="Contact Us"
        title="Get in Touch"
        subtitle="We'd love to hear from you. Reach out for inquiries about admissions, programs, and more."
      />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
          {/* Details */}
          <div className="space-y-8">
            <Item icon={MapPin} title="Visit Us">{CONTACT.address}</Item>
            <Item icon={Phone} title="Call Us">
              {CONTACT.phones.map((p) => (
                <div key={p}><a href={`tel:${p.replace(/[^\d+]/g, '')}`} className="hover:text-(--dominant-red)">{p}</a></div>
              ))}
            </Item>
            <Item icon={Mail} title="Email Us">
              <a href={`mailto:${CONTACT.email}`} className="hover:text-(--dominant-red)">{CONTACT.email}</a>
            </Item>
            <Item icon={Clock} title="Office Hours">
              {CONTACT.hours.map((h) => (
                <div key={h.day} className="flex gap-2"><span className="font-medium text-gray-700">{h.day}:</span> {h.time}</div>
              ))}
            </Item>

            <div>
              <p className="font-bold text-gray-900 mb-3">Follow Us</p>
              <div className="flex gap-3">
                {CONTACT.socials.map((s) => {
                  const Icon = SOCIAL_ICON[s.name] || Facebook;
                  return (
                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" title={s.handle}
                      className="w-11 h-11 rounded-full bg-(--dominant-red) hover:bg-red-800 flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5 text-white" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Map + CTA */}
          <div className="space-y-6">
            <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 aspect-[4/3]">
              <iframe
                title="VIPC Location"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="rounded-3xl p-8 bg-gradient-to-br from-(--dominant-red) to-[#5e1418] text-white text-center">
              <h3 className="font-serif text-2xl font-bold">Ready to enroll?</h3>
              <p className="mt-2 text-white/85 text-sm">Skip the line — apply online in minutes.</p>
              <button onClick={onOnlineEnrollment}
                className="mt-5 inline-flex items-center gap-2 bg-white text-(--dominant-red) font-bold px-7 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                Online Enrollment <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
