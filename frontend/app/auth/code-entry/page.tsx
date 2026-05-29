'use client';
import Link from 'next/link';

export default function CodeEntryPage() {
  return (
    <main style={{
      backgroundColor: '#0A0F1E',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>

      {/* App bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <Link href="/" style={{
          fontSize: '20px', fontWeight: 700,
          color: '#F5F0E8', textDecoration: 'none',
          lineHeight: 1, marginRight: '8px'
        }}>←</Link>
        <span style={{
          fontSize: '16px', fontWeight: 700, color: '#F5F0E8'
        }}>Student Access</span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px'
      }}>

        {/* Info card */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '24px',
          display: 'flex', gap: '12px', alignItems: 'flex-start'
        }}>
          <div style={{
            width: '36px', height: '36px',
            backgroundColor: '#1A1A1A',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0
          }}>
            🏫
          </div>
          <div>
            <div style={{
              fontSize: '13px', fontWeight: 800,
              color: '#F5F0E8', marginBottom: '3px'
            }}>
              Your school paid for your access
            </div>
            <div style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.5
            }}>
              Enter the unique code your school gave you. This code is your permanent login — no password needed.
            </div>
          </div>
        </div>

        {/* Label */}
        <div style={{
          fontSize: '10px', fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.3)',
          marginBottom: '8px'
        }}>
          Your Access Code
        </div>

        {/* Code input */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #1A1A1A',
          borderRadius: '12px',
          padding: '6px 12px',
          marginBottom: '8px'
        }}>
          <input
            type="text"
            placeholder="DA-XXXX-XX"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '20px',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '5px',
              color: '#1A1A1A',
              textAlign: 'center',
              padding: '10px 0',
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Helper text */}
        <div style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.3)',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          Code format: DA-XXXX-XX · Case insensitive
        </div>

        {/* Primary button */}
        <Link href="/" style={{
          width: '100%',
          display: 'block',
          backgroundColor: '#1B6B4A',
          color: '#F5F0E8',
          borderRadius: '12px',
          padding: '14px',
          fontSize: '14px', fontWeight: 700,
          textDecoration: 'none',
          textAlign: 'center',
          marginBottom: '28px'
        }}>
          Access My Account →
        </Link>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '16px'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
            How it works
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'Your school paid ₦1,700 per student per term',
            'The system generated a unique code for each student',
            'Enter your code once — this device is now your DefinAm login forever'
          ].map((text, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start'
            }}>
              <div style={{
                width: '22px', height: '22px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800,
                color: 'rgba(255,255,255,0.4)',
                flexShrink: 0
              }}>
                {i + 1}
              </div>
              <span style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.5, paddingTop: '2px'
              }}>
                {text}
              </span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
