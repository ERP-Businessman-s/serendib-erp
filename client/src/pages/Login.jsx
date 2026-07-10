import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Gem } from '../icons.jsx';

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@serendib.lk');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) { navigate('/', { replace: true }); return null; }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      signIn(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(1100px 460px at 50% -8%, rgba(46,63,143,.16), transparent), linear-gradient(180deg,#fbfaf6,#efece2)' }}>
      <div className="card pad" style={{ width: '100%', maxWidth: 400, boxShadow: '0 30px 80px -46px rgba(30,45,110,.55)' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <Gem width={38} height={38} style={{ color: 'var(--gold)' }} />
          <h1 style={{ fontSize: 30, marginTop: 10 }}>Serendib Gems</h1>
          <div style={{ fontSize: 10.5, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginTop: 4 }}>ERP System</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>Staff sign in to the back-office system</div>
        </div>

        {error && <div className="msg err">{error}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ justifyContent: 'center', padding: 12, marginTop: 4 }}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
