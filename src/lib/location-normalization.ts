/**
 * Offline location normalization for map markers and country counts.
 * Maps free-text locations (cities, ISO codes, aliases) to a canonical country
 * and lat/lng so Leaflet never falls back to [0, 0].
 */

export type LatLng = [number, number];

export interface NormalizedLocation {
  /** Original trimmed input */
  raw: string;
  /** Best-effort city label (may be empty) */
  city: string;
  /** Canonical English country name used for grouping/display */
  country: string;
  /** ISO 3166-1 alpha-2 when known */
  countryCode: string | null;
  /** Prefer city coords when known, else country centroid */
  coords: LatLng;
}

/** Country centroids [lat, lng] keyed by canonical English name */
export const COUNTRY_COORDINATES: Record<string, LatLng> = {
  France: [46.603354, 1.888334],
  Spain: [40.463667, -3.74922],
  Germany: [51.165691, 10.451526],
  Italy: [41.87194, 12.56738],
  'United Kingdom': [55.378051, -3.435973],
  'United States': [37.09024, -95.712891],
  Canada: [56.130366, -106.346771],
  Australia: [-25.274398, 133.775136],
  Japan: [36.204824, 138.252924],
  China: [35.86166, 104.195397],
  Brazil: [-14.235004, -51.92528],
  Mexico: [23.634501, -102.552784],
  India: [20.593684, 78.96288],
  'South Africa': [-30.559482, 22.937506],
  Netherlands: [52.132633, 5.291266],
  Belgium: [50.503887, 4.469936],
  Switzerland: [46.818188, 8.227512],
  Sweden: [60.128161, 18.643501],
  Norway: [60.472024, 8.468946],
  Denmark: [56.26392, 9.501785],
  Portugal: [39.399872, -8.224454],
  Greece: [39.074208, 21.824312],
  Poland: [51.919438, 19.145136],
  Austria: [47.516231, 14.550072],
  Ireland: [53.41291, -8.24389],
  Finland: [61.92411, 25.748151],
  Singapore: [1.352083, 103.819836],
  'South Korea': [35.907757, 127.766922],
  Thailand: [15.870032, 100.992541],
  Vietnam: [14.058324, 108.277199],
  Argentina: [-38.416097, -63.616672],
  Chile: [-35.675147, -71.542969],
  'United Arab Emirates': [23.424076, 53.847818],
  Russia: [61.52401, 105.318756],
  Turkey: [38.963745, 35.243322],
  Egypt: [26.820553, 30.802498],
  Morocco: [31.791702, -7.09262],
  'New Zealand': [-40.900557, 174.885971],
  Indonesia: [-0.789275, 113.921327],
  Malaysia: [4.210484, 101.975766],
  Philippines: [12.879721, 121.774017],
  Colombia: [4.570868, -74.297333],
  Peru: [-9.189967, -75.015152],
  'Czech Republic': [49.817492, 15.472962],
  Hungary: [47.162494, 19.503304],
  Romania: [45.943161, 24.96676],
  Luxembourg: [49.815273, 6.129583],
  Croatia: [45.1, 15.2],
  Serbia: [44.016521, 21.005859],
  Slovakia: [48.669026, 19.699024],
  Slovenia: [46.151241, 14.995463],
  Bulgaria: [42.733883, 25.48583],
  Ukraine: [48.379433, 31.16558],
  Israel: [31.046051, 34.851612],
  'Saudi Arabia': [23.885942, 45.079162],
  Qatar: [25.354826, 51.183884],
  Kuwait: [29.31166, 47.481766],
  Taiwan: [23.69781, 120.960515],
  'Hong Kong': [22.396428, 114.109497],
  Iceland: [64.963051, -19.020835],
  Estonia: [58.595272, 25.013607],
  Latvia: [56.879635, 24.603189],
  Lithuania: [55.169438, 23.881275],
  Malta: [35.937496, 14.375416],
  Cyprus: [35.126413, 33.429859],
  Nigeria: [9.081999, 8.675277],
  Kenya: [-0.023559, 37.906193],
  Ghana: [7.946527, -1.023194],
  Pakistan: [30.375321, 69.345116],
  Bangladesh: [23.684994, 90.356331],
  'Sri Lanka': [7.873054, 80.771797],
  Nepal: [28.394857, 84.124008],
  'Costa Rica': [9.748917, -83.753428],
  Panama: [8.537981, -80.782127],
  Uruguay: [-32.522779, -55.765835],
  Ecuador: [-1.831239, -78.183406],
  Venezuela: [6.42375, -66.58973],
};

