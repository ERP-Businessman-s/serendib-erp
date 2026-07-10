import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Printer } from '../icons.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();
const fmtDate = (d) => { if (!d) return ''; const t = new Date(String(d).slice(0, 10)); return isNaN(t) ? String(d).slice(0, 10) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const arr = (x) => (Array.isArray(x) ? x : []);

const REPORTS = [
  { key: 'summary', title: 'Business Summary', desc: 'Executive one-page overview of stock, sales and revenue.', tag: 'BI' },
  { key: 'sales', title: 'Sales Report', desc: 'All orders with revenue split by channel and status.', tag: 'Sales · CRM' },
  { key: 'inventory', title: 'Inventory Report', desc: 'Stock on hand, value by gem type and by status.', tag: 'Inventory · SCM' },
  { key: 'finance', title: 'Financial Report', desc: 'Invoices, payments and outstanding receivables (AR).', tag: 'Finance' },
];

export default function Reports() {
  const [d, setD] = useState(null);
  const [active, setActive] = useState('summary');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'), api.get('/orders'), api.get('/invoices'),
      api.get('/lots'), api.get('/suppliers'), api.get('/customers'),
    ]).then(([dash, orders, invoices, lots, suppliers, customers]) => {
      setD({ dash, orders: arr(orders), invoices: arr(invoices), lots: arr(lots), suppliers: arr(suppliers), customers: arr(customers) });
    }).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="msg err">{error}</div>;
  if (!d) return <div className="empty">Loading reports...</div>;

  // ---- derived numbers ----
  const dash = d.dash || {};
  const invTotals = d.invoices.reduce((a, i) => {
    a.sales += Number(i.amount || 0); a.received += Number(i.paid || 0); return a;
  }, { sales: 0, received: 0 });
  const outstanding = invTotals.sales - invTotals.received;
  const byStatus = dash.lotsByStatus || [];
  const byType = dash.stockValueByType || [];
  const byChannel = dash.salesByChannel || [];
  const confirmedRevenue = byChannel.reduce((s, c) => s + Number(c.total || 0), 0);

  const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  // ---------- printable report ----------
  function buildBody(type) {
    if (type === 'summary') {
      return `
        <div class="kpis">
          ${kpi('Lots in stock', dash.lotsInStock)}
          ${kpi('Stock value', money(dash.stockValue))}
          ${kpi('Orders this month', dash.ordersThisMonth)}
          ${kpi('Revenue this month', money(dash.revenueThisMonth))}
          ${kpi('Outstanding (AR)', money(outstanding))}
        </div>
        <h3>Inventory by status</h3>
        ${table(['Status', 'Lots'], byStatus.map((s) => [esc(s.status), s.count]))}
        <h3>Sales by channel (confirmed)</h3>
        ${table(['Channel', 'Orders', 'Revenue'], byChannel.map((c) => [c.channel === 'Online' ? 'Online shop' : 'Walk-in', c.orders, money(c.total)]))}
        <h3>Stock value by gem type</h3>
        ${table(['Gem type', 'Lots', 'Value'], byType.map((t) => [esc(t.gem_type), t.lots, money(t.value)]))}`;
    }
    if (type === 'sales') {
      const rows = d.orders.map((o) => [o.order_id, fmtDate(o.order_date), esc(o.customer_name), o.channel === 'Online' ? 'Online' : 'Walk-in', esc(o.status), money(o.total_amount)]);
      return `
        <div class="kpis">
          ${kpi('Total orders', d.orders.length)}
          ${kpi('Confirmed revenue', money(confirmedRevenue))}
          ${kpi('Customers', d.customers.length)}
        </div>
        <h3>All orders</h3>
        ${table(['#', 'Date', 'Customer', 'Channel', 'Status', 'Total'], rows, [0, 0, 0, 0, 0, 1])}`;
    }
    if (type === 'inventory') {
      const inStock = d.lots.filter((l) => String(l.status || '').indexOf('In Stock') === 0);
      const rows = inStock.map((l) => [esc(l.lot_code), esc(l.name), esc(l.gem_type), esc(l.status), money(l.sale_price)]);
      return `
        <div class="kpis">
          ${kpi('Lots in stock', dash.lotsInStock)}
          ${kpi('Stock value', money(dash.stockValue))}
          ${kpi('Finished, ready', dash.finishedInStock)}
        </div>
        <h3>Value by gem type</h3>
        ${table(['Gem type', 'Lots', 'Value'], byType.map((t) => [esc(t.gem_type), t.lots, money(t.value)]))}
        <h3>Lots by status</h3>
        ${table(['Status', 'Lots'], byStatus.map((s) => [esc(s.status), s.count]))}
        <h3>Stock on hand</h3>
        ${table(['Code', 'Name', 'Type', 'Status', 'Sale price'], rows, [0, 0, 0, 0, 1])}`;
    }
    // finance
    const rows = d.invoices.map((i) => {
      const bal = Number(i.amount || 0) - Number(i.paid || 0);
      return [`INV-${i.invoice_id}`, fmtDate(i.invoice_date), esc(i.customer_name), money(i.amount), money(i.paid), money(bal), esc(i.status)];
    });
    return `
      <div class="kpis">
        ${kpi('Total sales', money(invTotals.sales))}
        ${kpi('Total received', money(invTotals.received))}
        ${kpi('Outstanding (AR)', money(outstanding))}
      </div>
      <h3>Invoices &amp; receivables</h3>
      ${table(['Invoice', 'Date', 'Customer', 'Amount', 'Paid', 'Balance', 'Status'], rows, [0, 0, 0, 1, 1, 1, 0])}`;
  }

  function kpi(label, value) {
    return `<div class="kpi"><div class="l">${label}</div><div class="v">${value}</div></div>`;
  }
  function table(head, rows, rightCols) {
    rightCols = rightCols || [];
    const th = head.map((h, i) => `<th class="${rightCols[i] ? 'r' : ''}">${h}</th>`).join('');
    const body = rows.length
      ? rows.map((r) => '<tr>' + r.map((c, i) => `<td class="${rightCols[i] ? 'r' : ''}">${c}</td>`).join('') + '</tr>').join('')
      : `<tr><td colspan="${head.length}" style="color:#8a90a0">No records.</td></tr>`;
    return `<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function printReport() {
    const rep = REPORTS.find((r) => r.key === active);
    const w = window.open('', '_blank', 'width=880,height=1000');
    if (!w) { setError('Please allow pop-ups to print the report.'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(rep.title)} — Serendib Gems</title>
<style>
  *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1b2233;margin:0;padding:40px;font-size:13px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1E2D6E;padding-bottom:16px;margin-bottom:8px}
  .brand{font-family:Georgia,serif;font-size:24px;color:#1E2D6E;font-weight:700}
  .brand small{display:block;font-family:inherit;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#B08D3E;margin-top:4px;font-weight:600}
  .meta{text-align:right} .meta h1{margin:0;font-size:19px;color:#1E2D6E} .meta div{color:#6b7280;font-size:12px;margin-top:3px}
  h3{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin:22px 0 6px;border-bottom:1px solid #eceef3;padding-bottom:5px}
  table{width:100%;border-collapse:collapse;margin-top:2px}
  th{text-align:left;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #d5d8e0;padding:7px 6px}
  td{padding:7px 6px;border-bottom:1px solid #f0f1f5}
  td.r,th.r{text-align:right}
  .kpis{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 4px}
  .kpi{flex:1;min-width:130px;border:1px solid #e3e5ec;border-radius:10px;padding:11px 13px}
  .kpi .l{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8a90a0;font-weight:600}
  .kpi .v{font-size:20px;font-weight:700;color:#1E2D6E;margin-top:5px}
  .foot{margin-top:36px;color:#8a90a0;font-size:11px;text-align:center;border-top:1px solid #eceef3;padding-top:14px}
  @media print{body{padding:22px}}
</style></head><body>
  <div class="top">
    <div class="brand">Serendib Gems<small>Ceylon Fine Gemstones · ERP</small></div>
    <div class="meta"><h1>${esc(rep.title)}</h1><div>Generated: ${now}</div><div>Confidential — internal use</div></div>
  </div>
  ${buildBody(active)}
  <div class="foot">Serendib Gems ERP · ${esc(rep.title)} · Generated from live data on ${now}.</div>
</body></html>`);
    w.document.close(); w.focus(); w.print();
  }

  // ---------- on-screen preview ----------
  function Preview() {
    if (active === 'summary') return (
      <>
        <PreRow items={[['Lots in stock', dash.lotsInStock], ['Stock value', money(dash.stockValue)], ['Orders this month', dash.ordersThisMonth], ['Revenue this month', money(dash.revenueThisMonth)], ['Outstanding (AR)', money(outstanding)]]} />
        <PreTable title="Inventory by status" head={['Status', 'Lots']} rows={byStatus.map((s) => [s.status, s.count])} r={[0, 1]} />
        <PreTable title="Sales by channel" head={['Channel', 'Orders', 'Revenue']} rows={byChannel.map((c) => [c.channel === 'Online' ? 'Online shop' : 'Walk-in', c.orders, money(c.total)])} r={[0, 1, 1]} />
      </>
    );
    if (active === 'sales') return (
      <>
        <PreRow items={[['Total orders', d.orders.length], ['Confirmed revenue', money(confirmedRevenue)], ['Customers', d.customers.length]]} />
        <PreTable title="All orders" head={['#', 'Date', 'Customer', 'Channel', 'Status', 'Total']}
          rows={d.orders.map((o) => [o.order_id, fmtDate(o.order_date), o.customer_name, o.channel === 'Online' ? 'Online' : 'Walk-in', o.status, money(o.total_amount)])} r={[0, 0, 0, 0, 0, 1]} />
      </>
    );
    if (active === 'inventory') return (
      <>
        <PreRow items={[['Lots in stock', dash.lotsInStock], ['Stock value', money(dash.stockValue)], ['Finished, ready', dash.finishedInStock]]} />
        <PreTable title="Value by gem type" head={['Gem type', 'Lots', 'Value']} rows={byType.map((t) => [t.gem_type, t.lots, money(t.value)])} r={[0, 1, 1]} />
        <PreTable title="Lots by status" head={['Status', 'Lots']} rows={byStatus.map((s) => [s.status, s.count])} r={[0, 1]} />
      </>
    );
    return (
      <>
        <PreRow items={[['Total sales', money(invTotals.sales)], ['Total received', money(invTotals.received)], ['Outstanding (AR)', money(outstanding)]]} />
        <PreTable title="Invoices & receivables" head={['Invoice', 'Date', 'Customer', 'Amount', 'Paid', 'Balance', 'Status']}
          rows={d.invoices.map((i) => ['INV-' + i.invoice_id, fmtDate(i.invoice_date), i.customer_name, money(i.amount), money(i.paid), money(Number(i.amount || 0) - Number(i.paid || 0)), i.status])} r={[0, 0, 0, 1, 1, 1, 0]} />
      </>
    );
  }

  const activeRep = REPORTS.find((r) => r.key === active);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 26 }}>Reports</h2>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Generate business reports from live data · {now}</div>
        </div>
        <button className="btn btn-primary" onClick={printReport}><Printer width={15} height={15} /> Print / Save as PDF</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 20 }}>
        {REPORTS.map((r) => (
          <button key={r.key} onClick={() => setActive(r.key)}
            style={{ textAlign: 'left', cursor: 'pointer', background: active === r.key ? 'linear-gradient(180deg,rgba(30,45,110,.05),transparent)' : 'var(--surface)', border: '1px solid ' + (active === r.key ? 'var(--gold)' : 'var(--line)'), borderRadius: 14, padding: '15px 16px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>{r.tag}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--navy)', margin: '3px 0 4px' }}>{r.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{r.desc}</div>
          </button>
        ))}
      </div>

      <div className="card pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ fontSize: 20 }}>{activeRep.title}</h3>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Preview · print for the full formatted report</span>
        </div>
        <Preview />
      </div>
    </div>
  );
}

function PreRow({ items }) {
  return (
    <div className="stats" style={{ marginBottom: 8 }}>
      {items.map(([l, v]) => (
        <div className="card pad stat" key={l} style={{ boxShadow: 'none', border: '1px solid var(--line)' }}>
          <div className="k">{l}</div>
          <div className="v tab-num" style={{ fontSize: 22 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function PreTable({ title, head, rows, r }) {
  r = r || [];
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>{title}</h4>
      <div className="table-wrap">
        <table>
          <thead><tr>{head.map((h, i) => <th key={i} style={r[i] ? { textAlign: 'right' } : null}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={head.length}><div className="empty" style={{ padding: 20 }}>No records.</div></td></tr> :
              rows.map((row, ri) => (
                <tr key={ri}>{row.map((c, ci) => <td key={ci} className={r[ci] ? 'tab-num' : ''} style={r[ci] ? { textAlign: 'right' } : null}>{c}</td>)}</tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
