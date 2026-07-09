// A simple tab strip. Used by Procurement (Suppliers / Purchases) and Sales
// (Customers / Orders).
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 22 }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            border: 0, background: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            padding: '10px 16px', marginBottom: -1,
            color: active === t.key ? 'var(--ink)' : 'var(--muted)',
            borderBottom: active === t.key ? '2px solid var(--gold)' : '2px solid transparent',
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}
