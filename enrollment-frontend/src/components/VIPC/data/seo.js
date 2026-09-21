// Per-page SEO for the VIPC public website (document title + meta description,
// kept in sync as the visitor navigates the single-page marketing site).
// The site-wide structured data (JSON-LD) lives statically in index.html so
// crawlers see it in the initial HTML.

export const SITE_NAME = 'Vineyard International Polytechnic College';

export const PAGE_SEO = {
  home: {
    title: 'Vineyard International Polytechnic College (VIPC) — Cagayan de Oro',
    description:
      'VIPC is a CHED, DepEd & TESDA-registered college in Cagayan de Oro offering BSBA, BS Hospitality Management (BSHM), Cruise Line Services, Senior High School, and culinary & technical courses. Enroll online today.',
  },
  about: {
    title: 'About Us — Vineyard International Polytechnic College',
    description:
      'Learn about VIPC in Cagayan de Oro — a non-profit, industry-linked college registered with DepEd, TESDA, CHED, and DOT, providing quality education since 2007.',
  },
  programs: {
    title: 'Programs — BSBA, BSHM, Cruise Line Services & more | VIPC',
    description:
      'Explore VIPC programs: BS Business Administration (BSBA), BS Hospitality Management (BSHM), Cruise Line Services, bachelor & diploma courses, Senior High School, and TESDA short courses.',
  },
  admissions: {
    title: 'Admissions & How to Enroll | VIPC Cagayan de Oro',
    description:
      'How to enroll at VIPC: admission requirements for new students, transferees, and Senior High, plus step-by-step online enrollment for BSBA, BSHM, and Cruise Line Services.',
  },
  news: {
    title: 'News & Articles — Vineyard International Polytechnic College',
    description:
      'Latest events, achievements, and stories from the Vineyard International Polytechnic College (VIPC) community in Cagayan de Oro.',
  },
  contact: {
    title: 'Contact Us — Vineyard International Polytechnic College',
    description:
      'Contact VIPC in Cagayan de Oro. Visit Prince Padi Building, A. Luna St., Mabulay Subd., or call 0917-770-0173 for admissions and program inquiries.',
  },
};

function upsertMeta(selector, attr, key, content) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Update <title> + description/OG/Twitter meta for the given VIPC page key. */
export function setPageSeo(pageKey) {
  const meta = PAGE_SEO[pageKey] || PAGE_SEO.home;
  document.title = meta.title;
  upsertMeta('meta[name="description"]', 'name', 'description', meta.description);
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
}
