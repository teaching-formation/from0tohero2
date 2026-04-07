import { getCountryDisplay } from '@/lib/countryFlag';

type Props = {
  country: string | null | undefined;
  size?: 16 | 20 | 24 | 32;
};

/**
 * Affiche le drapeau d'un pays via flagcdn.com — rendu identique sur tous les OS
 * (Mac, Windows, Linux). Fallback silencieux si le pays est inconnu.
 */
export default function FlagImg({ country, size = 20 }: Props) {
  const { iso, name } = getCountryDisplay(country);
  if (!iso) return null;

  const h = Math.round(size * 0.75); // ratio 4:3
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${size}x${h}/${iso}.png`}
      srcSet={`https://flagcdn.com/${size * 2}x${h * 2}/${iso}.png 2x`}
      alt={name || country || ''}
      title={name || country || ''}
      width={size}
      height={h}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
  );
}
