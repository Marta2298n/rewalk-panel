import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Reward, ActivityRecord, Redemption, LeaderboardEntry, Challenge } from '../api/client';
import ChallengesPage from './ChallengesPage';

type Tab = 'home' | 'log' | 'history' | 'rewards' | 'challenges';

export default function EmployeePage() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <div>
      <nav className="employee-tabs">
        {([['home', '🏠 Inicio'], ['log', '➕ Registrar'], ['history', '📋 Historial'], ['rewards', '🎁 Recompensas'], ['challenges', '🏆 Retos']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="employee-content">
        {tab === 'home' && <HomeTab onGoHistory={() => setTab('history')} />}
        {tab === 'log' && <LogTab onLogged={() => setTab('history')} />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'rewards' && <RewardsTab />}
        {tab === 'challenges' && <ChallengesPage />}
      </div>
    </div>
  );
}

// ── Inicio ────────────────────────────────────────────────────────────────────
function HomeTab({ onGoHistory }: { onGoHistory: () => void }) {
  const [stats, setStats] = useState<{ total_km: string; total_calories: number; total_minutes: number; total_points: number; activity_count: number } | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    api.getMyMonthlyStats().then(setStats);
    api.getMyPoints().then(r => setPoints(r.points_balance));
    api.getLeaderboard().then(r => setLeaderboard(r.leaderboard));
    api.listRewards().then(r => setRewards(r.rewards));
    api.listChallenges().then(r => setChallenges(r.challenges));
  }, []);

  if (!stats) return <p className="loading">Cargando...</p>;

  // Próxima recompensa alcanzable
  const sortedRewards = [...rewards].filter(r => r.is_active && r.stock > 0).sort((a, b) => a.points_cost - b.points_cost);
  const affordable = sortedRewards.filter(r => (points ?? 0) >= r.points_cost);
  const nextReward = sortedRewards.find(r => (points ?? 0) < r.points_cost) ?? null;

  // Retos activos en los que participa
  const myActiveChallenges = challenges.filter(c => c.is_joined && c.status === 'open');

  // Posición en el ranking
  const myRank = leaderboard.findIndex(e => e.is_me) + 1;
  const topPoints = leaderboard[0] ? leaderboard[0].total_points : 0;

  return (
    <div>
      {/* ── Métricas del mes ── */}
      <h2>Tu actividad este mes</h2>
      <div className="metrics-grid" style={{ marginTop: 16 }}>
        <div className="metric-card" onClick={onGoHistory} style={{ cursor: 'pointer' }}>
          <div className="metric-icon">🏃</div>
          <div className="metric-value">{parseFloat(stats.total_km).toFixed(1)} km</div>
          <div className="metric-label">Distancia total</div>
        </div>
        <div className="metric-card green" onClick={onGoHistory} style={{ cursor: 'pointer' }}>
          <div className="metric-icon">⏱️</div>
          <div className="metric-value">{stats.total_minutes} min</div>
          <div className="metric-label">En movimiento</div>
        </div>
        <div className="metric-card orange" onClick={onGoHistory} style={{ cursor: 'pointer' }}>
          <div className="metric-icon">🔥</div>
          <div className="metric-value">{stats.total_calories.toLocaleString()}</div>
          <div className="metric-label">Calorías</div>
        </div>
        <div className="metric-card gold" onClick={onGoHistory} style={{ cursor: 'pointer' }}>
          <div className="metric-icon">⭐</div>
          <div className="metric-value">{points ?? '...'}</div>
          <div className="metric-label">Puntos disponibles</div>
        </div>
      </div>
      <p className="stats-hint">
        {stats.activity_count === 0
          ? 'Aún no has registrado actividades este mes. ¡Empieza hoy!'
          : `${stats.activity_count} actividad${stats.activity_count > 1 ? 'es' : ''} registrada${stats.activity_count > 1 ? 's' : ''} este mes`}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>

        {/* ── Ranking del mes ── */}
        {leaderboard.length > 0 && (
          <div className="home-panel">
            <div className="home-panel-header">
              <span className="home-panel-title">🏆 Ranking del mes</span>
              {myRank > 0 && <span className="home-panel-badge">#{myRank} tú</span>}
            </div>
            <div className="leaderboard-list">
              {leaderboard.slice(0, 5).map((entry, i) => {
                const barPct = topPoints > 0 ? Math.round((entry.total_points / topPoints) * 100) : 0;
                return (
                  <div key={entry.user_id} className={`leaderboard-row ${entry.is_me ? 'is-me' : ''}`}>
                    <span className="lb-rank">{i + 1}</span>
                    <span className="lb-name">{entry.is_me ? `${entry.name} (tú)` : entry.name}</span>
                    <div className="lb-bar-wrap">
                      <div className="lb-bar" style={{ width: `${barPct}%` }} />
                    </div>
                    <span className="lb-km">{entry.total_points} pts</span>
                  </div>
                );
              })}
            </div>
            {myRank > 5 && (
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 8, textAlign: 'center' }}>
                Estás en el puesto #{myRank} — ¡a por el top 5!
              </p>
            )}
          </div>
        )}

        {/* ── Próxima recompensa ── */}
        <div className="home-panel">
          <div className="home-panel-header">
            <span className="home-panel-title">🎁 Tus puntos</span>
            <span className="home-panel-badge">{points ?? 0} pts</span>
          </div>
          {affordable.length > 0 && (
            <div className="reward-unlocked">
              <span className="reward-unlocked-label">✅ Puedes canjear ahora</span>
              <div className="reward-unlocked-list">
                {affordable.slice(0, 2).map(r => (
                  <div key={r.id} className="reward-chip">{r.title} — {r.points_cost} pts</div>
                ))}
              </div>
            </div>
          )}
          {nextReward && (
            <div className="reward-next">
              <div className="reward-next-header">
                <span>Próxima: <strong>{nextReward.title}</strong></span>
                <span>{nextReward.points_cost} pts</span>
              </div>
              <div className="reward-progress-bar">
                <div
                  className="reward-progress-fill"
                  style={{ width: `${Math.min(100, Math.round(((points ?? 0) / nextReward.points_cost) * 100))}%` }}
                />
              </div>
              <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                Te faltan <strong>{nextReward.points_cost - (points ?? 0)} pts</strong> — {Math.round((nextReward.points_cost - (points ?? 0)) / 10)} km más
              </p>
            </div>
          )}
          {!nextReward && sortedRewards.length === 0 && (
            <p style={{ fontSize: 13, color: '#aaa' }}>Tu empresa aún no ha configurado recompensas.</p>
          )}
        </div>
      </div>

      {/* ── Retos activos ── */}
      {myActiveChallenges.length > 0 && (
        <div className="home-panel" style={{ marginTop: 24 }}>
          <div className="home-panel-header">
            <span className="home-panel-title">🏃 Tus retos activos</span>
            <span className="home-panel-badge">{myActiveChallenges.length} apuntado{myActiveChallenges.length > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {myActiveChallenges.slice(0, 3).map(c => (
              <div key={c.id} className="active-challenge-row">
                <span className={`challenge-type-dot ${c.type}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {c.date ? `📅 ${new Date(c.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · ` : ''}
                    👥 {c.participant_count} participantes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Registrar actividad ───────────────────────────────────────────────────────
function LogTab({ onLogged }: { onLogged: () => void }) {
  const [type, setType] = useState<'run' | 'cycle' | 'swim'>('run');
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [result, setResult] = useState<{ message: string; activity: ActivityRecord } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    const duration_seconds = (parseInt(hours) * 3600) + (parseInt(minutes) * 60);
    const now = new Date();
    const start = new Date(now.getTime() - duration_seconds * 1000);

    try {
      const res = await api.logActivity({
        activity_type: type,
        distance_km: parseFloat(distance),
        duration_seconds,
        start_time: start.toISOString(),
        end_time: now.toISOString(),
      });
      setResult(res);
      setDistance(''); setHours('0'); setMinutes('30');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  }

  const ACTIVITY_LABELS: Record<string, string> = {
    run:   '🏃 Correr',
    cycle: '🚴 Bicicleta',
    swim:  '🏊 Natación',
  };

  return (
    <div>
      <h2>Registrar actividad</h2>
      <p className="stats-hint" style={{ marginBottom: 24 }}>Simula el registro que haría la app móvil con GPS automático</p>

      <div className="log-form-card">
        <form onSubmit={handleSubmit} className="log-form">
          <div className="activity-type-selector">
            {(['run', 'cycle', 'swim'] as const).map(t => (
              <button key={t} type="button" className={`type-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                {ACTIVITY_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Distancia (km)</label>
              <input type="number" step="0.1" min="0.1" max="200" placeholder="Ej: 5.5"
                value={distance} onChange={e => setDistance(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Horas</label>
              <input type="number" min="0" max="24" value={hours} onChange={e => setHours(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Minutos</label>
              <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Guardar actividad'}
          </button>
        </form>

        {result && (
          <div className={`activity-result ${result.activity.is_validated ? 'valid' : 'invalid'}`}>
            <p className="result-msg">{result.activity.is_validated ? '✅ ¡Actividad registrada!' : '⚠️ Actividad pendiente de revisión'}</p>
            <div className="result-stats">
              <span>🔥 {result.activity.calories_burned} kcal</span>
              <span>⭐ +{result.activity.points_earned} pts</span>
            </div>
            {!result.activity.is_validated && (
              <p className="validation-warning">La velocidad media supera el límite permitido. La actividad queda pendiente de revisión.</p>
            )}
            <button className="btn-secondary" onClick={onLogged}>Ver historial →</button>
          </div>
        )}
        {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}

// ── Historial ─────────────────────────────────────────────────────────────────
function HistoryTab() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    api.getMyActivities().then(r => setActivities(r.activities));
  }, []);

  const ACTIVITY_LABELS: Record<string, string> = {
    run:   '🏃 Correr',
    cycle: '🚴 Bicicleta',
    swim:  '🏊 Natación',
  };

  if (activities.length === 0) return <p className="loading">No tienes actividades registradas todavía.</p>;

  return (
    <div>
      <h2>Historial de actividades</h2>
      <table className="employee-table" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Distancia</th>
            <th>Calorías</th>
            <th>Puntos</th>
          </tr>
        </thead>
        <tbody>
          {activities.map(a => (
            <tr key={a.id}>
              <td>{ACTIVITY_LABELS[a.activity_type] ?? a.activity_type}</td>
              <td>{new Date(a.start_time).toLocaleDateString('es-ES')}</td>
              <td>{parseFloat(a.distance_km).toFixed(2)} km</td>
              <td>{a.calories_burned} kcal</td>
              <td>⭐ {a.points_earned}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal de código de canje ──────────────────────────────────────────────────
function RedemptionCodeModal({ code, title, pointsLeft, onClose }: {
  code: string; title: string; pointsLeft: number; onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box redemption-modal" onClick={e => e.stopPropagation()}>
        <div className="redemption-success-icon">🎉</div>
        <h3>¡Recompensa canjeada!</h3>
        <p className="redemption-reward-name">{title}</p>
        <div className="redemption-code-display">
          <div className="redemption-code-label">Tu código de canje</div>
          <div className="redemption-code">{code}</div>
          <div className="redemption-code-hint">Muéstralo en recepción o a tu responsable para validarlo</div>
        </div>
        <div className="redemption-points-left">Te quedan <strong>{pointsLeft} pts</strong></div>
        <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

// ── Recompensas ───────────────────────────────────────────────────────────────
function RewardsTab() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState<number | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [activeCode, setActiveCode] = useState<{ code: string; title: string; pointsLeft: number } | null>(null);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState<'catalog' | 'history'>('catalog');

  const load = () => {
    api.listRewards().then(r => setRewards(r.rewards));
    api.getMyPoints().then(r => setPoints(r.points_balance));
    api.listMyRedemptions().then(r => setRedemptions(r.redemptions));
  };

  useEffect(() => { load(); }, []);

  async function handleRedeem(rewardId: string) {
    setError('');
    try {
      const res = await api.redeemReward(rewardId);
      setActiveCode({ code: res.redemption_code, title: res.reward_title, pointsLeft: res.points_remaining });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al canjear');
    }
  }

  return (
    <div>
      {activeCode && (
        <RedemptionCodeModal
          code={activeCode.code}
          title={activeCode.title}
          pointsLeft={activeCode.pointsLeft}
          onClose={() => { setActiveCode(null); setSubTab('history'); }}
        />
      )}

      {points !== null && (
        <div className="points-banner" style={{ marginBottom: 24 }}>
          <span className="points-icon">⭐</span>
          <span className="points-label">Tus puntos:</span>
          <span className="points-value">{points} pts</span>
          <span className="points-hint">10 pts por km · Solo actividades validadas</span>
        </div>
      )}

      <div className="sub-tabs" style={{ marginBottom: 24 }}>
        <button className={`sub-tab-btn ${subTab === 'catalog' ? 'active' : ''}`} onClick={() => setSubTab('catalog')}>
          🎁 Catálogo
        </button>
        <button className={`sub-tab-btn ${subTab === 'history' ? 'active' : ''}`} onClick={() => setSubTab('history')}>
          🎫 Mis canjes {redemptions.filter(r => r.status === 'pending').length > 0 && (
            <span className="badge-count">{redemptions.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {error && <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>}

      {subTab === 'catalog' && (
        <div className="rewards-grid">
          {rewards.length === 0 && <p className="loading">Tu empresa aún no ha añadido recompensas.</p>}
          {rewards.map(r => (
            <div key={r.id} className="reward-card">
              <div className="reward-title">{r.title}</div>
              {r.description && <div className="reward-desc">{r.description}</div>}
              <div className="reward-footer">
                <span className="reward-cost">⭐ {r.points_cost} pts</span>
                <span className="reward-stock">{r.stock} disponibles</span>
              </div>
              <button
                className="btn-redeem"
                onClick={() => handleRedeem(r.id)}
                disabled={points === null || points < r.points_cost || r.stock === 0}
              >
                {r.stock === 0 ? 'Sin stock' : points !== null && points < r.points_cost ? `Faltan ${r.points_cost - points} pts` : 'Canjear'}
              </button>
            </div>
          ))}
        </div>
      )}

      {subTab === 'history' && (
        <div>
          {redemptions.length === 0 ? (
            <p className="loading">Aún no has canjeado ninguna recompensa.</p>
          ) : (
            <div className="redemptions-list">
              {redemptions.map(r => (
                <div key={r.id} className={`redemption-row ${r.status}`}>
                  <div className="redemption-row-main">
                    <div className="redemption-row-title">{r.reward_title}</div>
                    <div className="redemption-row-date">
                      {new Date(r.claimed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="redemption-row-code">{r.redemption_code}</div>
                  <div className="redemption-row-meta">
                    <span className="redemption-cost">⭐ {r.points_cost} pts</span>
                    <span className={`redemption-status ${r.status}`}>
                      {r.status === 'pending' ? '⏳ Pendiente de validar' : '✅ Validado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
