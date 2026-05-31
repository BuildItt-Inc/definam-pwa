import Link from 'next/link';

export default function SplashScreen() {
  return (
    <main style={{
      backgroundColor: '#0A0F1E',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 18px 28px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>

      {/* Green radial glow top-right */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '160px', height: '160px',
        background: 'radial-gradient(circle, rgba(27,107,74,0.35) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Logo icon */}
      <div style={{
        width: '52px', height: '52px',
        backgroundColor: '#1B6B4A',
        borderRadius: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <svg width="28" height="28" viewBox="0 0 38 38" fill="none">
          <path d="M8 28L15 8L22 22L27 14L34 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="19" cy="10" r="3" fill="#24A06E"/>
        </svg>
      </div>

      {/* Wordmark */}
      <h1 style={{
        fontSize: '26px', fontWeight: 900,
        color: '#FFFFFF', letterSpacing: '-1px',
        marginBottom: '6px'
      }}>DefinAm</h1>

      {/* Tagline */}
      <p style={{
        fontSize: '13px', color: 'rgba(255,255,255,0.4)',
        marginBottom: '10px'
      }}>Nigeria&apos;s AI learning brain</p>

      {/* Quote pill */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '20px',
        padding: '6px 14px',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
        fontStyle: 'italic',
        marginBottom: '32px'
      }}>
        &ldquo;Knows what you&apos;ve forgotten before you do.&rdquo;
      </div>

      {/* Primary CTA */}
      <Link href="/auth/code-entry" style={{
        width: '100%', maxWidth: '320px',
        display: 'block',
        backgroundColor: '#1B6B4A',
        color: 'white',
        borderRadius: '12px',
        padding: '14px',
        fontSize: '14px', fontWeight: 800,
        textDecoration: 'none',
        marginBottom: '10px'
      }}>
        Enter with Access Code
      </Link>

      {/* Secondary CTA */}
      <Link href="/auth/login" style={{
        width: '100%', maxWidth: '320px',
        display: 'block',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '12px',
        padding: '13px',
        fontSize: '13px', fontWeight: 600,
        color: 'rgba(255,255,255,0.4)',
        textDecoration: 'none'
      }}>
        Login (Individual)
      </Link>

    </main>
  );
}
