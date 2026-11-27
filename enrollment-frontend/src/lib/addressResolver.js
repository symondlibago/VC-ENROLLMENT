/**
 * Works out which city or province a free-typed address belongs to.
 *
 * Addresses entered before the cascading dropdowns existed are plain text:
 * "BLK 3 RRAMONAL CAMAMAN AN CAGAYAN DE ORO CITY", "LIBONA BUKIDNON",
 * "#558 Bonbon CDOC". Left as typed, each one is its own row, so a report
 * meant to say how many students come from outside the city instead shows a
 * long tail of one-student spellings.
 *
 * Matching is on whole words, because the dataset contains municipalities
 * called BAY, GOA, DAO and UPI and a plain substring search finds "BAY"
 * inside "barangay" and "Bayugan".
 *
 * Picking the longest match is not enough either. Several of Cagayan de Oro's
 * own barangays share a name with a municipality somewhere else — Carmen,
 * Kauswagan, Bonbon, Puerto, Agusan — so "UPPER CARMEN CDO" read as the
 * municipality Carmen and moved a local student to another province. The
 * candidates are therefore ranked by how well they agree with the rest of the
 * line rather than by length.
 */

import cities from '@/data/ph/city-mun.json';
import provinces from '@/data/ph/provinces.json';

/** The city the school is in — the comparison every one of these reports turns on. */
export const HOME_CITY = 'CAGAYAN DE ORO CITY';

const HOME_MUN_CODE = '104305';

/** "CAGAYAN DE ORO CITY (Capital)" -> "CAGAYAN DE ORO CITY" */
const stripSuffix = (name) => String(name ?? '').replace(/\s*\(.*?\)\s*$/, '').trim();

/** Everything that is not a letter or digit becomes a single space. */
const words = (text) =>
  ` ${String(text ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()} `;

/** "CANITO-AN" is typed "CANITOAN" as often as not. */
const squashed = (text) => String(text ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, '');

/**
 * Spellings people type that no dataset name contains.
 *
 * Only unambiguous ones: a school in Cagayan de Oro has no competing claim on
 * "CDO". Deliberately not extended to guesswork like "CITY" or "POB".
 */
const CITY_ALIASES = [
  'CDOC', 'CDO', 'CDO CITY', 'C D O',
  'CAGAYAN DE ORO', 'CAGAYANDEORO', 'CAG DE ORO', 'CAGAYAN DE ORO CITY',
];

const PROVINCE_ALIASES = [
  { match: ['MIS OR', 'MIS ORIENTAL', 'MISOR', 'MIS. OR'], province: 'MISAMIS ORIENTAL' },
  { match: ['MIS OCC', 'MIS OCCIDENTAL'], province: 'MISAMIS OCCIDENTAL' },
];

/** Spellings of a town that differ from the dataset's own. */
const CITY_SPELLINGS = [
  { typed: 'OZAMIZ', dataset: 'OZAMIS CITY' },
  { typed: 'OZAMIZ CITY', dataset: 'OZAMIS CITY' },
];

/**
 * The region the school sits in — Northern Mindanao.
 *
 * Only ever a tie-break. A dozen towns share a name across the country
 * (Valencia, Libertad, San Isidro), and when a line names one with nothing
 * else to go on, the one in this school's own region is the likelier read.
 */
const HOME_REGION = '10';

const REGION_BY_PROV = new Map(provinces.map((p) => [p.prov_code, p.reg_code]));

/** Short needles are matched on word boundaries only — see `squashed`. */
const MIN_SQUASHED = 6;

/** What follows a name when the name is a street and not a town. */
const STREET_WORD = /^(?:ST|STR|STREET|AVE|AVENUE|AVENIDA|BLVD|BOULEVARD|DRIVE|DRV|ROAD|RD|HIGHWAY|EXT|EXTENSION|COR|CORNER)(?:\s|$)/;

/**
 * Whether every mention of a name in this line is a street.
 *
 * The country's towns are named after the same heroes its streets are — Burgos,
 * Luna, Rizal, Mabini — so "22 YACAPIN BURGOS ST." read as a municipality moved
 * four students living downtown into other provinces. A name written with St,
 * Ave or Drive after it is an address within a town, not the town.
 */
