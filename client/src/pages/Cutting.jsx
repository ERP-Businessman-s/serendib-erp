import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Close, Chisel } from '../icons.jsx';

const fmtDate = (d) => { if (!d) return '-'; const t = new Date(String(d).slice(0, 10)); return isNaN(t) ? String(d).slice(0, 10) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };

function jobBadge(s) {
  if (s === 'Done') return 'badge finished';
  if (s === 'In Progress') return 'badge cutting';
  return 'badge rough';
}

// A cutting job turns a rough lot into a finished lot. Starting a job sets the
// lot to "In Cutting", finishing it sets the lot to "In Stock (finished)".
export default function Cutting() {
  const [jobs, setJobs] = useState([]);
  const [roughLots, setRoughLots] = useState([]);
  const [cutters, setCutters] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    try {
      setJobs(await api.get('/cutting'));
      setRoughLots(await api.get('/lots?status=' + encodeURIComponent('In Stock (rough)')));
      const emps = await api.get('/employees');
      setCutters(emps.filter((e) => e.is_cutter));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault(); setError('');
    try { await api.post('/cutting', form); setForm(null); load(); }
    catch (e) { setError(e.message); }
  }

  async function complete(job) {
    const price = window.prompt('Finished sale price for ' + job.lot_code + ' (leave blank to keep current):', '');
    if (price === null) return;
    try { await api.put('/cutting/' + job.job_id + '/complete', { sale_price: price === '' ? null : Number(price) }); load(); }
    catch (e) { setError(e.message); }
  }

  const shown = statusFilter ? jobs.filter((j) => j.status === statusFilter) : jobs;

  // count of jobs still open (not Done) per cutter, for the workload strip
  const workload = {};
  jobs.forEach((j) => { if (j.status !== 'Done' && j.cutter_name) workload[j.cutter_name] = (workload[j.cutter_name] || 0) + 1; });
  const workloadList = Object.entries(workload).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="section-title"><h2>Cutting & Workshop</h2><span className="sub">{jobs.length} jobs</span></div>
      {error && <div className="msg err">{error}</div>}

      {workloadList.length > 0 && (
        <div className="card pad" style={{ marginBottom: 14 }}>
          <div className="k" style={{ marginBottom: 8 }}>Cutter workload (open jobs)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {workloadList.map(([name, n]) => (
              <span key={name} className="badge cutting">{name}: {n}</span>
            ))}
          </div>
        </div>
      )}

      <div className="toolbar">
        <select className="input" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All jobs</option>
          <option value="In Progress">In progress</option>
          <option value="Done">Done</option>
        </select>
        <span className="sub" style={{ color: 'var(--muted)' }}>Turn a rough lot into a finished lot.</span>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => { setError(''); setForm({ lot_id: '', cutter_id: '', notes: '' }); }}><Plus width={16} height={16} /> New cutting job</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Lot</th><th>Cutter</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map((j) => (
              <tr key={j.job_id}>
                <td className="tab-num">{j.job_id}</td>
                <td><strong style={{ color: 'var(--ink)' }}>{j.lot_code}</strong> {j.lot_name}</td>
                <td>{j.cutter_name || '-'}</td>
                <td className="tab-num">{fmtDate(j.start_date)}</td>
                <td className="tab-num">{fmtDate(j.end_date)}</td>
                <td><span className={jobBadge(j.status)}>{j.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {j.status !== 'Done' && <button className="btn btn-sm" onClick={() => complete(j)}>Mark finished</button>}
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7}><div className="empty">No cutting jobs to show.</div></td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
          <form className="modal" onSubmit={save} style={{ maxWidth: 480 }}>
            <div className="modal-head"><h3>New cutting job</h3>
              <button type="button" className="iconbtn" onClick={() => setForm(null)}><Close width={16} height={16} /></button></div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>Rough lot *</label>
                <select className="input" required value={form.lot_id} onChange={(e) => setForm({ ...form, lot_id: e.target.value })}>
                  <option value="">Select a rough lot</option>
                  {roughLots.map((l) => <option key={l.lot_id} value={l.lot_id}>{l.lot_code} - {l.name}</option>)}
                </select>
                {roughLots.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>No rough lots in stock. Add a purchase first.</span>}
              </div>
              <div className="field">
                <label>Cutter</label>
                <select className="input" value={form.cutter_id} onChange={(e) => setForm({ ...form, cutter_id: e.target.value })}>
                  <option value="">Select a cutter</option>
                  {cutters.map((c) => <option key={c.employee_id} value={c.employee_id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Notes</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Start job</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
