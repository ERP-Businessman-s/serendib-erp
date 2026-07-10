import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Gem, Dash, Box, Truck, Chisel, Sale, Money, Users, Logout, Flow, Report } from '../icons.jsx';

// `erp` is the standard ERP module category each screen maps to (Lesson 11:
// SCM, CRM, Finance, HCM, BI). Shown as a small tag in the sidebar.
const NAV = [
  { to: '/', label: 'Dashboard', Icon: Dash, end: true, erp: 'BI' },
  { to: '/process', label: 'Process Flow', Icon: Flow, erp: 'BPM' },
  { to: '/reports', label: 'Reports', Icon: Report, erp: 'BI' },
  { section: 'Modules' },
  { to: '/inventory', label: 'Inventory', Icon: Box, erp: 'SCM' },
  { to: '/procurement', label: 'Procurement', Icon: Truck, erp: 'SCM' },
  { to: '/cutting', label: 'Cutting & Workshop', Icon: Chisel, erp: 'SCM' },
  { to: '/sales', label: 'Sales', Icon: Sale, erp: 'CRM' },
  { to: '/billing', label: 'Billing', Icon: Money, erp: 'Finance' },
  { to: '/hr', label: 'HR & Staff', Icon: Users, erp: 'HCM' },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const active = NAV.find((n) => n.to && n.to !== '/' && loc.pathname.startsWith(n.to)) || NAV[0];
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <Gem width={26} height={26} style={{ color: 'var(--gold)' }} />
          <div>
            <div className="bname">Serendib Gems</div>
            <div className="bsub">ERP System</div>
          </div>
        </div>

        {NAV.map((item, i) =>
          item.section ? (
            <div className="nav-sec" key={i}>{item.section}</div>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => 'navlink' + (isActive ? ' active' : '')}>
              <span className="dot" />
              <item.Icon width={17} height={17} />
              <span>{item.label}</span>
              {item.erp && <span className="erp-tag">{item.erp}</span>}
            </NavLink>
          )
        )}

        <div className="side-foot">
          <div style={{ fontSize: 12, color: 'var(--muted)', padding: '0 8px' }}>
            Signed in as<br /><strong style={{ color: 'var(--ink)' }}>{user?.name}</strong>
          </div>
          <button className="btn btn-sm" onClick={signOut}><Logout width={15} height={15} /> Log out</button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="crumb"><span className="crumb-root">Serendib Gems</span><span className="crumb-sep">/</span><span>{active.label}</span></div>
          <div className="who"><span className="tab-num">{today}</span><span className="crumb-sep">·</span>Signed in as <strong style={{ color: 'var(--ink)' }}>{user?.name}</strong></div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
