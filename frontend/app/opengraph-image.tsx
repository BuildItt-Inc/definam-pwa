import { ImageResponse } from 'next/og';

export const alt = 'Recall — Study smarter. Remember longer.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: 72, gap: 48, background: 'linear-gradient(135deg, #071321, #0d302b)', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 570 }}>
        <div style={{ display: 'flex', color: '#63f2c1', fontSize: 34, fontWeight: 700, marginBottom: 34 }}>recall</div>
        <div style={{ display: 'flex', fontSize: 62, fontWeight: 700, lineHeight: 1.12 }}>Study smarter.</div>
        <div style={{ display: 'flex', fontSize: 62, fontWeight: 700, lineHeight: 1.12, marginBottom: 30 }}>Remember longer.</div>
        <div style={{ display: 'flex', fontSize: 26, lineHeight: 1.5, color: '#d5e5ee' }}>Clear explanations. Practice questions. Spaced review.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: 32, width: 360, borderRadius: 28, background: '#12263c', border: '1px solid #366071' }}>
        <div style={{ display: 'flex', fontSize: 22, color: '#63f2c1', marginBottom: 24 }}>Learn it clearly</div>
        <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, marginBottom: 24 }}>2x + 3 = 11</div>
        <div style={{ display: 'flex', fontSize: 24, color: '#d5e5ee' }}>Subtract 3. Divide by 2.</div>
        <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, marginTop: 22, color: '#63f2c1' }}>x = 4</div>
      </div>
    </div>, size
  );
}