/** ISO-2 / ISO-3 / common aliases → canonical country name */
const COUNTRY_ALIASES: Record<string, string> = {
  // ISO-2
  fr: 'France',
  es: 'Spain',
  de: 'Germany',
  it: 'Italy',
  gb: 'United Kingdom',
  uk: 'United Kingdom',
  us: 'United States',
  ca: 'Canada',
  au: 'Australia',
  jp: 'Japan',
  cn: 'China',
  br: 'Brazil',
  mx: 'Mexico',
  in: 'India',
  za: 'South Africa',
  nl: 'Netherlands',
  be: 'Belgium',
  ch: 'Switzerland',
  se: 'Sweden',
  no: 'Norway',
  dk: 'Denmark',
  pt: 'Portugal',
  gr: 'Greece',
  pl: 'Poland',
  at: 'Austria',
  ie: 'Ireland',
  fi: 'Finland',
  sg: 'Singapore',
  kr: 'South Korea',
  th: 'Thailand',
  vn: 'Vietnam',
  ar: 'Argentina',
  cl: 'Chile',
  ae: 'United Arab Emirates',
  ru: 'Russia',
  tr: 'Turkey',
  eg: 'Egypt',
  ma: 'Morocco',
  nz: 'New Zealand',
  id: 'Indonesia',
  my: 'Malaysia',
  ph: 'Philippines',
  co: 'Colombia',
  pe: 'Peru',
  cz: 'Czech Republic',
  hu: 'Hungary',
  ro: 'Romania',
  lu: 'Luxembourg',
  hr: 'Croatia',
  rs: 'Serbia',
  sk: 'Slovakia',
  si: 'Slovenia',
  bg: 'Bulgaria',
  ua: 'Ukraine',
  il: 'Israel',
  sa: 'Saudi Arabia',
  qa: 'Qatar',
  kw: 'Kuwait',
  tw: 'Taiwan',
  hk: 'Hong Kong',
  is: 'Iceland',
  ee: 'Estonia',
  lv: 'Latvia',
  lt: 'Lithuania',
  mt: 'Malta',
  cy: 'Cyprus',
  ng: 'Nigeria',
  ke: 'Kenya',
  gh: 'Ghana',
  pk: 'Pakistan',
  bd: 'Bangladesh',
  lk: 'Sri Lanka',
  np: 'Nepal',
  cr: 'Costa Rica',
  pa: 'Panama',
  uy: 'Uruguay',
  ec: 'Ecuador',
  ve: 'Venezuela',

  // ISO-3
  fra: 'France',
  esp: 'Spain',
  deu: 'Germany',
  ita: 'Italy',
  gbr: 'United Kingdom',
  usa: 'United States',
  can: 'Canada',
  aus: 'Australia',
  jpn: 'Japan',
  chn: 'China',
  bra: 'Brazil',
  mex: 'Mexico',
  ind: 'India',
  zaf: 'South Africa',
  nld: 'Netherlands',
  bel: 'Belgium',
  che: 'Switzerland',
  swe: 'Sweden',
  nor: 'Norway',
  dnk: 'Denmark',
  prt: 'Portugal',
  grc: 'Greece',
  pol: 'Poland',
  aut: 'Austria',
  irl: 'Ireland',
  fin: 'Finland',
  sgp: 'Singapore',
  kor: 'South Korea',
  tha: 'Thailand',
  vnm: 'Vietnam',
  arg: 'Argentina',
  chl: 'Chile',
  are: 'United Arab Emirates',
  rus: 'Russia',
  tur: 'Turkey',
  egy: 'Egypt',
  mar: 'Morocco',
  nzl: 'New Zealand',
  idn: 'Indonesia',
  mys: 'Malaysia',
  phl: 'Philippines',
  col: 'Colombia',
  per: 'Peru',
  cze: 'Czech Republic',
  hun: 'Hungary',
  rou: 'Romania',
  lux: 'Luxembourg',
  hrv: 'Croatia',
  srb: 'Serbia',
  svk: 'Slovakia',
  svn: 'Slovenia',
  bgr: 'Bulgaria',
  ukr: 'Ukraine',
  isr: 'Israel',
  sau: 'Saudi Arabia',
  qat: 'Qatar',
  kwt: 'Kuwait',
  twn: 'Taiwan',
  hkg: 'Hong Kong',
  isl: 'Iceland',
  est: 'Estonia',
  lva: 'Latvia',
  ltu: 'Lithuania',
  mlt: 'Malta',
  cyp: 'Cyprus',

  // English / local / informal names
  france: 'France',
  spain: 'Spain',
  españa: 'Spain',
  espana: 'Spain',
  germany: 'Germany',
  deutschland: 'Germany',
  italy: 'Italy',
  italia: 'Italy',
  'united kingdom': 'United Kingdom',
  'great britain': 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  wales: 'United Kingdom',
  'united states': 'United States',
  'united states of america': 'United States',
  america: 'United States',
  usa: 'United States',
  canada: 'Canada',
  australia: 'Australia',
  japan: 'Japan',
  china: 'China',
  brazil: 'Brazil',
  brasil: 'Brazil',
  mexico: 'Mexico',
  méxico: 'Mexico',
  india: 'India',
  'south africa': 'South Africa',
  netherlands: 'Netherlands',
  holland: 'Netherlands',
  belgium: 'Belgium',
  belgië: 'Belgium',
  belgie: 'Belgium',
  switzerland: 'Switzerland',
  suisse: 'Switzerland',
  schweiz: 'Switzerland',
  sweden: 'Sweden',
  norway: 'Norway',
  denmark: 'Denmark',
  portugal: 'Portugal',
  greece: 'Greece',
  poland: 'Poland',
  austria: 'Austria',
  österreich: 'Austria',
  osterreich: 'Austria',
  ireland: 'Ireland',
  finland: 'Finland',
  singapore: 'Singapore',
  'south korea': 'South Korea',
  korea: 'South Korea',
  thailand: 'Thailand',
  vietnam: 'Vietnam',
  argentina: 'Argentina',
  chile: 'Chile',
  uae: 'United Arab Emirates',
  'united arab emirates': 'United Arab Emirates',
  russia: 'Russia',
  turkey: 'Turkey',
  türkiye: 'Turkey',
  turkiye: 'Turkey',
  egypt: 'Egypt',
  morocco: 'Morocco',
  'new zealand': 'New Zealand',
  indonesia: 'Indonesia',
  malaysia: 'Malaysia',
  philippines: 'Philippines',
  colombia: 'Colombia',
  peru: 'Peru',
  'czech republic': 'Czech Republic',
  czechia: 'Czech Republic',
  hungary: 'Hungary',
  magyarország: 'Hungary',
  magyarorszag: 'Hungary',
  romania: 'Romania',
  luxembourg: 'Luxembourg',
  croatia: 'Croatia',
  serbia: 'Serbia',
  slovakia: 'Slovakia',
  slovenia: 'Slovenia',
  bulgaria: 'Bulgaria',
  ukraine: 'Ukraine',
  israel: 'Israel',
  'saudi arabia': 'Saudi Arabia',
  qatar: 'Qatar',
  kuwait: 'Kuwait',
  taiwan: 'Taiwan',
  'hong kong': 'Hong Kong',
  iceland: 'Iceland',
  estonia: 'Estonia',
  latvia: 'Latvia',
  lithuania: 'Lithuania',
  malta: 'Malta',
  cyprus: 'Cyprus',
};