const everyMentionIsAStreet = (haystack, needle) => {
  for (let from = 0; ;) {
    const at = haystack.indexOf(` ${needle} `, from);
    if (at === -1) return true;
    if (!STREET_WORD.test(haystack.slice(at + needle.length + 2))) return false;
    from = at + 1;
  }
};

/**
 * The home city's eighty barangays, spelled the way the PSGC dataset spells
 * them, so a typed line and one picked from the dropdowns land on the same row.
 *
 * Literals rather than an import: barangays.json is 1.7MB and is lazy-loaded
 * for the dropdowns alone. Regenerate from it (mun_code 104305) if the city
 * ever re-draws them.
 */
const HOME_BARANGAY_NAMES = [
  'Agusan', 'Baikingon', 'Balubal', 'Balulang', 'Bayabas', 'Bayanga', 'Besigan',
  'Bonbon', 'Bugo', 'Bulua', 'Camaman-an', 'Canito-an', 'Carmen', 'Consolacion',
  'Cugman', 'Dansolihon', 'F. S. Catanico', 'Gusa', 'Indahag', 'Iponan',
  'Kauswagan', 'Lapasan', 'Lumbia', 'Macabalan', 'Macasandig', 'Mambuaya',
  'Nazareth', 'Pagalungan', 'Pagatpat', 'Patag', 'Pigsag-an', 'Puerto', 'Puntod',
  'San Simon', 'Tablon', 'Taglimao', 'Tagpangi', 'Tignapoloan', 'Tuburan', 'Tumpagon',
  ...Array.from({ length: 40 }, (_, i) => `Barangay ${i + 1}`),
];

/**
 * Sitios and subdivisions that name a barangay without saying it, and
 * misspellings of a barangay's own name.
 *
 * Each sitio here is taken from addresses in this database that name both it
 * and its barangay — "RAMONAL VILLAGE, CAMAMAN-AN", "Gran Europa, Lumbia" —
 * never from guesswork about the city's geography. Streets are deliberately
 * left out: Kalambaguhan and Abellanosa run across several barangays, so a
 * street name is not an answer, and those lines stay as typed for the
 * registrar to correct.
 */
const BARANGAY_ALIASES = [
  { typed: 'CALAANAN', barangay: 'Canito-an' },
  { typed: 'MACANHAN', barangay: 'Carmen' },
  { typed: 'RAMONAL', barangay: 'Camaman-an' },
  { typed: 'GRAN EUROPA', barangay: 'Lumbia' },
  // Spelled wrong often enough to be worth naming
  { typed: 'INDAHG', barangay: 'Indahag' },
  { typed: 'CONSOLATION', barangay: 'Consolacion' },
  { typed: 'KAUWAGAN', barangay: 'Kauswagan' },
  { typed: 'MACANSANDIG', barangay: 'Macasandig' },
  { typed: 'BAIKINGION', barangay: 'Baikingon' },
];

/**
 * The forty numbered barangays, however they are abbreviated — "Brgy. 26",
 * "BRNGY:15", "BARANGAY17" all run together. Written out rather than indexed,
 * because a plain search for "Barangay 2" finds it inside "Barangay 26".
 */
const NUMBERED_BARANGAY = /(?:^|\s)(?:BARANGAY|BARANGGAY|BRGY|BRNGY|BGY)\s*0*([1-9]|[1-3]\d|40)(?!\d)/;

/**
 * What to look for in a typed line, and which barangay each one means.
 *
 * A run-together form is only kept for a name that is written with a space,
 * hyphen or dot — "CANITOAN" for Canito-an, "SANSIMON" for San Simon. Matching
 * a one-word name that way would find Gusa inside Agusan, and the numbered
 * ones would find Barangay 2 inside Barangay 26.
 */
