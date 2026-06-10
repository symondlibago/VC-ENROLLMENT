// Philippine location data (PSGC) sourced from the `phil-reg-prov-mun-brgy`
// dataset and vendored locally under ./ph so we don't depend on the package
// being installed. Hierarchy: province (prov_code) -> city/municipality
// (mun_code) -> barangay.
//
// Provinces (88) and cities (1,627) are tiny and imported statically.
// Barangays (~41,582, ~1.7MB) are lazy-loaded on demand so they never bloat
// the main bundle.
import provinces from './ph/provinces.json';
import cities from './ph/city-mun.json';

const byName = (a, b) => a.name.localeCompare(b.name);

/** All provinces, alphabetical. -> [{ name, code }] */
export const getProvinces = () =>
  [...provinces].sort(byName).map((p) => ({ name: p.name, code: p.prov_code }));

/** Cities/municipalities under a province code, alphabetical. -> [{ name, code }] */
export const getCities = (provCode) =>
  cities
    .filter((c) => c.prov_code === provCode)
    .sort(byName)
    .map((c) => ({ name: c.name, code: c.mun_code }));

let _barangays = null;
/** Barangays under a city/municipality code, alphabetical. -> [{ name }] (async) */
export const getBarangays = async (munCode) => {
  if (!_barangays) {
    const mod = await import('./ph/barangays.json');
    _barangays = mod.default || mod;
  }
  return _barangays
    .filter((b) => b.mun_code === munCode)
    .sort(byName)
    .map((b) => ({ name: b.name }));
};

/**
 * Set of province names (UPPER-CASE, as stored in the dataset). Used by the
 * analytics to detect whether a saved address was built from these dropdowns
 * (i.e. its last comma-token is a real province) vs. a legacy free-typed one.
 */
export const getProvinceNameSet = () =>
  new Set(provinces.map((p) => p.name.trim().toUpperCase()));
