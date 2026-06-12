import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Ícone PWA 512×512 (também serve de maskable). Referenciado em manifest.json.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #B76E79 0%, #C9A96E 100%)',
          color: '#FFFFFF',
          fontSize: 256,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
        }}
      >
        FC
      </div>
    ),
    { width: 512, height: 512, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } }
  )
}