/** Well-known cities → country + coordinates (city-level pins) */
const CITY_LOOKUP: Record<string, { country: string; coords: LatLng }> = {
  // Hungary
  budapest: { country: 'Hungary', coords: [47.4979, 19.0402] },
  debrecen: { country: 'Hungary', coords: [47.5316, 21.6273] },
  szeged: { country: 'Hungary', coords: [46.253, 20.1414] },

  // Spain
  madrid: { country: 'Spain', coords: [40.4168, -3.7038] },
  barcelona: { country: 'Spain', coords: [41.3874, 2.1686] },
  valencia: { country: 'Spain', coords: [39.4699, -0.3763] },
  seville: { country: 'Spain', coords: [37.3891, -5.9845] },
  sevilla: { country: 'Spain', coords: [37.3891, -5.9845] },
  bilbao: { country: 'Spain', coords: [43.263, -2.935] },
  malaga: { country: 'Spain', coords: [36.7213, -4.4214] },
  málaga: { country: 'Spain', coords: [36.7213, -4.4214] },

  // France
  paris: { country: 'France', coords: [48.8566, 2.3522] },
  lyon: { country: 'France', coords: [45.764, 4.8357] },
  marseille: { country: 'France', coords: [43.2965, 5.3698] },
  toulouse: { country: 'France', coords: [43.6047, 1.4442] },
  nice: { country: 'France', coords: [43.7102, 7.262] },
  bordeaux: { country: 'France', coords: [44.8378, -0.5792] },

  // Germany
  berlin: { country: 'Germany', coords: [52.52, 13.405] },
  munich: { country: 'Germany', coords: [48.1351, 11.582] },
  münchen: { country: 'Germany', coords: [48.1351, 11.582] },
  munchen: { country: 'Germany', coords: [48.1351, 11.582] },
  hamburg: { country: 'Germany', coords: [53.5511, 9.9937] },
  frankfurt: { country: 'Germany', coords: [50.1109, 8.6821] },
  cologne: { country: 'Germany', coords: [50.9375, 6.9603] },
  köln: { country: 'Germany', coords: [50.9375, 6.9603] },
  koln: { country: 'Germany', coords: [50.9375, 6.9603] },
  stuttgart: { country: 'Germany', coords: [48.7758, 9.1829] },
  düsseldorf: { country: 'Germany', coords: [51.2277, 6.7735] },
  dusseldorf: { country: 'Germany', coords: [51.2277, 6.7735] },

  // UK
  london: { country: 'United Kingdom', coords: [51.5074, -0.1278] },
  manchester: { country: 'United Kingdom', coords: [53.4808, -2.2426] },
  edinburgh: { country: 'United Kingdom', coords: [55.9533, -3.1883] },
  birmingham: { country: 'United Kingdom', coords: [52.4862, -1.8904] },
  bristol: { country: 'United Kingdom', coords: [51.4545, -2.5879] },
  glasgow: { country: 'United Kingdom', coords: [55.8642, -4.2518] },
  oxford: { country: 'United Kingdom', coords: [51.752, -1.2577] },
  cambridge: { country: 'United Kingdom', coords: [52.2053, 0.1218] },

  // Netherlands / Belgium / Switzerland
  amsterdam: { country: 'Netherlands', coords: [52.3676, 4.9041] },
  rotterdam: { country: 'Netherlands', coords: [51.9244, 4.4777] },
  'the hague': { country: 'Netherlands', coords: [52.0705, 4.3007] },
  utrecht: { country: 'Netherlands', coords: [52.0907, 5.1214] },
  brussels: { country: 'Belgium', coords: [50.8503, 4.3517] },
  bruxelles: { country: 'Belgium', coords: [50.8503, 4.3517] },
  antwerp: { country: 'Belgium', coords: [51.2194, 4.4025] },
  zurich: { country: 'Switzerland', coords: [47.3769, 8.5417] },
  zürich: { country: 'Switzerland', coords: [47.3769, 8.5417] },
  geneva: { country: 'Switzerland', coords: [46.2044, 6.1432] },
  genève: { country: 'Switzerland', coords: [46.2044, 6.1432] },
  basel: { country: 'Switzerland', coords: [47.5596, 7.5886] },
  bern: { country: 'Switzerland', coords: [46.948, 7.4474] },

  // Italy / Portugal / Austria
  rome: { country: 'Italy', coords: [41.9028, 12.4964] },
  roma: { country: 'Italy', coords: [41.9028, 12.4964] },
  milan: { country: 'Italy', coords: [45.4642, 9.19] },
  milano: { country: 'Italy', coords: [45.4642, 9.19] },
  florence: { country: 'Italy', coords: [43.7696, 11.2558] },
  firenze: { country: 'Italy', coords: [43.7696, 11.2558] },
  turin: { country: 'Italy', coords: [45.0703, 7.6869] },
  torino: { country: 'Italy', coords: [45.0703, 7.6869] },
  naples: { country: 'Italy', coords: [40.8518, 14.2681] },
  napoli: { country: 'Italy', coords: [40.8518, 14.2681] },
  lisbon: { country: 'Portugal', coords: [38.7223, -9.1393] },
  lisboa: { country: 'Portugal', coords: [38.7223, -9.1393] },
  porto: { country: 'Portugal', coords: [41.1579, -8.6291] },
  vienna: { country: 'Austria', coords: [48.2082, 16.3738] },
  wien: { country: 'Austria', coords: [48.2082, 16.3738] },

  // Nordics / Ireland / Poland / Czech / Romania
  stockholm: { country: 'Sweden', coords: [59.3293, 18.0686] },
  oslo: { country: 'Norway', coords: [59.9139, 10.7522] },
  copenhagen: { country: 'Denmark', coords: [55.6761, 12.5683] },
  københavn: { country: 'Denmark', coords: [55.6761, 12.5683] },
  helsinki: { country: 'Finland', coords: [60.1699, 24.9384] },
  dublin: { country: 'Ireland', coords: [53.3498, -6.2603] },
  warsaw: { country: 'Poland', coords: [52.2297, 21.0122] },
  warszawa: { country: 'Poland', coords: [52.2297, 21.0122] },
  krakow: { country: 'Poland', coords: [50.0647, 19.945] },
  kraków: { country: 'Poland', coords: [50.0647, 19.945] },
  prague: { country: 'Czech Republic', coords: [50.0755, 14.4378] },
  praha: { country: 'Czech Republic', coords: [50.0755, 14.4378] },
  bucharest: { country: 'Romania', coords: [44.4268, 26.1025] },

  // Greece / Turkey / UAE
  athens: { country: 'Greece', coords: [37.9838, 23.7275] },
  thessaloniki: { country: 'Greece', coords: [40.6401, 22.9444] },
  istanbul: { country: 'Turkey', coords: [41.0082, 28.9784] },
  ankara: { country: 'Turkey', coords: [39.9334, 32.8597] },
  dubai: { country: 'United Arab Emirates', coords: [25.2048, 55.2708] },
  'abu dhabi': { country: 'United Arab Emirates', coords: [24.4539, 54.3773] },

  // Americas / Asia-Pacific
  'new york': { country: 'United States', coords: [40.7128, -74.006] },
  'new york city': { country: 'United States', coords: [40.7128, -74.006] },
  nyc: { country: 'United States', coords: [40.7128, -74.006] },
  'san francisco': { country: 'United States', coords: [37.7749, -122.4194] },
  'los angeles': { country: 'United States', coords: [34.0522, -118.2437] },
  chicago: { country: 'United States', coords: [41.8781, -87.6298] },
  boston: { country: 'United States', coords: [42.3601, -71.0589] },
  seattle: { country: 'United States', coords: [47.6062, -122.3321] },
  washington: { country: 'United States', coords: [38.9072, -77.0369] },
  toronto: { country: 'Canada', coords: [43.6532, -79.3832] },
  montreal: { country: 'Canada', coords: [45.5017, -73.5673] },
  vancouver: { country: 'Canada', coords: [49.2827, -123.1207] },
  'mexico city': { country: 'Mexico', coords: [19.4326, -99.1332] },
  'são paulo': { country: 'Brazil', coords: [-23.5505, -46.6333] },
  'sao paulo': { country: 'Brazil', coords: [-23.5505, -46.6333] },
  'rio de janeiro': { country: 'Brazil', coords: [-22.9068, -43.1729] },
  'buenos aires': { country: 'Argentina', coords: [-34.6037, -58.3816] },
  sydney: { country: 'Australia', coords: [-33.8688, 151.2093] },
  melbourne: { country: 'Australia', coords: [-37.8136, 144.9631] },
  tokyo: { country: 'Japan', coords: [35.6762, 139.6503] },
  singapore: { country: 'Singapore', coords: [1.3521, 103.8198] },
  'hong kong': { country: 'Hong Kong', coords: [22.3193, 114.1694] },
  shanghai: { country: 'China', coords: [31.2304, 121.4737] },
  beijing: { country: 'China', coords: [39.9042, 116.4074] },
  mumbai: { country: 'India', coords: [19.076, 72.8777] },
  bangalore: { country: 'India', coords: [12.9716, 77.5946] },
  bengaluru: { country: 'India', coords: [12.9716, 77.5946] },
  delhi: { country: 'India', coords: [28.7041, 77.1025] },
  'new delhi': { country: 'India', coords: [28.6139, 77.209] },
};

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Accent/case-insensitive alias → country */
const NORMALIZED_COUNTRY_ALIASES: Record<string, string> = {};
for (const [alias, country] of Object.entries(COUNTRY_ALIASES)) {
  NORMALIZED_COUNTRY_ALIASES[normalizeKey(alias)] = country;
}
for (const name of Object.keys(COUNTRY_COORDINATES)) {
  NORMALIZED_COUNTRY_ALIASES[normalizeKey(name)] = name;
}

