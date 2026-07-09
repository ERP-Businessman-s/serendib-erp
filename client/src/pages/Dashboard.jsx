import { useEffect, useState } from 'react';
import { api } from '../api.js';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="msg err">{error}</div>;
  if (!data) return <div className="empty">Loading dashboard...</div>;

  const maxStatus = Math.max(1, ...data.lotsByStatus.map((s) => s.count));

  return (
    <div>
      <div className="section-title">
        <h2>Dashboard</h2>
        <span className="sub">Live numbers from the database</span>
      </div>

      {data.lowStock && (
        <div className="msg warn">Low stock warning: only {data.finishedInStock} finished lots in stock (below {data.lowStockLevel}).</div>
      )}

      <div className="stats">
        <div className="card pad stat"><div className="k">Lots in stock</div><div className="v tab-num">{data.lotsInStock}</div></div>
        <div className="card pad stat"><div className="k">Stock value</div><div className="v tab-num">{money(data.stockValue)}</div></div>
        <div className="card pad stat"><div className="k">Orders this month</div><div className="v tab-num">{data.ordersThisMonth}</div></div>
        <div className="card pad stat"><div className="k">Revenue this month</div><div className="v tab-num">{money(data.revenueThisMonth)}</div></div>
      </div>

      <div className="card pad" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 20, marginBottom: 14 }}>Lots by status</h3>
        {data.lotsByStatus.map((s) => (
          <div key={s.status} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 40px', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{s.status}</span>
            <span style={{ height: 9, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line-soft)' }}>
              <span style={{ display: 'block', height: '100%', width: (s.count / maxStatus * 100) + '%', background: 'linear-gradient(90deg,var(--navy),var(--navy-2))', borderRadius: 999 }} />
            </span>
            <span className="tab-num" style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
