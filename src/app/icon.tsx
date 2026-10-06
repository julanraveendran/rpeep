import { ImageResponse } from 'next/og';
import { site } from '@/content/site';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

/** Favicon: a square navy monogram (the first letter of the brand name) in white (PRD section 5). */
export default function Icon() {
  const initial = (site.name.match(/[A-Za-z0-9]/)?.[0] ?? 'R').toUpperCase();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f2a44',
          color: '#ffffff',
          fontSize: 42,
          fontWeight: 700,
          borderRadius: 12,
        }}
      >
        {initial}
      </div>
    ),
    size,
  );
}
