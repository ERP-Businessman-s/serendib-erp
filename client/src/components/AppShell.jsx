import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Gem, Dash, Box, Truck, Chisel, Sale, Money, Users, Logout } from '../icons.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', Icon: Dash, end: true },
  { section: 'Modules' },
  { to: '/inventory', label: 'Inventory', Icon: Box },
  { to: '/procurement', label: 'Procurement', Icon: Truck },
  { to: '/cutting', label: 'Cutting & Workshop', Icon: Chisel },
  { to: '/sales', label: 'Sales', Icon: Sale },
  { to: '/billing', label: 'Billing', Icon: Money },
  { to: '/hr', label: 'HR & Staff', Icon: Users },
];

export default function AppShell() {
  const { user, signOut } = useAuth();

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
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
