import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      login(res.token, res.role, res.subscription_status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="30 20 380 88" width="220">
            <text x="36" y="102" fontFamily="Arial Black, sans-serif" fontSize="76" fontWeight="900" fill="#111111" letterSpacing="-3">rew</text>
            <polygon points="182,102 232,28 282,102" fill="#E8472A"/>
            <line x1="196" y1="71" x2="268" y2="71" stroke="#ffffff" strokeWidth="8"/>
            <text x="286" y="102" fontFamily="Arial Black, sans-serif" fontSize="76" fontWeight="900" fill="#111111" letterSpacing="-3">lk</text>
          </svg>
        </div>
        <p className="login-subtitle" style={{ marginTop: 12 }}>Panel de Empresa</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@empresa.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary btn-login" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
