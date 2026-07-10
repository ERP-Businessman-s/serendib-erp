import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Close } from '../icons.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();
const fmtDate = (d) => { if (!d) return '-'; const t = new Date(String(d).slice(0, 10)); return isNaN(t) ? String(d).slice(0, 10) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
function orderBadge(s) {
  if (s === 'Confirmed') return 'badge finished';
  if (s === 'Cancelled') return 'badge sold';
  return 'badge rough';
}

// Creating an order reserves the chosen finished lots. Confirming it marks them
// Sold and creates an invoice in Billing.
export default function Orders() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [finishedLots, setFinishedLots] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [channelFilter, setChannelFilter] = useState('');

  async function load() {
    try {
      setRows(await api.get('/orders'));
      setCustomers(await api.get('/customers'));
      setFinishedLots(await api.get('/lots?status=' + encodeURIComponent('In Stock (finished)')));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  function openNew() { setError(''); setForm({ customer_id: '', channel: 'WalkIn', lot_ids: [] }); }
  function toggleLot(id) {
    setForm((f) => ({ ...f, lot_ids: f.lot_ids.includes(id) ? f.lot_ids.filter((x) => x !== id) : [...f.lot_ids, id] }));
  }

  async function save(e) {
    e.preventDefault(); setError('');
    if (form.lot_ids.length === 0) { setError('Pick at least one lot'); return; }
    try { await api.post('/orders', form); setForm(null); load(); }
    catch (e) { setError(e.message); }
  }

  async function act(order, action) {
    try { await api.put('/orders/' + order.order_id + '/' + action); load(); }
    catch (e) { setError(e.message); }
  }

  const chosenTotal = form ? finishedLots.filter((l) => form.lot_ids.includes(l.lot_id)).reduce((s, l) => s + Number(l.sale_price || 0), 0) : 0;
  const shown = channelFilter ? rows.filter((r) => r.channel === channelFilter) : rows;
  const onlineWaiting = rows.filter((r) => r.channel === 'Online' && r.status === 'Draft').length;

  return (
    <div>
      <div className="section-title"><h2>Orders</h2><span className="sub">Sales orders and confirmations</span></div>
      {error && <div className="msg err">{error}</div>}
      {onlineWaiting > 0 && <div className="msg warn">{onlineWaiting} online order{onlineWaiting > 1 ? 's' : ''} from the shop waiting to be confirmed.</div>}
      <div className="toolbar">
        <select className="input" style={{ width: 'auto' }} value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
          <option value="">All channels</option>
          <option value="Online">Online shop</option>
          <option value="WalkIn">Walk-in</option>
        </select>
        <span className="sub" style={{ color: 'var(--muted)' }}>Selling a lot reserves it, then marks it sold on confirm.</span>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={openNew}><Plus width={16} height={16} /> New order</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Channel</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.order_id}>
                <td className="tab-num">{r.order_id}</td>
                <td>{r.customer_name}</td>
                <td className="tab-num">{fmtDate(r.order_date)}</td>
                <td className="tab-num">{r.item_count}</td>
                <td className="tab-num">{money(r.total_amount)}</td>
                <td>{r.channel === 'Online'
                  ? <span className="badge" style={{ background: 'rgba(176,141,62,.14)', color: 'var(--gold)', border: '1px solid rgba(176,141,62,.3)' }}>Online shop</span>
                  : <span style={{ color: 'var(--muted)' }}>Walk-in</span>}</td>
                <td><span className={orderBadge(r.status)}>{r.status}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {r.status === 'Draft' && <>
                    <button className="btn btn-sm btn-primary" onClick={() => act(r, 'confirm')}>Confirm</button>{' '}
                    <button className="btn btn-sm btn-danger" onClick={() => act(r, 'cancel')}>Cancel</button>
                  </>}
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={8}><div className="empty">No orders to show.</div></td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
          <form className="modal" onSubmit={save}>
            <div className="modal-head"><h3>New order</h3>
              <button type="button" className="iconbtn" onClick={() => setForm(null)}><Close width={16} height={16} /></button></div>
            <div className="modal-body">
              <div className="grid2">
                <div className="field">
                  <label>Customer *</label>
                  <select className="input" required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                    <option value="">Select customer</option>
                    {customers.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Channel</label>
                  <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                    <option value="WalkIn">Walk in</option>
                    <option value="Online">Online shop</option>
                  </select>
                </div>
              </div>

              <h4 style={{ marginTop: 18 }}>Pick finished lots</h4>
              <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
                {finishedLots.map((l) => (
                  <label key={l.lot_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid var(--line-soft)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.lot_ids.includes(l.lot_id)} onChange={() => toggleLot(l.lot_id)} />
                    <span style={{ flex: 1 }}><strong style={{ color: 'var(--ink)' }}>{l.lot_code}</strong> {l.name}</span>
                    <span className="tab-num" style={{ color: 'var(--muted)' }}>{money(l.sale_price)}</span>
                  </label>
                ))}
                {finishedLots.length === 0 && <div className="empty" style={{ padding: 20 }}>No finished lots in stock.</div>}
              </div>
              <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 600 }}>Total: <span className="tab-num">{money(chosenTotal)}</span></div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create order</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
