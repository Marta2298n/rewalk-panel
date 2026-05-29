import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { CompanySummary } from '../api/client';

const PLAN_PRICES: Record<string, number> = {
  trial:    0,
  basic:    29,
  premium:  79,
  total:    199,
  completo: 349,
};

const PLAN_COLORS: Record<string, string> = {
  trial:    '#b7791f',
  basic:    '#3182ce',
  premium:  '#6b46c1',
  total:    '#2d6a4f',
  completo: '#1a1a1a',
};

export default function BillingPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listCompanies().then(r => setCompanies(r.companies)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Cargando...</p>;

  const active = companies.filter(c => c.subscription_status === 'active');
  const mrr = active.reduce((s, c) => s + (PLAN_PRICES[c.plan] || 0), 0);
  const arr = mrr * 12;

  // Distribución por plan
  const byPlan = Object.keys(PLAN_PRICES).map(plan => ({
    plan,
    count: companies.filter(c => c.plan === plan).length,
    revenue: companies.filter(c => c.plan === plan && c.subscription_status === 'active').length * PLAN_PRICES[plan],
  })).filter(p => p.count > 0);

  const maxCount = Math.max(...byPlan.map(p => p.count), 1);

  return (
    <div>
      <h2>Facturación</h2>

      {/* KPIs */}
      <div className="metrics-grid" style={{ marginBottom: 32 }}>
        <div className="metric-card green">
          <div className="metric-icon">💶</div>
          <div className="metric-value">{mrr.toLocaleString()} €</div>
          <div className="metric-label">MRR (ingresos mensuales)</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-value">{arr.toLocaleString()} €</div>
          <div className="metric-label">ARR estimado</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🏢</div>
          <div className="metric-value">{active.length}</div>
          <div className="metric-label">Clientes activos de pago</div>
        </div>
        <div className="metric-card orange">
          <div className="metric-icon">🎯</div>
          <div className="metric-value">{mrr > 0 ? Math.round(mrr / active.length) : 0} €</div>
          <div className="metric-label">ARPU (ingreso medio/cliente)</div>
        </div>
      </div>

      {/* Distribución por plan */}
      <div className="billing-section">
        <h3>Distribución por plan</h3>
        <div className="plan-distribution">
          {byPlan.map(p => (
            <div key={p.plan} className="dist-row">
              <div className="dist-label">
                <span className="dist-dot" style={{ background: PLAN_COLORS[p.plan] }} />
                <span>{p.plan.charAt(0).toUpperCase() + p.plan.slice(1)}</span>
              </div>
              <div className="dist-bar-wrap">
                <div className="dist-bar">
                  <div className="dist-fill" style={{ width: `${(p.count / maxCount) * 100}%`, background: PLAN_COLORS[p.plan] }} />
                </div>
              </div>
              <div className="dist-count">{p.count} empresa{p.count !== 1 ? 's' : ''}</div>
              <div className="dist-revenue">{p.revenue > 0 ? `${p.revenue} €/mes` : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="billing-section" style={{ marginTop: 24 }}>
        <h3>Detalle por empresa</h3>
        <table className="employee-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Empleados</th>
              <th>Cuota mensual</th>
              <th>Alta</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{c.admin_email}</div>
                </td>
                <td>
                  <span style={{ color: PLAN_COLORS[c.plan], fontWeight: 700 }}>
                    {c.plan ? c.plan.charAt(0).toUpperCase() + c.plan.slice(1) : '—'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${c.subscription_status === 'active' ? 'active' : 'inactive'}`}>
                    {c.subscription_status}
                  </span>
                </td>
                <td>{c.employee_count}</td>
                <td style={{ fontWeight: 600 }}>
                  {c.subscription_status === 'active' && PLAN_PRICES[c.plan] > 0
                    ? `${PLAN_PRICES[c.plan]} €`
                    : c.plan === 'trial' ? 'Trial' : '—'}
                </td>
                <td>{new Date(c.created_at).toLocaleDateString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ fontWeight: 700, paddingTop: 12 }}>Total MRR</td>
              <td style={{ fontWeight: 800, color: '#2d6a4f', paddingTop: 12 }}>{mrr} €/mes</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
