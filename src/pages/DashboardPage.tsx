import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Redemption, Challenge, LeaderboardEntry } from '../api/client';

type AdminTab = 'dashboard' | 'employees' | 'rewards' | 'challenges' | 'subscription';

interface Metrics {
  total_employees: number;
  active_this_month: number;
  total_km: string;
  total_calories_burned: number;
  total_minutes: number;
  period: string;
}

export default function DashboardPage({ onNavigate }: { onNavigate: (tab: AdminTab, subTab?: 'catalog' | 'redemptions') => void }) {
  const [metrics, setMetrics]         = useState<Metrics | null>(null);
  const [top5, setTop5]               = useState<LeaderboardEntry[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [challenges, setChallenges]   = useState<Challenge[]>([]);
  const [error, setError]             = useState('');

  useEffect(() => {
    api.getDashboardMetrics()
      .then(setMetrics)
      .catch(() => setError('No se pudieron cargar las métricas'));

    api.getLeaderboard()
      .then(r => setTop5(r.leaderboard.slice(0, 5)))
      .catch(() => {});

    api.listCompanyRedemptions()
      .then(r => setRedemptions(r.redemptions))
      .catch(() => {});

    api.listChallenges()
      .then(r => setChallenges(r.challenges))
      .catch(() => {});
  }, []);

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending');
  const activeChallenges   = challenges.filter(c => c.status === 'open');

  return (
    <div>
      <h2>
        Resumen del mes{' '}
        {metrics?.period && <span className="period-badge">{metrics.period}</span>}
      </h2>

      {error && <p className="error-msg">{error}</p>}
      {!metrics && !error && <p className="loading">Cargando métricas...</p>}

      {/* ── Métricas principales ── */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">🏃</div>
            <div className="metric-value">
              {metrics.active_this_month}
              <span style={{ fontSize: 16, fontWeight: 500, color: '#999' }}> / {metrics.total_employees}</span>
            </div>
            <div className="metric-label">Han registrado actividad</div>
          </div>
          <div className="metric-card blue">
            <div className="metric-icon">📍</div>
            <div className="metric-value">{parseFloat(metrics.total_km).toLocaleString('es-ES', { maximumFractionDigits: 1 })} km</div>
            <div className="metric-label">Km totales</div>
          </div>
          <div className="metric-card green">
            <div className="metric-icon">⏱️</div>
            <div className="metric-value">{metrics.total_minutes.toLocaleString()} min</div>
            <div className="metric-label">Minutos en movimiento</div>
          </div>
          <div className="metric-card orange">
            <div className="metric-icon">🔥</div>
            <div className="metric-value">{metrics.total_calories_burned.toLocaleString()}</div>
            <div className="metric-label">Calorías quemadas</div>
          </div>
        </div>
      )}

      {/* ── Fila inferior: 3 bloques ── */}
      <div className="dashboard-bottom-grid">

        {/* Top 5 del mes */}
        <div className="dashboard-block">
          <h3 className="dashboard-block-title">🏆 Top 5 del mes</h3>
          {top5.length === 0 ? (
            <p className="loading" style={{ fontSize: 13 }}>Sin actividad registrada este mes.</p>
          ) : (
            <ol className="top5-list">
              {top5.map((entry, i) => (
                <li key={entry.user_id} className="top5-item">
                  <span className={`top5-rank rank-${i + 1}`}>{i + 1}</span>
                  <span className="top5-name">{entry.name}</span>
                  <span className="top5-stats">
                    ⭐ {entry.total_points.toLocaleString()}
                    <span className="top5-km"> · {parseFloat(entry.total_km).toFixed(1)} km</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Canjes pendientes */}
        <div
          className="dashboard-block dashboard-block-clickable"
          onClick={() => onNavigate('rewards', 'redemptions')}
          title="Ir a Recompensas → Gestión de canjes"
        >
          <h3 className="dashboard-block-title">
            🎫 Canjes pendientes
            {pendingRedemptions.length > 0 && (
              <span className="badge-count" style={{ marginLeft: 8 }}>{pendingRedemptions.length}</span>
            )}
            <span className="dashboard-block-arrow">→</span>
          </h3>
          {pendingRedemptions.length === 0 ? (
            <p className="loading" style={{ fontSize: 13 }}>No hay canjes pendientes de validar.</p>
          ) : (
            <>
              <ul className="pending-redemptions-list">
                {pendingRedemptions.slice(0, 4).map(r => (
                  <li key={r.id} className="pending-redemption-item">
                    <div className="pending-redemption-name">{r.user_name}</div>
                    <div className="pending-redemption-reward">{r.reward_title}</div>
                    <span className="redemption-code-badge" style={{ fontSize: 11 }}>{r.redemption_code}</span>
                  </li>
                ))}
              </ul>
              {pendingRedemptions.length > 4 && (
                <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  +{pendingRedemptions.length - 4} más →
                </p>
              )}
            </>
          )}
        </div>

        {/* Retos activos */}
        <div
          className="dashboard-block dashboard-block-clickable"
          onClick={() => onNavigate('challenges')}
          title="Ir a Retos"
        >
          <h3 className="dashboard-block-title">
            🏁 Retos activos
            <span className="dashboard-block-arrow">→</span>
          </h3>
          {activeChallenges.length === 0 ? (
            <p className="loading" style={{ fontSize: 13 }}>No hay retos abiertos ahora mismo.</p>
          ) : (
            <ul className="active-challenges-list">
              {activeChallenges.slice(0, 4).map(c => (
                <li key={c.id} className="active-challenge-item">
                  <div className="active-challenge-title">{c.title}</div>
                  <div className="active-challenge-meta">
                    <span>👤 {c.participant_count} participante{c.participant_count !== 1 ? 's' : ''}</span>
                    {c.date && (
                      <span> · 📅 {new Date(c.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    )}
                  </div>
                </li>
              ))}
              {activeChallenges.length > 4 && (
                <li style={{ fontSize: 12, color: '#999', listStyle: 'none', marginTop: 4 }}>
                  +{activeChallenges.length - 4} más →
                </li>
              )}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
