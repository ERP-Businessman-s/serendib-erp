import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Box, Sale, Truck, Money, Plus } from '../icons.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();
const fmtDate = (d) => { if (!d) return ''; const t = new Date(String(d).slice(0, 10)); return isNaN(t) ? String(d).slice(0, 10) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); };

// "2026-07" -> "Jul 26"
function monthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[Number(m) - 1] + ' ' + y.slice(2);
}

// One labelled bar. percent is 0-100.
function Bar({ label, value, percent, tint }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 92px', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ height: 9, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line-soft)' }}>
        <span style={{ display: 'block', height: '100%', width: Math.max(2, percent) + '%', background: tint || 'linear-gradient(90deg,var(--navy),var(--navy-2))', borderRadius: 999 }} />
      </span>
      <span className="tab-num" style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// Donut built from a CSS conic-gradient (no chart library).
function Donut({ segments, centerNum, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 100; acc += s.value; const end = (acc / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  }).join(', ');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ width: 118, height: 118, borderRadius: '50%', background: `conic-gradient(${stops})`, position: 'relative', flex: '0 0 auto' }}>
        <div style={{ position: 'absolute', inset: 15, borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="tab-num" style={{ fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1 }}>{centerNum}</span>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{centerLabel}</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flex: '0 0 auto' }} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <strong className="tab-num">{s.sub}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// The lot lifecycle as a left-to-right pipeline.
const LIFE = [
  { key: 'In Stock (rough)', label: 'Rough', cls: 'rough' },
  { key: 'In Cutting', label: 'In cutting', cls: 'cutting' },
  { key: 'In Stock (finished)', label: 'Finished', cls: 'finished' },
  { key: 'Reserved', label: 'Reserved', cls: 'reserved' },
  { key: 'Sold', label: 'Sold', cls: 'sold' },
];
function Pipeline({ byStatus }) {
  const m = {}; (byStatus || []).forEach((s) => { m[s.status] = s.count; });
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
      {LIFE.map((st, i) => (
        <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 0 auto' }}>
          <div style={{ textAlign: 'center', minWidth: 84 }}>
            <div className="tab-num" style={{ fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, marginBottom: 7 }}>{m[st.key] || 0}</div>
            <span className={'badge ' + st.cls}>{st.label}</span>
          </div>
          {i < LIFE.length - 1 && <span style={{ color: 'var(--line)', fontSize: 16 }}>&rarr;</span>}
        </div>
      ))}
    </div>
  );
}

function Kpi({ Icon, label, value, sub, tint }) {
  return (
    <div className="card pad stat">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="k">{label}</div>
        <span style={{ color: tint, opacity: .9 }}><Icon width={19} height={19} /></span>
      </div>
      <div className="v tab-num">{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState('');

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    api.get('/dashboard').then(setData).catch((e) => setError(e.message));
    Promise.all([api.get('/orders'), api.get('/invoices')]).then(([orders, invoices]) => {
      const evs = [];
      (Array.isArray(orders) ? orders : []).forEach((o) => evs.push({
        date: o.order_date, kind: 'order', color: '#2f9e70',
        title: `Order #${o.order_id} · ${o.customer_name}`,
        sub: `${o.channel === 'Online' ? 'Online shop' : 'Walk-in'} · ${o.status}`, amount: o.total_amount,
      }));
      (Array.isArray(invoices) ? invoices : []).forEach((iv) => evs.push({
        date: iv.invoice_date, kind: 'invoice', color: 'var(--gold)',
        title: `Invoice INV-${iv.invoice_id} · ${iv.customer_name}`,
        sub: iv.status, amount: iv.amount,
      }));
      evs.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      setActivity(evs.slice(0, 7));
    }).catch(() => {});
  }, []);

  if (error) return <div className="msg err">{error}</div>;
  if (!data) return <div className="empty">Loading dashboard...</div>;

  const byMonth = data.revenueByMonth || [];
  const byChannel = data.salesByChannel || [];
  const byType = data.stockValueByType || [];

  const maxMonth = Math.max(1, ...byMonth.map((m) => Number(m.total)));
  const maxType = Math.max(1, ...byType.map((t) => Number(t.value)));

  const channelSegs = byChannel.map((c) => ({
    label: c.channel === 'Online' ? 'Online shop' : (c.channel === 'WalkIn' ? 'Walk-in' : c.channel),
    value: Number(c.orders) || 0, sub: money(c.total),
    color: c.channel === 'Online' ? 'var(--gold)' : 'var(--navy)',
  }));
  const totalOrders = channelSegs.reduce((s, c) => s + c.value, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 26 }}>Dashboard</h2>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{today} · live from the database</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => nav('/sales')}><Plus width={15} height={15} /> New order</button>
          <button className="btn" onClick={() => nav('/inventory')}>Add lot</button>
          <button className="btn" onClick={() => nav('/procurement')}>New purchase</button>
          <button className="btn" onClick={() => nav('/reports')}>Generate report</button>
        </div>
      </div>

      {data.lowStock && (
        <div className="msg warn">Low stock warning: only {data.finishedInStock} finished lots in stock (below {data.lowStockLevel}).</div>
      )}

      <div className="stats">
        <Kpi Icon={Box} tint="var(--navy)" label="Lots in stock" value={data.lotsInStock} sub="rough + finished" />
        <Kpi Icon={Money} tint="var(--gold)" label="Stock value" value={money(data.stockValue)} sub="unsold inventory" />
        <Kpi Icon={Sale} tint="#2f9e70" label="Orders this month" value={data.ordersThisMonth} sub="confirmed sales" />
        <Kpi Icon={Truck} tint="var(--warn)" label="Revenue this month" value={money(data.revenueThisMonth)} sub="payments received" />
      </div>

      <div className="card pad" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Inventory lifecycle</h3>
        <Pipeline byStatus={data.lotsByStatus} />
      </div>

      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <div className="card pad">
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>Revenue, last 6 months</h3>
          {byMonth.length === 0 ? <div className="empty">No payments yet.</div> :
            byMonth.map((m) => (
              <Bar key={m.ym} label={monthLabel(m.ym)} value={money(m.total)} percent={Number(m.total) / maxMonth * 100} />
            ))}
        </div>

        <div className="card pad">
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>Sales by channel</h3>
          {totalOrders === 0 ? <div className="empty">No confirmed sales yet.</div> :
            <Donut segments={channelSegs} centerNum={totalOrders} centerLabel="orders" />}
        </div>

        <div className="card pad">
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>Stock value by gem type</h3>
          {byType.length === 0 ? <div className="empty">No stock yet.</div> :
            byType.map((t) => (
              <Bar key={t.gem_type} label={t.gem_type} value={money(t.value)} percent={Number(t.value) / maxType * 100}
                tint="linear-gradient(90deg,var(--gold),#d8b45e)" />
            ))}
        </div>

        <div className="card pad">
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>Recent activity</h3>
          {activity.length === 0 ? <div className="empty">Nothing yet.</div> :
            activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '9px 0', borderBottom: i < activity.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: a.color, flex: '0 0 auto' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.sub}</div>
                </div>
                <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                  <div className="tab-num" style={{ fontSize: 13, fontWeight: 600 }}>{money(a.amount)}</div>
                  <div className="tab-num" style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(a.date)}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
