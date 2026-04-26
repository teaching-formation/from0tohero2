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

/** Décode les entités HTML courantes (ex: &amp;amp; → &) — safe, sans DOM */
export function decodeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
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