const HOME_BARANGAY_INDEX = (() => {
  const entries = [];
  const add = (text, label, alias = false) => {
    const needle = words(text).trim();
    if (!needle) return;
    const compound = /[-.]/.test(text) || (/\s/.test(text.trim()) && !/^Barangay \d+$/.test(text));
    entries.push({ needle, label, alias, squash: compound ? squashed(text) : null });
  };

  HOME_BARANGAY_NAMES.forEach((name) => add(name, name));
  BARANGAY_ALIASES.forEach(({ typed, barangay }) => add(typed, barangay, true));

  // Longest name first; where two are the same length a barangay's real name
  // beats a sitio's, so "Balulang Macanhan" is read as Balulang.
  return entries.sort((a, b) => b.needle.length - a.needle.length || a.alias - b.alias);
})();

/** The home-city barangay a typed line names, or null. */
const findHomeBarangay = (haystack, flat) => {
  const hit = HOME_BARANGAY_INDEX.find((e) =>
    haystack.includes(` ${e.needle} `) || (e.squash && flat.includes(e.squash)));
  if (hit) return hit.label;

  const numbered = haystack.match(NUMBERED_BARANGAY);
  return numbered ? `Barangay ${Number(numbered[1])}` : null;
};

/** Candidate names to look for, longest first. */
const buildIndex = () => {
  const entries = [];

  cities.forEach((city) => {
    const label = stripSuffix(city.name);
    const add = (text) => {
      const needle = words(text).trim();
      if (needle) entries.push({ needle, label, kind: 'city', provCode: city.prov_code });
    };

    add(label);

    // "CAGAYAN DE ORO CITY" is also written without the word CITY
    const withoutCity = label.replace(/\s+CITY$/, '').trim();
    if (withoutCity !== label) add(withoutCity);

    // Seventy names are stored the other way round — "CITY OF MALAYBALAY",
    // "CITY OF EL SALVADOR" — and nobody writes an address like that.
    const inverted = label.match(/^CITY OF\s+(.+)$/);
    if (inverted) {
      add(inverted[1]);
      add(`${inverted[1]} CITY`);
    }
  });

  CITY_SPELLINGS.forEach(({ typed, dataset }) => {
    const city = cities.find((c) => stripSuffix(c.name) === dataset);
    if (city) {
      entries.push({
        needle: words(typed).trim(), label: stripSuffix(city.name),
        kind: 'city', provCode: city.prov_code,
      });
    }
  });

  provinces.forEach((province) => {
    const label = stripSuffix(province.name);
    entries.push({ needle: words(label).trim(), label, kind: 'province', provCode: province.prov_code });
  });

  CITY_ALIASES.forEach((text) => {
    entries.push({
      needle: words(text).trim(), label: HOME_CITY, kind: 'city',
      provCode: '1043', alias: true,
    });
  });

  PROVINCE_ALIASES.forEach(({ match, province }) => {
    const code = provinces.find((p) => stripSuffix(p.name) === province)?.prov_code;
    match.forEach((text) => {
      entries.push({ needle: words(text).trim(), label: province, kind: 'province', provCode: code });
    });
  });

  // Longest first, and where two names are the same length the one in this
  // school's own region wins — a bare "Valencia" is far likelier to be the
  // one in Bukidnon than the one in Negros Oriental.
  const homely = (e) => (REGION_BY_PROV.get(e.provCode) === HOME_REGION ? 1 : 0);

  return entries
    .map((e) => ({ ...e, squash: squashed(e.needle) }))
    .sort((a, b) => b.needle.length - a.needle.length || homely(b) - homely(a));
};

const INDEX = buildIndex();

/**
 * The city, or failing that the province, a typed address names.
 *
 * Returns `{ label, kind }`, or null when nothing in the dataset is mentioned.
 *
 * The order of preference, once every mention has been collected:
 *   1. the city written outright — "CDO", "Cagayan de Oro City";
 *   2. a city sitting in a province the line also names, which is what settles
 *      "Kauswagan ... Baungon, Bukidnon" on Baungon rather than on the
 *      Kauswagan in Lanao del Norte;
 *   3. one of the home city's own barangays, which is how "UPPER CARMEN
 *      ZONE 10" and a misspelt "MACASANDIG, CAGAYN DE ORO CITY" come home;
 *   4. any other city named;
 *   5. a province on its own.
 */
