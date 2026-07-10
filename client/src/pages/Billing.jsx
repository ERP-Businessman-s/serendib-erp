import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Close, Printer } from '../icons.jsx';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();
const fmtDate = (d) => { if (!d) return '-'; const t = new Date(String(d).slice(0, 10)); return isNaN(t) ? String(d).slice(0, 10) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
function invBadge(s) {
  if (s === 'Paid') return 'badge finished';
  if (s === 'Partly Paid') return 'badge cutting';
  return 'badge reserved';
}

// Invoices are created when an order is confirmed. Here you see them, record
// payments, and read the revenue report.
export default function Billing() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [pay, setPay] = useState(null); // { invoice, amount, method }

  async function load() {
    try {
      setRows(await api.get('/invoices'));
      setSummary(await api.get('/invoices/report/summary'));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  // Opens a clean, printable invoice in a new window. Kept as plain HTML so it
  // does not depend on the admin styles and prints tidily.
  async function printInvoice(id) {
    setError('');
    try {
      const inv = await api.get('/invoices/' + id);
      const w = window.open('', '_blank', 'width=780,height=920');
      if (!w) { setError('Please allow pop-ups to print the invoice.'); return; }
      const rows = (inv.items || []).map((it) => {
        const desc = [it.gem_type, it.carat ? it.carat + ' ct' : null, it.origin].filter(Boolean).join(' · ');
        return `<tr><td>${esc(it.lot_code)}</td><td>${esc(it.lot_name)}<div class="muted">${esc(desc)}</div></td><td class="r">${money(it.price)}</td></tr>`;
      }).join('');
      const balance = Number(inv.amount) - Number(inv.paid);
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice INV-${inv.invoice_id}</title>
<style>
  *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1b2233;margin:0;padding:40px;font-size:14px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1E2D6E;padding-bottom:18px}
  .brand{font-family:Georgia,serif;font-size:26px;color:#1E2D6E;font-weight:700}
  .brand small{display:block;font-family:inherit;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08D3E;margin-top:4px;font-weight:600}
  .inv{text-align:right} .inv h1{margin:0;font-size:22px;color:#1E2D6E} .inv .muted{color:#6b7280}
  .parties{display:flex;justify-content:space-between;margin:26px 0}
  .parties h4{margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #d5d8e0;padding:8px 6px}
  td{padding:10px 6px;border-bottom:1px solid #eceef3;vertical-align:top}
  td.r,th.r{text-align:right}
  .muted{color:#8a90a0;font-size:12px;margin-top:2px}
  .totals{margin-top:16px;margin-left:auto;width:260px}
  .totals div{display:flex;justify-content:space-between;padding:6px 0}
  .totals .grand{border-top:2px solid #1E2D6E;margin-top:6px;padding-top:10px;font-weight:700;font-size:16px;color:#1E2D6E}
  .foot{margin-top:40px;color:#8a90a0;font-size:12px;text-align:center;border-top:1px solid #eceef3;padding-top:16px}
  @media print{body{padding:24px}}
</style></head><body>
  <div class="top">
    <div class="brand">Serendib Gems<small>Ceylon Fine Gemstones</small></div>
    <div class="inv"><h1>INVOICE</h1><div class="muted">INV-${inv.invoice_id}</div><div class="muted">Date: ${fmtDate(inv.invoice_date)}</div><div class="muted">Order #${inv.order_id} · ${esc(inv.channel === 'Online' ? 'Online shop' : 'Walk-in')}</div></div>
  </div>
  <div class="parties">
    <div><h4>Billed to</h4><div><strong>${esc(inv.customer_name)}</strong></div><div class="muted">${esc(inv.customer_email)}</div><div class="muted">${esc(inv.customer_phone)}</div><div class="muted">${esc(inv.customer_address)}</div></div>
    <div style="text-align:right"><h4>Status</h4><div><strong>${esc(inv.status)}</strong></div></div>
  </div>
  <table><thead><tr><th>Code</th><th>Gemstone</th><th class="r">Price</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div><span>Total</span><span>${money(inv.amount)}</span></div>
    <div><span>Paid</span><span>${money(inv.paid)}</span></div>
    <div class="grand"><span>Balance</span><span>${money(balance)}</span></div>
  </div>
  <div class="foot">Thank you for your business. Serendib Gems, Colombo, Sri Lanka.</div>
</body></html>`);
      w.document.close();
      w.focus();
      w.print();
    } catch (e) { setError(e.message); }
  }

  async function submitPayment(e) {
    e.preventDefault(); setError('');
    try {
      await api.post('/invoices/' + pay.invoice.invoice_id + '/payments', { amount: Number(pay.amount), method: pay.method });
      setPay(null); load();
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <div className="section-title"><h2>Billing</h2><span className="sub">Invoices and payments</span></div>
      {error && <div className="msg err">{error}</div>}

      {summary && (
        <div className="stats" style={{ marginBottom: 18 }}>
          <div className="card pad stat"><div className="k">Total sales</div><div className="v tab-num">{money(summary.total_sales)}</div></div>
          <div className="card pad stat"><div className="k">Total received</div><div className="v tab-num">{money(summary.total_received)}</div></div>
          <div className="card pad stat"><div className="k">Outstanding</div><div className="v tab-num">{money(summary.outstanding)}</div></div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Amount</th><th>Paid</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.invoice_id}>
                <td className="tab-num">INV-{r.invoice_id}</td>
                <td>{r.customer_name}</td>
                <td className="tab-num">{fmtDate(r.invoice_date)}</td>
                <td className="tab-num">{money(r.amount)}</td>
                <td className="tab-num">{money(r.paid)}</td>
                <td><span className={invBadge(r.status)}>{r.status}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="iconbtn" title="Print invoice" onClick={() => printInvoice(r.invoice_id)}><Printer width={15} height={15} /></button>
                  {r.status !== 'Paid' && <button className="btn btn-sm btn-primary" style={{ marginLeft: 6 }} onClick={() => setPay({ invoice: r, amount: Number(r.amount) - Number(r.paid), method: 'Cash' })}>Record payment</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}><div className="empty">No invoices yet. Confirm an order to create one.</div></td></tr>}
          </tbody>
        </table>
      </div>

      {pay && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setPay(null)}>
          <form className="modal" onSubmit={submitPayment} style={{ maxWidth: 420 }}>
            <div className="modal-head"><h3>Record payment</h3>
              <button type="button" className="iconbtn" onClick={() => setPay(null)}><Close width={16} height={16} /></button></div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Invoice INV-{pay.invoice.invoice_id} for {pay.invoice.customer_name}. Amount {money(pay.invoice.amount)}, already paid {money(pay.invoice.paid)}.</div>
              <div className="field"><label>Payment amount</label><input className="input" type="number" step="any" required value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></div>
              <div className="field"><label>Method</label>
                <select className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                  <option>Cash</option><option>Bank</option><option>Card</option>
                </select>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setPay(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save payment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
