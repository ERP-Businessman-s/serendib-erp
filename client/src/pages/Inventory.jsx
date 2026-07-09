import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Edit, Trash, Search, Close } from '../icons.jsx';

const STATUSES = ['In Stock (rough)', 'In Cutting', 'In Stock (finished)', 'Reserved', 'Sold'];

// maps a status to a badge colour class
function badgeClass(status) {
  if (status === 'In Cutting') return 'badge cutting';
  if (status === 'In Stock (finished)') return 'badge finished';
  if (status === 'Reserved') return 'badge reserved';
  if (status === 'Sold') return 'badge sold';
  return 'badge rough';
}

const EMPTY = {
  lot_code: '', name: '', gem_type: '', color: '', carat: '', cut: '', clarity: '',
  origin: '', treatment: '', cert_lab: '', cert_no: '', cost_price: '', sale_price: '',
  status: 'In Stock (rough)', is_finished: 0, image_url: '',
};

export default function Inventory() {
  const [lots, setLots] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', gem_type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null = modal closed

  async function load() {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (filters.search) qs.set('search', filters.search);
      if (filters.status) qs.set('status', filters.status);
      if (filters.gem_type) qs.set('gem_type', filters.gem_type);
      setLots(await api.get('/lots?' + qs.toString()));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters]);

  const gemTypes = [...new Set(lots.map((l) => l.gem_type).filter(Boolean))];

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form };
      // send numbers as numbers, empty as null
      ['carat', 'cost_price', 'sale_price', 'is_finished'].forEach((k) => {
        body[k] = body[k] === '' || body[k] === null ? null : Number(body[k]);
      });
      if (form.lot_id) await api.put('/lots/' + form.lot_id, body);
      else await api.post('/lots', body);
      setForm(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(lot) {
    if (!window.confirm(`Delete ${lot.lot_code} (${lot.name})?`)) return;
    try { await api.del('/lots/' + lot.lot_id); load(); }
    catch (e) { setError(e.message); }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="section-title">
        <h2>Inventory</h2>
        <span className="sub">{lots.length} lots</span>
      </div>

      {error && <div className="msg err">{error}</div>}

      <div className="toolbar">
        <div style={{ position: 'relative' }}>
          <Search width={15} height={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
          <input className="input" style={{ paddingLeft: 32, width: 220 }} placeholder="Search name or code"
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={filters.gem_type} onChange={(e) => setFilters({ ...filters, gem_type: e.target.value })}>
          <option value="">All types</option>
          {gemTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setForm({ ...EMPTY })}><Plus width={16} height={16} /> Add lot</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Code</th><th>Name</th><th>Type</th><th>Carat</th><th>Origin</th><th>Status</th><th>Sale price</th><th></th></tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.lot_id}>
                <td className="tab-num" style={{ fontWeight: 600, color: 'var(--ink)' }}>{l.lot_code}</td>
                <td>{l.name}</td>
                <td>{l.gem_type}</td>
                <td className="tab-num">{l.carat ?? '-'}</td>
                <td>{l.origin}</td>
                <td><span className={badgeClass(l.status)}>{l.status}</span></td>
                <td className="tab-num">{l.sale_price ? 'Rs ' + Number(l.sale_price).toLocaleString() : '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="iconbtn" title="Edit" onClick={() => setForm({ ...l })}><Edit width={15} height={15} /></button>
                    <button className="iconbtn" title="Delete" onClick={() => remove(l)}><Trash width={15} height={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && lots.length === 0 && (
              <tr><td colSpan={8}><div className="empty">No lots found. Add one to get started.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
          <form className="modal" onSubmit={save}>
            <div className="modal-head">
              <h3>{form.lot_id ? 'Edit lot' : 'Add lot'}</h3>
              <button type="button" className="iconbtn" onClick={() => setForm(null)}><Close width={16} height={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid2">
                <Field label="Lot code" v={form.lot_code} on={set('lot_code')} req />
                <Field label="Name" v={form.name} on={set('name')} req />
                <Field label="Gem type" v={form.gem_type} on={set('gem_type')} />
                <Field label="Colour" v={form.color} on={set('color')} />
                <Field label="Carat" v={form.carat} on={set('carat')} type="number" />
                <Field label="Cut" v={form.cut} on={set('cut')} />
                <Field label="Clarity" v={form.clarity} on={set('clarity')} />
                <Field label="Origin" v={form.origin} on={set('origin')} />
                <Field label="Treatment" v={form.treatment} on={set('treatment')} />
                <Field label="Cert lab" v={form.cert_lab} on={set('cert_lab')} />
                <Field label="Cert number" v={form.cert_no} on={set('cert_no')} />
                <Field label="Cost price" v={form.cost_price} on={set('cost_price')} type="number" />
                <Field label="Sale price" v={form.sale_price} on={set('sale_price')} type="number" />
                <div className="field">
                  <label>Status</label>
                  <select className="input" value={form.status} onChange={set('status')}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Finished?</label>
                  <select className="input" value={form.is_finished} onChange={set('is_finished')}>
                    <option value={0}>Rough (0)</option>
                    <option value={1}>Finished (1)</option>
                  </select>
                </div>
                <Field label="Image URL" v={form.image_url} on={set('image_url')} />
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{form.lot_id ? 'Save changes' : 'Add lot'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, v, on, type = 'text', req }) {
  return (
    <div className="field">
      <label>{label}{req ? ' *' : ''}</label>
      <input className="input" type={type} value={v ?? ''} onChange={on} required={req} step="any" />
    </div>
  );
}
