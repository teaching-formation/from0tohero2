// Helpers partagés admin

export const STATUS_FR: Record<string, string> = {
  pending:  'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

export function statusLabel(s: string): string {
  return STATUS_FR[s] ?? s;
}

/** Formatte une date ISO (YYYY-MM-DD ou ISO complet) → JJ/MM/AAAA */
export function fmtDate(s?: string | null): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return s;
  }
}
