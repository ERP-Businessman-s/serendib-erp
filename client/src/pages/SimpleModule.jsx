import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Edit, Trash, Close } from '../icons.jsx';

// A reusable list + add/edit + delete page for a simple table.
// Props:
//   title, subtitle, endpoint (e.g. '/suppliers'), idKey (e.g. 'supplier_id')
//   columns: [{ key, label, format? }]
//   fields:  [{ key, label, type?, options? }]  (options makes it a select)
export default function SimpleModule({ title, subtitle, endpoint, idKey, columns, fields }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  const empty = () => Object.fromEntries(fields.map((f) => [f.key, '']));

  async function load() {
    setLoading(true); setError('');
    try { setRows(await api.get(endpoint)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [endpoint]);

  async function save(e) {
    e.preventDefault(); setError('');
    try {
      const body = { ...form };
      fields.forEach((f) => { if (f.type === 'number' && body[f.key] !== '') body[f.key] = Number(body[f.key]); });
      if (form[idKey]) await api.put(`${endpoint}/${form[idKey]}`, body);
      else await api.post(endpoint, body);
      setForm(null); load();
    } catch (e) { setError(e.message); }
  }

  async function remove(row) {
    if (!window.confirm('Delete this record?')) return;
    try { await api.del(`${endpoint}/${row[idKey]}`); load(); }
    catch (e) { setError(e.message); }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="section-title">
        <h2>{title}</h2>
        <span className="sub">{subtitle} · {rows.length} records</span>
      </div>

      {error && <div className="msg err">{error}</div>}

      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setForm(empty())}><Plus width={16} height={16} /> Add new</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[idKey]}>
                {columns.map((c) => <td key={c.key}>{c.format ? c.format(r[c.key], r) : (r[c.key] ?? '-')}</td>)}
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="iconbtn" title="Edit" onClick={() => setForm({ ...r })}><Edit width={15} height={15} /></button>
                    <button className="iconbtn" title="Delete" onClick={() => remove(r)}><Trash width={15} height={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={columns.length + 1}><div className="empty">No records yet. Add one to get started.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
          <form className="modal" onSubmit={save}>
            <div className="modal-head">
              <h3>{form[idKey] ? `Edit ${title}` : `Add ${title}`}</h3>
              <button type="button" className="iconbtn" onClick={() => setForm(null)}><Close width={16} height={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid2">
                {fields.map((f) => (
                  <div className="field" key={f.key}>
                    <label>{f.label}</label>
                    {f.options ? (
                      <select className="input" value={form[f.key] ?? ''} onChange={set(f.key)}>
                        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input className="input" type={f.type || 'text'} value={form[f.key] ?? ''} onChange={set(f.key)} step="any" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{form[idKey] ? 'Save changes' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
