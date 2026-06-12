import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Imagem Open Graph da marca (1200×630), gerada no edge e cacheada.
// Substitui o antigo /og-image.png que era referenciado mas não existia —
// partilhas no WhatsApp/Facebook/Instagram e anúncios Meta ficavam sem imagem.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2A1A1D 55%, #1A1A1A 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(183,110,121,0.35) 0%, rgba(183,110,121,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -180,
            left: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(201,169,110,0.28) 0%, rgba(201,169,110,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            fontSize: 30,
            letterSpacing: 14,
            color: '#C9A96E',
            textTransform: 'uppercase',
            marginBottom: 28,
          }}
        >
          Dermopigmentação Avançada
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#FDF8F5',
            lineHeight: 1.05,
            textAlign: 'center',
          }}
        >
          Francielly Costa
        </div>
        <div
          style={{
            width: 140,
            height: 3,
            background: 'linear-gradient(90deg, #B76E79, #C9A96E)',
            marginTop: 36,
            marginBottom: 32,
            display: 'flex',
          }}
        />
        <div style={{ fontSize: 32, color: 'rgba(253,248,245,0.75)' }}>
          Microblading · Lábios · Eyeliner · FiberBROWS — Braga
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
      },
    }
  )
}
