import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { Reward, Redemption, RedemptionPeriod } from '../api/client';

type AdminTab = 'catalog' | 'redemptions';

export default function RewardsPage({ initialTab = 'catalog' }: { initialTab?: AdminTab }) {
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setTab(initialTab);
  }, [initialTab]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  const loadRewards = () => api.listRewards().then(r => setRewards(r.rewards));

  const loadRedemptions = () => {
    setLoadingRedemptions(true);
    api.listCompanyRedemptions().then(r => setRedemptions(r.redemptions)).finally(() => setLoadingRedemptions(false));
  };

  useEffect(() => { loadRewards(); }, []);

  useEffect(() => {
    if (tab === 'redemptions') loadRedemptions();
  }, [tab]);

  const pendingCount = redemptions.filter(r => r.status === 'pending').length;

  return (
    <div className="rewards-page">
      <div className="sub-tabs" style={{ marginBottom: 28 }}>
        <button className={`sub-tab-btn ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>
          🎁 Catálogo de recompensas
        </button>
        <button className={`sub-tab-btn ${tab === 'redemptions' ? 'active' : ''}`} onClick={() => setTab('redemptions')}>
          🎫 Gestión de canjes
          {pendingCount > 0 && <span className="badge-count">{pendingCount}</span>}
        </button>
      </div>

      {tab === 'catalog' && (
        <>
          <CreateRewardForm onCreated={loadRewards} />
          <div className="rewards-grid">
            {rewards.length === 0 && <p className="loading">No hay recompensas creadas todavía.</p>}
            {rewards.map(r => (
              <div key={r.id} className="reward-card">
                <div className="reward-title">{r.title}</div>
                {r.description && <div className="reward-desc">{r.description}</div>}
                <div className="reward-footer">
                  <span className="reward-cost">⭐ {r.points_cost} pts</span>
                  <span className="reward-stock">{r.stock} disponibles</span>
                </div>
                <div className="reward-limit">
                  {r.max_per_user === null
                    ? '∞ Sin límite por persona'
                    : `🔒 Máx. ${r.max_per_user}${r.redemption_period === 'monthly' ? '/mes' : r.redemption_period === 'yearly' ? '/año' : ''} por persona`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'redemptions' && (
        <RedemptionsPanel
          redemptions={redemptions}
          loading={loadingRedemptions}
          onValidated={loadRedemptions}
        />
      )}
    </div>
  );
}

// ── Panel de canjes (admin) ───────────────────────────────────────────────────
function RedemptionsPanel({ redemptions, loading, onValidated }: {
  redemptions: Redemption[];
  loading: boolean;
  onValidated: () => void;
}) {
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleValidate(id: string) {
    setError('');
    setValidating(id);
    try {
      await api.validateRedemption(id);
      onValidated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al validar');
    } finally {
      setValidating(null);
    }
  }

  if (loading) return <p className="loading">Cargando canjes...</p>;

  const pending = redemptions.filter(r => r.status === 'pending');
  const used    = redemptions.filter(r => r.status === 'used');

  return (
    <div>
      {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

      <div className="redemptions-admin-section">
        <h3>
          Pendientes de validar
          {pending.length > 0 && <span className="badge-count" style={{ marginLeft: 8 }}>{pending.length}</span>}
        </h3>
        {pending.length === 0 ? (
          <p className="loading" style={{ marginTop: 8 }}>No hay canjes pendientes.</p>
        ) : (
          <table className="employee-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Recompensa</th>
                <th>Código</th>
                <th>Puntos</th>
                <th>Solicitado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.user_name}</td>
                  <td>{r.reward_title}</td>
                  <td>
                    <span className="redemption-code-badge">{r.redemption_code}</span>
                  </td>
                  <td>⭐ {r.points_cost}</td>
                  <td>{new Date(r.claimed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</td>
                  <td>
                    <button
                      className="btn-validate"
                      onClick={() => handleValidate(r.id)}
                      disabled={validating === r.id}
                    >
                      {validating === r.id ? '...' : '✅ Validar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {used.length > 0 && (
        <div className="redemptions-admin-section" style={{ marginTop: 32 }}>
          <h3>Historial validados</h3>
          <table className="employee-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Recompensa</th>
                <th>Código</th>
                <th>Puntos</th>
                <th>Validado</th>
              </tr>
            </thead>
            <tbody>
              {used.map(r => (
                <tr key={r.id} style={{ opacity: 0.7 }}>
                  <td>{r.user_name}</td>
                  <td>{r.reward_title}</td>
                  <td><span className="redemption-code-badge used">{r.redemption_code}</span></td>
                  <td>⭐ {r.points_cost}</td>
                  <td>{r.validated_at ? new Date(r.validated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Crear recompensa ──────────────────────────────────────────────────────────
function CreateRewardForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points_cost, setPointsCost] = useState('');
  const [stock, setStock] = useState('');
  const [limitEnabled, setLimitEnabled] = useState(true);
  const [max_per_user, setMaxPerUser] = useState('1');
  const [redemption_period, setRedemptionPeriod] = useState<RedemptionPeriod>('none');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const limit = limitEnabled ? Number(max_per_user) || 1 : null;
      await api.createReward({
        title, description,
        points_cost: Number(points_cost),
        stock: Number(stock),
        max_per_user: limit,
        redemption_period: limitEnabled ? redemption_period : 'none',
      });
      setTitle(''); setDescription(''); setPointsCost(''); setStock('');
      setLimitEnabled(true); setMaxPerUser('1'); setRedemptionPeriod('none');
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-section" style={{ marginBottom: 28 }}>
      <h3>Crear nueva recompensa</h3>
      <form className="reward-form" onSubmit={handleSubmit}>
        <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} required />
        <input placeholder="Descripción (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="number" placeholder="Coste en puntos" min={1} value={points_cost} onChange={e => setPointsCost(e.target.value)} required />
        <input type="number" placeholder="Stock total" min={0} value={stock} onChange={e => setStock(e.target.value)} required />

        <div className="limit-row">
          <label className="limit-toggle">
            <input
              type="checkbox"
              checked={limitEnabled}
              onChange={e => setLimitEnabled(e.target.checked)}
            />
            Limitar canjes por persona
          </label>
          {limitEnabled && (
            <>
              <input
                type="number"
                className="limit-input"
                min={1}
                value={max_per_user}
                onChange={e => setMaxPerUser(e.target.value)}
                placeholder="1"
              />
              <select
                className="limit-period-select"
                value={redemption_period}
                onChange={e => setRedemptionPeriod(e.target.value as RedemptionPeriod)}
              >
                <option value="none">Total (sin período)</option>
                <option value="monthly">Por mes</option>
                <option value="yearly">Por año</option>
              </select>
            </>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creando...' : 'Crear recompensa'}</button>
      </form>
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}
