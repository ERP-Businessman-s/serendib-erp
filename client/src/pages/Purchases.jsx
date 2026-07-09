import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Trash, Close } from '../icons.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();
const blankItem = () => ({ name: '', gem_type: '', carat: '', cost_price: '' });

// Recording a purchase creates rough lots in Inventory. That is the integration
// point: after you save here, the new stones show up on the Inventory page.
export default function Purchases() {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  async function load() {
    try {
      setRows(await api.get('/purchases'));
      setSuppliers(await api.get('/suppliers'));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setError('');
    setForm({ supplier_id: '', purchase_date: new Date().toISOString().slice(0, 10), items: [blankItem()] });
  }
  const setItem = (i, k) => (e) => setForm((f) => {
    const items = f.items.slice(); items[i] = { ...items[i], [k]: e.target.value }; return { ...f, items };
  });

  async function save(e) {
    e.preventDefault(); setError('');
    try {
      await api.post('/purchases', form);
      setForm(null); load();
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      {error && <div className="msg err">{error}</div>}
      <div className="toolbar">
        <span className="sub" style={{ color: 'var(--muted)' }}>Buying rough stones adds them to Inventory as rough lots.</span>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={openNew}><Plus width={16} height={16} /> New purchase</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Supplier</th><th>Date</th><th>Lots added</th><th>Total cost</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.purchase_id}>
                <td className="tab-num">{r.purchase_id}</td>
                <td>{r.supplier_name}</td>
                <td className="tab-num">{String(r.purchase_date).slice(0, 10)}</td>
                <td className="tab-num">{r.lot_count}</td>
                <td className="tab-num">{money(r.total_cost)}</td>
                <td><span className="badge finished">{r.status}</span></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6}><div className="empty">No purchases yet.</div></td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
          <form className="modal" onSubmit={save}>
            <div className="modal-head"><h3>New purchase</h3>
              <button type="button" className="iconbtn" onClick={() => setForm(null)}><Close width={16} height={16} /></button></div>
            <div className="modal-body">
              <div className="grid2">
                <div className="field">
                  <label>Supplier *</label>
                  <select className="input" required value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Purchase date</label>
                  <input className="input" type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
                </div>
              </div>

              <h4 style={{ marginTop: 20 }}>Rough stones bought</h4>
              {form.items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr 34px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                  <div className="field"><label>Name</label><input className="input" value={it.name} onChange={setItem(i, 'name')} placeholder="Rough sapphire" /></div>
                  <div className="field"><label>Type</label><input className="input" value={it.gem_type} onChange={setItem(i, 'gem_type')} /></div>
                  <div className="field"><label>Carat</label><input className="input" type="number" step="any" value={it.carat} onChange={setItem(i, 'carat')} /></div>
                  <div className="field"><label>Cost</label><input className="input" type="number" step="any" value={it.cost_price} onChange={setItem(i, 'cost_price')} /></div>
                  <button type="button" className="iconbtn" title="Remove"
                    onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, x) => x !== i) }))}><Trash width={15} height={15} /></button>
                </div>
              ))}
              <button type="button" className="btn btn-sm" onClick={() => setForm((f) => ({ ...f, items: [...f.items, blankItem()] }))}><Plus width={14} height={14} /> Add stone</button>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save purchase</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
