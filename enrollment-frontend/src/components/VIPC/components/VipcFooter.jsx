import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { SCHOOL, CONTACT, FOOTER_PROGRAMS } from '../data/vipcContent';

const SOCIAL_ICON = { Facebook, Twitter, Instagram, YouTube: Youtube };

export default function VipcFooter({ onNavigate, onOnlineEnrollment }) {
  return (
    <footer className="bg-[#1f1f1f] text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Programs */}
          <div>
            <h4 className="text-(--dominant-red) font-extrabold uppercase tracking-wide mb-4 text-sm">Programs</h4>
            <ul className="space-y-2.5 text-sm">
              {FOOTER_PROGRAMS.map((p) => (
                <li key={p}>
                  <button onClick={() => onNavigate('programs')} className="hover:text-white transition-colors text-left cursor-pointer">{p}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-(--dominant-red) font-extrabold uppercase tracking-wide mb-4 text-sm">Address</h4>
            <p className="text-sm leading-relaxed">{CONTACT.address}</p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-(--dominant-red) font-extrabold uppercase tracking-wide mb-4 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Phone: <a href={`tel:${CONTACT.phones[0].replace(/[^\d+]/g, '')}`} className="hover:text-white">{CONTACT.phones[0]}</a></li>
              <li>Tel: <a href={`tel:${CONTACT.phones[1].replace(/[^\d+]/g, '')}`} className="hover:text-white">{CONTACT.phones[1]}</a></li>
              <li>Email: <a href={`mailto:${CONTACT.email}`} className="hover:text-white">{CONTACT.email}</a></li>
            </ul>
          </div>

          {/* Working hours */}
          <div>
            <h4 className="text-(--dominant-red) font-extrabold uppercase tracking-wide mb-4 text-sm">Working Hours</h4>
            <ul className="space-y-2 text-sm">
              {CONTACT.hours.map((h) => (
                <li key={h.day} className="flex flex-col">
                  <span className="font-medium text-white/90">{h.day}</span>
                  <span>{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Logo + tag + socials */}
        <div className="mt-14 flex flex-col items-center gap-5 text-center">
          <img src="/vipc/vineyard-white.avif" alt={SCHOOL.shortName} className="h-12 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <p className="text-(--dominant-red) font-semibold text-sm">#tesda accredited school</p>
          <div className="flex gap-4">
            {CONTACT.socials.map((s) => {
              const Icon = SOCIAL_ICON[s.name] || Facebook;
              return (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" title={s.handle}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-(--dominant-red) flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5 text-white" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-white/40 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {SCHOOL.established} {SCHOOL.name}. All rights reserved.</p>
          <button onClick={onOnlineEnrollment} className="hover:text-white transition-colors cursor-pointer">Online Enrollment</button>
        </div>
      </div>
    </footer>
  );
}
