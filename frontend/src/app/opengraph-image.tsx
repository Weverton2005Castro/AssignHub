import { ImageResponse } from 'next/og';

export const alt = 'SubscriptionHub — Controle de assinaturas e gastos recorrentes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%', padding: 80, background: '#0f172a', color: '#ffffff' }}>
      <div style={{ fontSize: 32, color: '#a5b4fc' }}>SubscriptionHub</div>
      <div style={{ fontSize: 64, fontWeight: 700, marginTop: 32 }}>Controle suas assinaturas e gastos recorrentes</div>
      <div style={{ fontSize: 28, marginTop: 32 }}>Organize serviços. Acompanhe cobranças. Revise seus gastos.</div>
    </div>, size,
  );
}
