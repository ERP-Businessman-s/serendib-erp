import { Chisel } from '../icons.jsx';

// Used for modules that are planned but not built yet (Cutting, Billing).
export default function Placeholder({ title, note }) {
  return (
    <div>
      <div className="section-title"><h2>{title}</h2></div>
      <div className="card pad" style={{ textAlign: 'center', padding: 50 }}>
        <Chisel width={30} height={30} style={{ color: 'var(--gold)' }} />
        <h3 style={{ fontSize: 20, margin: '12px 0 8px' }}>Coming next</h3>
        <p style={{ color: 'var(--muted)', maxWidth: 460, margin: '0 auto' }}>{note}</p>
      </div>
    </div>
  );
}
