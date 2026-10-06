import { ImageResponse } from 'next/og';
import { hero } from '@/content/home';
import { site } from '@/content/site';

export const alt = hero.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Open Graph image: navy background, white title and the wordmark (PRD section 14A). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0f2a44',
          color: '#ffffff',
          padding: 72,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 700 }}>{site.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>{hero.title}</div>
          <div style={{ fontSize: 34, marginTop: 28, color: '#cbd5e1' }}>{hero.eyebrow}</div>
        </div>
      </div>
    ),
    size,
  );
}
