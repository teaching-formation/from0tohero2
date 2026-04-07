// Maps canonique pays → { drapeau emoji, nom normalisé, code ISO 2 lettres }
// Le code ISO permet d'utiliser flagcdn.com pour des images cross-platform

const MAP: Record<string, { flag: string; name: string; iso: string }> = {
  // Afrique de l'Ouest
  "cote d'ivoire":     { flag: '🇨🇮', name: "Côte d'Ivoire", iso: 'ci' },
  "côte d'ivoire":     { flag: '🇨🇮', name: "Côte d'Ivoire", iso: 'ci' },
  "cote d\u2019ivoire":{ flag: '🇨🇮', name: "Côte d'Ivoire", iso: 'ci' },
  "côte d\u2019ivoire":{ flag: '🇨🇮', name: "Côte d'Ivoire", iso: 'ci' },
  "ivory coast":       { flag: '🇨🇮', name: "Côte d'Ivoire", iso: 'ci' },
  senegal:             { flag: '🇸🇳', name: 'Sénégal',        iso: 'sn' },
  sénégal:             { flag: '🇸🇳', name: 'Sénégal',        iso: 'sn' },
  mali:                { flag: '🇲🇱', name: 'Mali',           iso: 'ml' },
  guinee:              { flag: '🇬🇳', name: 'Guinée',         iso: 'gn' },
  guinée:              { flag: '🇬🇳', name: 'Guinée',         iso: 'gn' },
  guinea:              { flag: '🇬🇳', name: 'Guinée',         iso: 'gn' },
  'guinee-bissau':     { flag: '🇬🇼', name: 'Guinée-Bissau',  iso: 'gw' },
  'guinée-bissau':     { flag: '🇬🇼', name: 'Guinée-Bissau',  iso: 'gw' },
  togo:                { flag: '🇹🇬', name: 'Togo',           iso: 'tg' },
  benin:               { flag: '🇧🇯', name: 'Bénin',          iso: 'bj' },
  bénin:               { flag: '🇧🇯', name: 'Bénin',          iso: 'bj' },
  burkina:             { flag: '🇧🇫', name: 'Burkina Faso',   iso: 'bf' },
  'burkina faso':      { flag: '🇧🇫', name: 'Burkina Faso',   iso: 'bf' },
  niger:               { flag: '🇳🇪', name: 'Niger',          iso: 'ne' },
  nigeria:             { flag: '🇳🇬', name: 'Nigeria',        iso: 'ng' },
  ghana:               { flag: '🇬🇭', name: 'Ghana',          iso: 'gh' },
  'sierra leone':      { flag: '🇸🇱', name: 'Sierra Leone',   iso: 'sl' },
  liberia:             { flag: '🇱🇷', name: 'Liberia',        iso: 'lr' },
  'cap-vert':          { flag: '🇨🇻', name: 'Cap-Vert',       iso: 'cv' },
  gambie:              { flag: '🇬🇲', name: 'Gambie',         iso: 'gm' },
  mauritanie:          { flag: '🇲🇷', name: 'Mauritanie',     iso: 'mr' },
  // Afrique centrale
  cameroun:            { flag: '🇨🇲', name: 'Cameroun',       iso: 'cm' },
  cameroon:            { flag: '🇨🇲', name: 'Cameroun',       iso: 'cm' },
  congo:               { flag: '🇨🇬', name: 'Congo',          iso: 'cg' },
  'rdc':               { flag: '🇨🇩', name: 'RD Congo',       iso: 'cd' },
  'rd congo':          { flag: '🇨🇩', name: 'RD Congo',       iso: 'cd' },
  'republique democratique du congo': { flag: '🇨🇩', name: 'RD Congo', iso: 'cd' },
  gabon:               { flag: '🇬🇦', name: 'Gabon',          iso: 'ga' },
  tchad:               { flag: '🇹🇩', name: 'Tchad',          iso: 'td' },
  centrafrique:        { flag: '🇨🇫', name: 'Centrafrique',   iso: 'cf' },
  'guinee equatoriale':{ flag: '🇬🇶', name: 'Guinée équatoriale', iso: 'gq' },
  'sao tome':          { flag: '🇸🇹', name: 'São Tomé',       iso: 'st' },
  burundi:             { flag: '🇧🇮', name: 'Burundi',        iso: 'bi' },
  rwanda:              { flag: '🇷🇼', name: 'Rwanda',         iso: 'rw' },
  // Afrique de l'Est
  kenya:               { flag: '🇰🇪', name: 'Kenya',          iso: 'ke' },
  tanzanie:            { flag: '🇹🇿', name: 'Tanzanie',       iso: 'tz' },
  tanzania:            { flag: '🇹🇿', name: 'Tanzanie',       iso: 'tz' },
  ouganda:             { flag: '🇺🇬', name: 'Ouganda',        iso: 'ug' },
  uganda:              { flag: '🇺🇬', name: 'Ouganda',        iso: 'ug' },
  ethiopie:            { flag: '🇪🇹', name: 'Éthiopie',       iso: 'et' },
  éthiopie:            { flag: '🇪🇹', name: 'Éthiopie',       iso: 'et' },
  ethiopia:            { flag: '🇪🇹', name: 'Éthiopie',       iso: 'et' },
  somalie:             { flag: '🇸🇴', name: 'Somalie',        iso: 'so' },
  djibouti:            { flag: '🇩🇯', name: 'Djibouti',       iso: 'dj' },
  comores:             { flag: '🇰🇲', name: 'Comores',        iso: 'km' },
  madagascar:          { flag: '🇲🇬', name: 'Madagascar',     iso: 'mg' },
  mauritius:           { flag: '🇲🇺', name: 'Maurice',        iso: 'mu' },
  maurice:             { flag: '🇲🇺', name: 'Maurice',        iso: 'mu' },
  mozambique:          { flag: '🇲🇿', name: 'Mozambique',     iso: 'mz' },
  zimbabwe:            { flag: '🇿🇼', name: 'Zimbabwe',       iso: 'zw' },
  zambie:              { flag: '🇿🇲', name: 'Zambie',         iso: 'zm' },
  zambia:              { flag: '🇿🇲', name: 'Zambie',         iso: 'zm' },
  malawi:              { flag: '🇲🇼', name: 'Malawi',         iso: 'mw' },
  // Afrique du Nord
  maroc:               { flag: '🇲🇦', name: 'Maroc',          iso: 'ma' },
  morocco:             { flag: '🇲🇦', name: 'Maroc',          iso: 'ma' },
  algerie:             { flag: '🇩🇿', name: 'Algérie',        iso: 'dz' },
  algérie:             { flag: '🇩🇿', name: 'Algérie',        iso: 'dz' },
  algeria:             { flag: '🇩🇿', name: 'Algérie',        iso: 'dz' },
  tunisie:             { flag: '🇹🇳', name: 'Tunisie',        iso: 'tn' },
  tunisia:             { flag: '🇹🇳', name: 'Tunisie',        iso: 'tn' },
  egypte:              { flag: '🇪🇬', name: 'Égypte',         iso: 'eg' },
  égypte:              { flag: '🇪🇬', name: 'Égypte',         iso: 'eg' },
  egypt:               { flag: '🇪🇬', name: 'Égypte',         iso: 'eg' },
  libye:               { flag: '🇱🇾', name: 'Libye',          iso: 'ly' },
  libya:               { flag: '🇱🇾', name: 'Libye',          iso: 'ly' },
  soudan:              { flag: '🇸🇩', name: 'Soudan',         iso: 'sd' },
  sudan:               { flag: '🇸🇩', name: 'Soudan',         iso: 'sd' },
  'soudan du sud':     { flag: '🇸🇸', name: 'Soudan du Sud',  iso: 'ss' },
  // Afrique australe
  'afrique du sud':    { flag: '🇿🇦', name: 'Afrique du Sud', iso: 'za' },
  'south africa':      { flag: '🇿🇦', name: 'Afrique du Sud', iso: 'za' },
  angola:              { flag: '🇦🇴', name: 'Angola',         iso: 'ao' },
  namibie:             { flag: '🇳🇦', name: 'Namibie',        iso: 'na' },
  botswana:            { flag: '🇧🇼', name: 'Botswana',       iso: 'bw' },
  lesotho:             { flag: '🇱🇸', name: 'Lesotho',        iso: 'ls' },
  swaziland:           { flag: '🇸🇿', name: 'Eswatini',       iso: 'sz' },
  eswatini:            { flag: '🇸🇿', name: 'Eswatini',       iso: 'sz' },
  // Diaspora & monde
  france:              { flag: '🇫🇷', name: 'France',         iso: 'fr' },
  belgique:            { flag: '🇧🇪', name: 'Belgique',       iso: 'be' },
  suisse:              { flag: '🇨🇭', name: 'Suisse',         iso: 'ch' },
  canada:              { flag: '🇨🇦', name: 'Canada',         iso: 'ca' },
  'etats-unis':        { flag: '🇺🇸', name: 'États-Unis',     iso: 'us' },
  'états-unis':        { flag: '🇺🇸', name: 'États-Unis',     iso: 'us' },
  usa:                 { flag: '🇺🇸', name: 'États-Unis',     iso: 'us' },
  'royaume-uni':       { flag: '🇬🇧', name: 'Royaume-Uni',    iso: 'gb' },
  'united kingdom':    { flag: '🇬🇧', name: 'Royaume-Uni',    iso: 'gb' },
  uk:                  { flag: '🇬🇧', name: 'Royaume-Uni',    iso: 'gb' },
  allemagne:           { flag: '🇩🇪', name: 'Allemagne',      iso: 'de' },
  germany:             { flag: '🇩🇪', name: 'Allemagne',      iso: 'de' },
  espagne:             { flag: '🇪🇸', name: 'Espagne',        iso: 'es' },
  italie:              { flag: '🇮🇹', name: 'Italie',         iso: 'it' },
  portugal:            { flag: '🇵🇹', name: 'Portugal',       iso: 'pt' },
  'pays-bas':          { flag: '🇳🇱', name: 'Pays-Bas',       iso: 'nl' },
  luxembourg:          { flag: '🇱🇺', name: 'Luxembourg',     iso: 'lu' },
};

// Normalise une clé : minuscules + trim + apostrophes/tirets uniformisés
function normalize(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019\u02bc\u0060]/g, "'") // ' ' ʼ ` → '
    .replace(/\u2013|\u2014/g, '-');              // – — → -
}

/** Retourne le drapeau emoji, nom canonique et code ISO pour un pays.
 *  Si non trouvé, retourne { flag: '', name: original, iso: '' } */
export function getCountryDisplay(country: string | null | undefined): { flag: string; name: string; iso: string } {
  if (!country) return { flag: '', name: '', iso: '' };
  const key = normalize(country);
  // Déjà un emoji flag stocké directement en DB
  if (/^\p{Emoji_Presentation}/u.test(country.trim())) {
    const found = Object.values(MAP).find(v => v.flag === country.trim());
    return found ?? { flag: country.trim(), name: '', iso: '' };
  }
  return MAP[key] ?? { flag: '', name: country, iso: '' };
}
