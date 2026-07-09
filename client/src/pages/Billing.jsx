import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Close } from '../icons.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();
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
                <td className="tab-num">{String(r.invoice_date).slice(0, 10)}</td>
                <td className="tab-num">{money(r.amount)}</td>
                <td className="tab-num">{money(r.paid)}</td>
                <td><span className={invBadge(r.status)}>{r.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {r.status !== 'Paid' && <button className="btn btn-sm btn-primary" onClick={() => setPay({ invoice: r, amount: Number(r.amount) - Number(r.paid), method: 'Cash' })}>Record payment</button>}
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
