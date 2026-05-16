// ─────────────────────────────────────────────────────────────
//  Utilitaires partagés — from0tohero.dev
// ─────────────────────────────────────────────────────────────

/** Formate une date ISO en "07 avr. 2026 à 10:50" */
export function formatDateTime(date: string): string {
  const d = new Date(date);
  return (
    d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' à ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}

/** Formate une date ISO en "7 avr. 2026" */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Formate une heure ISO en "10:50" */
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });
}

/** Décode les entités HTML courantes + accents français — safe, sans DOM */
export function decodeHtml(str: string | undefined | null): string {
  if (!str) return '';

  // Entités numériques décimales : &#233; → é
  // Entités numériques hexadécimales : &#xE9; → é
  let s = str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

  // Table des entités nommées — standard + typographiques + accents français
  const NAMED: Record<string, string> = {
    // Basiques
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
    nbsp: ' ',
    // Typographiques
    rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
    hellip: '…', ndash: '–', mdash: '—',
    bull: '•', middot: '·', laquo: '«', raquo: '»',
    copy: '©', reg: '®', trade: '™', euro: '€',
    // Lettres accentuées — minuscules
    agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ',
    ccedil: 'ç',
    egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë',
    igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï',
    eth: 'ð', ntilde: 'ñ',
    ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö', oslash: 'ø',
    ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü',
    yacute: 'ý', thorn: 'þ', yuml: 'ÿ',
    szlig: 'ß', oelig: 'œ', scaron: 'š',
    // Lettres accentuées — majuscules
    Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä', Aring: 'Å', AElig: 'Æ',
    Ccedil: 'Ç',
    Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë',
    Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï',
    ETH: 'Ð', Ntilde: 'Ñ',
    Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Ouml: 'Ö', Oslash: 'Ø',
    Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Uuml: 'Ü',
    Yacute: 'Ý', THORN: 'Þ',
    OElig: 'Œ', Scaron: 'Š',
  };

  return s.replace(/&([a-zA-Z]+);/g, (match, name) => NAMED[name] ?? match);
}

/** Retourne une durée relative : "il y a 5min", "il y a 3h", "il y a 2j" */
export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'à l\'instant';
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}