export const resolveTypedLocation = (address) => {
  const haystack = words(address);
  if (haystack.trim() === '') return null;

  const flat = squashed(address);

  // Whole words, plus a run-together form for the longer names only —
  // "ELSALVADOR" for "EL SALVADOR". Short names are never matched this way:
  // "BAY" would turn up inside half the street addresses in the country.
  const found = INDEX.filter((entry) => {
    // A name written out in the line settles it either way: a street there is
    // not a town, and the run-together form must not let it back in, since
    // "BURGOS ST" squashes to a string that still contains "BURGOS".
    if (haystack.includes(` ${entry.needle} `)) {
      return !everyMentionIsAStreet(haystack, entry.needle);
    }
    return entry.squash.length >= MIN_SQUASHED && flat.includes(entry.squash);
  });

  const namedProvinces = new Set(
    found.filter((e) => e.kind === 'province').map((e) => e.provCode).filter(Boolean)
  );
  const citiesFound = found.filter((e) => e.kind === 'city');

  // 1. The city stated outright
  if (citiesFound.some((e) => e.alias)) return { label: HOME_CITY, kind: 'city' };

  // 2. A city whose province the line also names
  const agreeing = citiesFound.find((e) => namedProvinces.has(e.provCode));
  if (agreeing) return { label: agreeing.label, kind: 'city' };

  // 3. A barangay of the home city, when nothing points somewhere else
  if (namedProvinces.size === 0 && findHomeBarangay(haystack, flat)) {
    return { label: HOME_CITY, kind: 'city' };
  }

  // 4. Any other city named, longest first
  if (citiesFound.length > 0) return { label: citiesFound[0].label, kind: 'city' };

  // 5. A province on its own
  const province = found.find((e) => e.kind === 'province');
  return province ? { label: province.label, kind: 'province' } : null;
};

/**
 * Which of the home city's barangays a typed address names.
 *
 * Returns `{ barangay, city }`, or null when the line is not in this city or
 * names no barangay of it. Only the home city is read this far: the dataset
 * holds 41,582 barangays, and picking one of them out of a free-typed line
 * from another province would be a guess rather than a reading.
 *
 * The city is settled first, so "Kauswagan ... Baungon, Bukidnon" is not read
 * as the Kauswagan in this city.
 */
export const resolveTypedBarangay = (address) => {
  const place = resolveTypedLocation(address);
  if (!place || !isHomeCity(place.label)) return null;

  const barangay = findHomeBarangay(words(address), squashed(address));
  return barangay ? { barangay, city: HOME_CITY } : null;
};

/** Whether a label is the school's own city, however it was written. */
export const isHomeCity = (label) =>
  stripSuffix(label).toUpperCase() === HOME_CITY;

/** Words that stay lowercase inside a name, unless they open it. */
const SMALL_WORDS = new Set(['DE', 'DEL', 'DOS', 'LA', 'LAS', 'LOS', 'OF', 'THE', 'Y']);

/**
 * A dataset name written the way it is said.
 *
 *   "CITY OF EL SALVADOR"  -> "El Salvador City"
 *   "CAGAYAN DE ORO CITY"  -> "Cagayan de Oro City"
 *
 * For anything shown to a reader — a chart, a printed report. The tables keep
 * the stored spelling so the registrar can still see what is on file.
 */
export const prettyPlace = (label) => {
  let text = stripSuffix(label);
  const inverted = text.toUpperCase().match(/^CITY OF\s+(.+)$/);
  if (inverted) text = `${inverted[1]} City`;

  return text
    .split(/\s+/)
    .map((word, i) => {
      const upper = word.toUpperCase();
      if (i > 0 && SMALL_WORDS.has(upper)) return upper.toLowerCase();
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    })
    .join(' ');
};

/** Home-city barangay names, so callers can group them without re-deriving. */
export const homeBarangayCount = () => HOME_BARANGAY_NAMES.length;

export { HOME_MUN_CODE, stripSuffix as cityLabel };
