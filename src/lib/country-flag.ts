export type CountryIso2 = string;

export function getCountryFlagEmoji(iso2: string): string {
  if (!iso2 || typeof iso2 !== 'string' || iso2.length !== 2) return '';
  const upper = iso2.toUpperCase();
  return upper
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code < 65 || code > 90) return '';
      return String.fromCodePoint(0x1f1e6 - 65 + code);
    })
    .join('');
}

const LABEL_TO_ISO2: Record<string, string> = {
  // A
  afghanistan: 'af',
  'aland islands': 'ax',
  albania: 'al',
  algeria: 'dz',
  'american samoa': 'as',
  andorra: 'ad',
  angola: 'ao',
  anguilla: 'ai',
  antarctica: 'aq',
  'antigua and barbuda': 'ag',
  argentina: 'ar',
  armenia: 'am',
  aruba: 'aw',
  australia: 'au',
  austria: 'at',
  azerbaijan: 'az',
  // B
  bahamas: 'bs',
  'the bahamas': 'bs',
  bahrain: 'bh',
  bangladesh: 'bd',
  barbados: 'bb',
  belarus: 'by',
  belgium: 'be',
  belize: 'bz',
  benin: 'bj',
  bermuda: 'bm',
  bhutan: 'bt',
  'bolivia, plurinational state of': 'bo',
  bolivia: 'bo',
  'bonaire, sint eustatius and saba': 'bq',
  'caribbean netherlands': 'bq',
  'bosnia and herzegovina': 'ba',
  botswana: 'bw',
  'bouvet island': 'bv',
  brazil: 'br',
  'british indian ocean territory': 'io',
  'brunei darussalam': 'bn',
  brunei: 'bn',
  bulgaria: 'bg',
  'burkina faso': 'bf',
  burundi: 'bi',
  // C
  'cabo verde': 'cv',
  'cape verde': 'cv',
  cambodia: 'kh',
  cameroon: 'cm',
  canada: 'ca',
  'cayman islands': 'ky',
  'central african republic': 'cf',
  chad: 'td',
  chile: 'cl',
  china: 'cn',
  'christmas island': 'cx',
  'cocos (keeling) islands': 'cc',
  'cocos islands': 'cc',
  colombia: 'co',
  comoros: 'km',
  congo: 'cg',
  'republic of the congo': 'cg',
  'congo, democratic republic of the': 'cd',
  'democratic republic of the congo': 'cd',
  'congo, republic of the': 'cg',
  'cook islands': 'ck',
  'costa rica': 'cr',
  "côte d'ivoire": 'ci',
  'ivory coast': 'ci',
  croatia: 'hr',
  cuba: 'cu',
  curaçao: 'cw',
  curacao: 'cw',
  cyprus: 'cy',
  'czechia': 'cz',
  'czech republic': 'cz',
  // D
  denmark: 'dk',
  djibouti: 'dj',
  dominica: 'dm',
  'dominican republic': 'do',
  // E
  ecuador: 'ec',
  egypt: 'eg',
  'el salvador': 'sv',
  salvador: 'sv',
  'equatorial guinea': 'gq',
  eritrea: 'er',
  estonia: 'ee',
  eswatini: 'sz',
  swaziland: 'sz',
  ethiopia: 'et',
  // F
  'falkland islands (malvinas)': 'fk',
  'falkland islands': 'fk',
  'faroe islands': 'fo',
  fiji: 'fj',
  finland: 'fi',
  france: 'fr',
  'french guiana': 'gf',
  'french polynesia': 'pf',
  'french southern territories': 'tf',
  'federated states of micronesia': 'fm',
  micronesia: 'fm',
  // G
  gabon: 'ga',
  gambia: 'gm',
  'the gambia': 'gm',
  georgia: 'ge',
  germany: 'de',
  ghana: 'gh',
  gibraltar: 'gi',
  greece: 'gr',
  greenland: 'gl',
  grenada: 'gd',
  guadeloupe: 'gp',
  guam: 'gu',
  guatemala: 'gt',
  guernsey: 'gg',
  guinea: 'gn',
  'guinea-bissau': 'gw',
  guyana: 'gy',
  // H
  haiti: 'ht',
  'heard island and mcdonald islands': 'hm',
  'holy see': 'va',
  'vatican city': 'va',
  honduras: 'hn',
  'hong kong': 'hk',
  hungary: 'hu',
  // I
  iceland: 'is',
  india: 'in',
  indonesia: 'id',
  'iran, islamic republic of': 'ir',
  iran: 'ir',
  iraq: 'iq',
  ireland: 'ie',
  'republic of ireland': 'ie',
  'isle of man': 'im',
  israel: 'il',
  italy: 'it',
  // J
  jamaica: 'jm',
  japan: 'jp',
  jersey: 'je',
  jordan: 'jo',
  // K
  kazakhstan: 'kz',
  kenya: 'ke',
  kiribati: 'ki',
  "korea, democratic people's republic of": 'kp',
  'north korea': 'kp',
  "korea, republic of": 'kr',
  'south korea': 'kr',
  kosovo: 'xk',
  kuwait: 'kw',
  kyrgyzstan: 'kg',
  // L
  "lao people's democratic republic": 'la',
  laos: 'la',
  latvia: 'lv',
  lebanon: 'lb',
  lesotho: 'ls',
  liberia: 'lr',
  libya: 'ly',
  liechtenstein: 'li',
  lithuania: 'lt',
  luxembourg: 'lu',
  // M
  macao: 'mo',
  macau: 'mo',
  'north macedonia': 'mk',
  macedonia: 'mk',
  madagascar: 'mg',
  malawi: 'mw',
  malaysia: 'my',
  maldives: 'mv',
  mali: 'ml',
  malta: 'mt',
  'marshall islands': 'mh',
  martinique: 'mq',
  mauritania: 'mr',
  mauritius: 'mu',
  mayotte: 'yt',
  mexico: 'mx',
  moldova: 'md',
  'republic of moldova': 'md',
  monaco: 'mc',
  mongolia: 'mn',
  montenegro: 'me',
  montserrat: 'ms',
  morocco: 'ma',
  mozambique: 'mz',
  myanmar: 'mm',
  burma: 'mm',
  // N
  namibia: 'na',
  nauru: 'nr',
  nepal: 'np',
  netherlands: 'nl',
  'kingdom of the netherlands': 'nl',
  'new caledonia': 'nc',
  'new zealand': 'nz',
  nicaragua: 'ni',
  niger: 'ne',
  nigeria: 'ng',
  niue: 'nu',
  'norfolk island': 'nf',
  'northern mariana islands': 'mp',
  norway: 'no',
  // O
  oman: 'om',
  // P
  pakistan: 'pk',
  palau: 'pw',
  'palestine, state of': 'ps',
  palestine: 'ps',
  panama: 'pa',
  'papua new guinea': 'pg',
  paraguay: 'py',
  peru: 'pe',
  philippines: 'ph',
  'pitcairn': 'pn',
  'pitcairn islands': 'pn',
  poland: 'pl',
  portugal: 'pt',
  'puerto rico': 'pr',
  // Q
  qatar: 'qa',
  // R
  réunion: 're',
  reunion: 're',
  romania: 'ro',
  'russian federation': 'ru',
  russia: 'ru',
  rwanda: 'rw',
  // S
  'saint barthélemy': 'bl',
  'saint barthelemy': 'bl',
  'saint helena, ascension and tristan da cunha': 'sh',
  'saint helena': 'sh',
  'saint kitts and nevis': 'kn',
  'saint lucia': 'lc',
  'saint martin (french part)': 'mf',
  'saint pierre and miquelon': 'pm',
  'saint vincent and the grenadines': 'vc',
  samoa: 'ws',
  'western samoa': 'ws',
  'san marino': 'sm',
  'sao tome and principe': 'st',
  'são tomé and príncipe': 'st',
  'saudi arabia': 'sa',
  senegal: 'sn',
  serbia: 'rs',
  seychelles: 'sc',
  'sierra leone': 'sl',
  singapore: 'sg',
  'sint maarten (dutch part)': 'sx',
  'sint maarten': 'sx',
  slovakia: 'sk',
  slovenia: 'si',
  'solomon islands': 'sb',
  somalia: 'so',
  'south africa': 'za',
  'south georgia and the south sandwich islands': 'gs',
  'south sudan': 'ss',
  spain: 'es',
  'sri lanka': 'lk',
  sudan: 'sd',
  suriname: 'sr',
  'svalbard and jan mayen': 'sj',
  sweden: 'se',
  switzerland: 'ch',
  'syrian arab republic': 'sy',
  syria: 'sy',
  // T
  'taiwan, province of china': 'tw',
  taiwan: 'tw',
  tajikistan: 'tj',
  'tanzania, united republic of': 'tz',
  tanzania: 'tz',
  thailand: 'th',
  'timor-leste': 'tl',
  'east timor': 'tl',
  togo: 'tg',
  tokelau: 'tk',
  tonga: 'to',
  'trinidad and tobago': 'tt',
  tunisia: 'tn',
  'türkiye': 'tr',
  turkey: 'tr',
  turkmenistan: 'tm',
  'turks and caicos islands': 'tc',
  tuvalu: 'tv',
  // U
  uganda: 'ug',
  ukraine: 'ua',
  'united arab emirates': 'ae',
  uae: 'ae',
  'united kingdom of great britain and northern ireland': 'gb',
  'united kingdom': 'gb',
  uk: 'gb',
  'great britain': 'gb',
  'great britain and northern ireland': 'gb',
  'united states minor outlying islands': 'um',
  'united states of america': 'us',
  'united states': 'us',
  usa: 'us',
  uruguay: 'uy',
  uzbekistan: 'uz',
  // V
  vanuatu: 'vu',
  'venezuela, bolivarian republic of': 've',
  venezuela: 've',
  'viet nam': 'vn',
  vietnam: 'vn',
  'virgin islands (british)': 'vg',
  'british virgin islands': 'vg',
  'virgin islands (u.s.)': 'vi',
  'united states virgin islands': 'vi',
  'u.s. virgin islands': 'vi',
  // W
  'wallis and futuna': 'wf',
  'western sahara': 'eh',
  // Y
  yemen: 'ye',
  // Z
  zambia: 'zm',
  zimbabwe: 'zw',
};

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip diacritics for "Côte d'Ivoire" → "cote d'ivoire"
}

function buildSlugKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getCountryIso2(country: {
  label: string;
  value?: string;
  code?: string;
}): CountryIso2 | '' {
  const code = country.code?.toLowerCase().trim();
  if (code && code.length === 2) return code;
  const label = normalizeForMatch(country.label);
  if (label && LABEL_TO_ISO2[label]) return LABEL_TO_ISO2[label];
  const value = country.value ? normalizeForMatch(country.value) : '';
  if (value && LABEL_TO_ISO2[value]) return LABEL_TO_ISO2[value];
  const slug = country.value ? buildSlugKey(country.value) : buildSlugKey(country.label);
  if (slug && LABEL_TO_ISO2[slug]) return LABEL_TO_ISO2[slug];
  const labelSlug = label.replace(/\s+/g, '-').replace(/'/g, '');
  if (labelSlug && LABEL_TO_ISO2[labelSlug]) return LABEL_TO_ISO2[labelSlug];
  const withSpaces = (value || label).replace(/-/g, ' ');
  const normalizedSpaces = normalizeForMatch(withSpaces);
  if (normalizedSpaces && LABEL_TO_ISO2[normalizedSpaces]) return LABEL_TO_ISO2[normalizedSpaces];
  return '';
}

export function getCountryFlag(
  country: { label: string; value?: string; code?: string }
): string {
  return getCountryFlagEmoji(getCountryIso2(country));
}
