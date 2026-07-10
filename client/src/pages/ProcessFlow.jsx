import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Each stage is owned by one module. The label shows our module and the standard
// ERP category it maps to (SCM, CRM, Finance), which is what the modules teach.
const MOD = {
  Procurement: { label: 'Procurement · SCM', color: 'var(--gold)' },
  Inventory: { label: 'Inventory · SCM', color: 'var(--navy)' },
  Workshop: { label: 'Cutting · SCM', color: '#8a6bc4' },
  Sales: { label: 'Sales · CRM', color: '#2f9e70' },
  Billing: { label: 'Billing · Finance', color: '#b0722e' },
};

const len = (x) => (Array.isArray(x) ? x.length : 0);

function Stage({ title, note, count, mod }) {
  const m = MOD[mod];
  return (
    <div className="card" style={{ minWidth: 160, flex: '0 0 auto', padding: '14px 15px', borderTop: `3px solid ${m.color}` }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', margin: '5px 0 2px', lineHeight: 1.1 }}>{title}</div>
      {note && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{note}</div>}
      <div className="tab-num" style={{ marginTop: 8, fontSize: 24, fontFamily: 'var(--serif)', fontWeight: 600, lineHeight: 1 }}>{count}</div>
    </div>
  );
}

const Arrow = () => (
  <div style={{ flex: '0 0 auto', alignSelf: 'center', color: 'var(--muted)', fontSize: 22, padding: '0 1px' }}>&rarr;</div>
);

export default function ProcessFlow() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/orders'),
      api.get('/invoices'),
      api.get('/suppliers'),
      api.get('/customers'),
      api.get('/purchases'),
    ]).then(([dash, orders, invoices, suppliers, customers, purchases]) => {
      const st = {};
      (dash.lotsByStatus || []).forEach((r) => { st[r.status] = r.count; });
      const ords = Array.isArray(orders) ? orders : [];
      const invs = Array.isArray(invoices) ? invoices : [];
      setD({
        suppliers: len(suppliers),
        purchases: len(purchases),
        rough: st['In Stock (rough)'] || 0,
        inCutting: st['In Cutting'] || 0,
        finished: st['In Stock (finished)'] || 0,
        customers: len(customers),
        draftOrders: ords.filter((o) => o.status === 'Draft').length,
        reserved: st['Reserved'] || 0,
        confirmedOrders: ords.filter((o) => o.status === 'Confirmed').length,
        invoices: invs.length,
        paid: invs.filter((i) => i.status === 'Paid').length,
        sold: st['Sold'] || 0,
      });
    }).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="msg err">{error}</div>;
  if (!d) return <div className="empty">Loading process flows...</div>;

  return (
    <div>
      <div className="section-title"><h2>Business Process Flows</h2><span className="sub">How work moves across the modules</span></div>

      <div className="card pad" style={{ marginBottom: 20 }}>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13.5 }}>
          Serendib Gems runs two end-to-end ERP processes. Each stage below is handled by a different module, but they all read and write the <strong>same shared records</strong>, so a gem is tracked from the supplier all the way to the sale. Every number is live from the database.
        </p>
      </div>

      <h3 style={{ fontSize: 18, margin: '4px 0 2px' }}>Procure-to-Pay</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 12 }}>From buying rough stones to holding finished, certified gems in the vault.</p>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 26 }}>
        <Stage mod="Procurement" title="Suppliers" note="Trusted miners" count={d.suppliers} />
        <Arrow />
        <Stage mod="Procurement" title="Purchase" note="Buy rough parcel" count={d.purchases} />
        <Arrow />
        <Stage mod="Inventory" title="Rough in vault" note="Status: rough" count={d.rough} />
        <Arrow />
        <Stage mod="Workshop" title="Being cut" note="Status: in cutting" count={d.inCutting} />
        <Arrow />
        <Stage mod="Inventory" title="Finished stock" note="Ready to sell" count={d.finished} />
      </div>

      <h3 style={{ fontSize: 18, margin: '4px 0 2px' }}>Order-to-Cash</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 12 }}>From a customer order to a paid invoice and a sold gem.</p>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
        <Stage mod="Sales" title="Customers" note="Walk-in or online" count={d.customers} />
        <Arrow />
        <Stage mod="Sales" title="Order placed" note="Status: draft" count={d.draftOrders} />
        <Arrow />
        <Stage mod="Inventory" title="Lot reserved" note="Held for buyer" count={d.reserved} />
        <Arrow />
        <Stage mod="Sales" title="Order confirmed" note="Sale agreed" count={d.confirmedOrders} />
        <Arrow />
        <Stage mod="Billing" title="Invoice issued" note="All invoices" count={d.invoices} />
        <Arrow />
        <Stage mod="Billing" title="Payment received" note="Paid invoices" count={d.paid} />
        <Arrow />
        <Stage mod="Inventory" title="Lot sold" note="Status: sold" count={d.sold} />
      </div>

      <div className="card pad" style={{ marginTop: 22 }}>
        <div className="k" style={{ marginBottom: 8 }}>The shared thread that integrates both flows</div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>
          The link that ties everything together is the lot&rsquo;s <strong>status</strong> field:{' '}
          <span className="badge rough">In Stock (rough)</span> &rarr; <span className="badge cutting">In Cutting</span> &rarr;{' '}
          <span className="badge finished">In Stock (finished)</span> &rarr; <span className="badge reserved">Reserved</span> &rarr;{' '}
          <span className="badge sold">Sold</span>. Every module writes to this same field on the same record, which is how the whole ERP stays in step.
        </p>
      </div>
    </div>
  );
}
