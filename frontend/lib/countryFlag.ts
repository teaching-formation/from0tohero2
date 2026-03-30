// Maps canonique pays → { drapeau, nom normalisé }
// Gère les variantes orthographiques (accents, apostrophes, casse)

const MAP: Record<string, { flag: string; name: string }> = {
  // Afrique de l'Ouest
  "cote d'ivoire":     { flag: '🇨🇮', name: "Côte d'Ivoire" },
  "côte d'ivoire":     { flag: '🇨🇮', name: "Côte d'Ivoire" },
  "ivory coast":       { flag: '🇨🇮', name: "Côte d'Ivoire" },
  senegal:             { flag: '🇸🇳', name: 'Sénégal' },
  sénégal:             { flag: '🇸🇳', name: 'Sénégal' },
  mali:                { flag: '🇲🇱', name: 'Mali' },
  guinee:              { flag: '🇬🇳', name: 'Guinée' },
  guinée:              { flag: '🇬🇳', name: 'Guinée' },
  guinea:              { flag: '🇬🇳', name: 'Guinée' },
  'guinee-bissau':     { flag: '🇬🇼', name: 'Guinée-Bissau' },
  'guinée-bissau':     { flag: '🇬🇼', name: 'Guinée-Bissau' },
  togo:                { flag: '🇹🇬', name: 'Togo' },
  benin:               { flag: '🇧🇯', name: 'Bénin' },
  bénin:               { flag: '🇧🇯', name: 'Bénin' },
  burkina:             { flag: '🇧🇫', name: 'Burkina Faso' },
  'burkina faso':      { flag: '🇧🇫', name: 'Burkina Faso' },
  niger:               { flag: '🇳🇪', name: 'Niger' },
  nigeria:             { flag: '🇳🇬', name: 'Nigeria' },
  ghana:               { flag: '🇬🇭', name: 'Ghana' },
  'sierra leone':      { flag: '🇸🇱', name: 'Sierra Leone' },
  liberia:             { flag: '🇱🇷', name: 'Liberia' },
  'cap-vert':          { flag: '🇨🇻', name: 'Cap-Vert' },
  gambie:              { flag: '🇬🇲', name: 'Gambie' },
  mauritanie:          { flag: '🇲🇷', name: 'Mauritanie' },
  // Afrique centrale
  cameroun:            { flag: '🇨🇲', name: 'Cameroun' },
  cameroon:            { flag: '🇨🇲', name: 'Cameroun' },
  congo:               { flag: '🇨🇬', name: 'Congo' },
  'rdc':               { flag: '🇨🇩', name: 'RD Congo' },
  'rd congo':          { flag: '🇨🇩', name: 'RD Congo' },
  'republique democratique du congo': { flag: '🇨🇩', name: 'RD Congo' },
  'gabon':             { flag: '🇬🇦', name: 'Gabon' },
  'tchad':             { flag: '🇹🇩', name: 'Tchad' },
  'centrafrique':      { flag: '🇨🇫', name: 'Centrafrique' },
  'guinee equatoriale':{ flag: '🇬🇶', name: 'Guinée équatoriale' },
  'sao tome':          { flag: '🇸🇹', name: 'São Tomé' },
  burundi:             { flag: '🇧🇮', name: 'Burundi' },
  rwanda:              { flag: '🇷🇼', name: 'Rwanda' },
  // Afrique de l'Est
  kenya:               { flag: '🇰🇪', name: 'Kenya' },
  tanzanie:            { flag: '🇹🇿', name: 'Tanzanie' },
  tanzania:            { flag: '🇹🇿', name: 'Tanzanie' },
  ouganda:             { flag: '🇺🇬', name: 'Ouganda' },
  uganda:              { flag: '🇺🇬', name: 'Ouganda' },
  ethiopie:            { flag: '🇪🇹', name: 'Éthiopie' },
  éthiopie:            { flag: '🇪🇹', name: 'Éthiopie' },
  ethiopia:            { flag: '🇪🇹', name: 'Éthiopie' },
  somalie:             { flag: '🇸🇴', name: 'Somalie' },
  djibouti:            { flag: '🇩🇯', name: 'Djibouti' },
  'comores':           { flag: '🇰🇲', name: 'Comores' },
  madagascar:          { flag: '🇲🇬', name: 'Madagascar' },
  mauritius:           { flag: '🇲🇺', name: 'Maurice' },
  maurice:             { flag: '🇲🇺', name: 'Maurice' },
  mozambique:          { flag: '🇲🇿', name: 'Mozambique' },
  zimbabwe:            { flag: '🇿🇼', name: 'Zimbabwe' },
  zambie:              { flag: '🇿🇲', name: 'Zambie' },
  zambia:              { flag: '🇿🇲', name: 'Zambie' },
  malawi:              { flag: '🇲🇼', name: 'Malawi' },
  // Afrique du Nord
  maroc:               { flag: '🇲🇦', name: 'Maroc' },
  morocco:             { flag: '🇲🇦', name: 'Maroc' },
  algerie:             { flag: '🇩🇿', name: 'Algérie' },
  algérie:             { flag: '🇩🇿', name: 'Algérie' },
  algeria:             { flag: '🇩🇿', name: 'Algérie' },
  tunisie:             { flag: '🇹🇳', name: 'Tunisie' },
  tunisia:             { flag: '🇹🇳', name: 'Tunisie' },
  egypte:              { flag: '🇪🇬', name: 'Égypte' },
  égypte:              { flag: '🇪🇬', name: 'Égypte' },
  egypt:               { flag: '🇪🇬', name: 'Égypte' },
  libye:               { flag: '🇱🇾', name: 'Libye' },
  libya:               { flag: '🇱🇾', name: 'Libye' },
  soudan:              { flag: '🇸🇩', name: 'Soudan' },
  sudan:               { flag: '🇸🇩', name: 'Soudan' },
  'soudan du sud':     { flag: '🇸🇸', name: 'Soudan du Sud' },
  // Afrique australe
  'afrique du sud':    { flag: '🇿🇦', name: 'Afrique du Sud' },
  'south africa':      { flag: '🇿🇦', name: 'Afrique du Sud' },
  angola:              { flag: '🇦🇴', name: 'Angola' },
  namibie:             { flag: '🇳🇦', name: 'Namibie' },
  botswana:            { flag: '🇧🇼', name: 'Botswana' },
  lesotho:             { flag: '🇱🇸', name: 'Lesotho' },
  swaziland:           { flag: '🇸🇿', name: 'Eswatini' },
  eswatini:            { flag: '🇸🇿', name: 'Eswatini' },
  // Diaspora
  france:              { flag: '🇫🇷', name: 'France' },
  belgique:            { flag: '🇧🇪', name: 'Belgique' },
  suisse:              { flag: '🇨🇭', name: 'Suisse' },
  canada:              { flag: '🇨🇦', name: 'Canada' },
  'etats-unis':        { flag: '🇺🇸', name: 'États-Unis' },
  'états-unis':        { flag: '🇺🇸', name: 'États-Unis' },
  usa:                 { flag: '🇺🇸', name: 'États-Unis' },
  'royaume-uni':       { flag: '🇬🇧', name: 'Royaume-Uni' },
  'united kingdom':    { flag: '🇬🇧', name: 'Royaume-Uni' },
  uk:                  { flag: '🇬🇧', name: 'Royaume-Uni' },
  allemagne:           { flag: '🇩🇪', name: 'Allemagne' },
  germany:             { flag: '🇩🇪', name: 'Allemagne' },
  espagne:             { flag: '🇪🇸', name: 'Espagne' },
  italie:              { flag: '🇮🇹', name: 'Italie' },
  portugal:            { flag: '🇵🇹', name: 'Portugal' },
  'pays-bas':          { flag: '🇳🇱', name: 'Pays-Bas' },
  luxembourg:          { flag: '🇱🇺', name: 'Luxembourg' },
};

// Normalise une clé : minuscules + trim (garde apostrophes et tirets)
function normalize(s: string) {
  return s.toLowerCase().trim();
}

/** Retourne le drapeau emoji + nom canonique pour un pays.
 *  Si non trouvé, retourne { flag: '', name: original }  */
export function getCountryDisplay(country: string | null | undefined): { flag: string; name: string } {
  if (!country) return { flag: '', name: '' };
  const key = normalize(country);
  // Déjà un emoji flag (ex: stocké directement en DB)
  if (/^\p{Emoji_Presentation}/u.test(country.trim())) {
    // Cherche par valeur de flag dans le MAP
    const found = Object.values(MAP).find(v => v.flag === country.trim());
    return found ?? { flag: country.trim(), name: '' };
  }
  return MAP[key] ?? { flag: '', name: country };
}