/** Accent/case-insensitive city → country + coords */
const NORMALIZED_CITY_LOOKUP: Record<string, { country: string; coords: LatLng }> = {};
for (const [city, data] of Object.entries(CITY_LOOKUP)) {
  NORMALIZED_CITY_LOOKUP[normalizeKey(city)] = data;
}

const ISO2_BY_COUNTRY: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_ALIASES)
    .filter(([alias]) => alias.length === 2)
    .map(([code, country]) => [country, code.toUpperCase()])
);

function resolveCountryToken(token: string): string | null {
  const key = normalizeKey(token);
  if (!key) return null;
  return NORMALIZED_COUNTRY_ALIASES[key] ?? null;
}

function resolveCityToken(token: string): { country: string; coords: LatLng; city: string } | null {
  const key = normalizeKey(token);
  const hit = NORMALIZED_CITY_LOOKUP[key];
  if (!hit) return null;
  return { country: hit.country, coords: hit.coords, city: token.trim() };
}

/**
 * Normalize a free-text location into country + coordinates.
 * Handles: "Budapest", "Budapest, HU", "ES", "Madrid, Spain", "España", etc.
 */
export function normalizeLocation(rawLocation: string): NormalizedLocation | null {
  if (!rawLocation?.trim()) return null;

  const raw = rawLocation.trim();
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);

  let city = '';
  let country: string | null = null;
  let coords: LatLng | null = null;

  if (parts.length === 1) {
    const token = parts[0];
    const asCountry = resolveCountryToken(token);
    const asCity = resolveCityToken(token);

    if (asCountry) {
      country = asCountry;
      coords = COUNTRY_COORDINATES[asCountry] ?? null;
    } else if (asCity) {
      city = asCity.city;
      country = asCity.country;
      coords = asCity.coords;
    } else {
      return null;
    }
  } else {
    // Last segment is usually country; first is usually city
    const last = parts[parts.length - 1];
    const first = parts[0];

    country = resolveCountryToken(last);
    const cityHit = resolveCityToken(first);

    if (cityHit) {
      city = cityHit.city;
      if (!country) country = cityHit.country;
      // Prefer city pin when city is known
      coords = cityHit.coords;
    } else {
      city = first;
    }

    // If last wasn't a country but some middle/other part is
    if (!country) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const resolved = resolveCountryToken(parts[i]);
        if (resolved) {
          country = resolved;
          break;
        }
      }
    }

    // City-only inference if country still unknown
    if (!country && cityHit) {
      country = cityHit.country;
      coords = cityHit.coords;
    }

    if (country && !coords) {
      coords = COUNTRY_COORDINATES[country] ?? null;
    }

    // If we have a city hit that disagrees with a bad country parse, trust city
    if (cityHit && country && cityHit.country !== country) {
      // Keep parsed country if it resolved; otherwise use city country
      // Prefer explicit country token when present
      if (!resolveCountryToken(last)) {
        country = cityHit.country;
        coords = cityHit.coords;
      }
    }
  }

  if (!country || !coords) return null;

  // If we have a known city, prefer its coordinates for the pin
  if (city) {
    const cityHit = resolveCityToken(city);
    if (cityHit && cityHit.country === country) {
      coords = cityHit.coords;
    }
  }

  return {
    raw,
    city,
    country,
    countryCode: ISO2_BY_COUNTRY[country] ?? null,
    coords,
  };
}

/** Unique canonical countries from a list of raw location strings */
export function uniqueCountries(locations: string[]): string[] {
  const set = new Set<string>();
  for (const loc of locations) {
    const n = normalizeLocation(loc);
    if (n) set.add(n.country);
  }
  return [...set].sort();
}
