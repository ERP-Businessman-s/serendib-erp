import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import AppShell from './components/AppShell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Procurement from './pages/Procurement.jsx';
import Sales from './pages/Sales.jsx';
import HR from './pages/HR.jsx';
import Placeholder from './pages/Placeholder.jsx';

// Blocks the app if nobody is logged in.
function RequireAuth() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/cutting" element={<Placeholder title="Cutting & Workshop" note="Cutting jobs turn a rough lot into a finished lot. This module is built in Day 2 of the plan." />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/billing" element={<Placeholder title="Billing" note="Invoices and payments. This module is built in Day 3 of the plan." />} />
          <Route path="/hr" element={<HR />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
