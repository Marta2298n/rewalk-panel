import { useEffect, useState } from 'react';
import { api } from '../api/client';

const PLAN_CONFIG: Record<string, {
  label: string; price: string; priceAnual: string;
  maxEmployees: number | null; color: string; features: string[]
}> = {
  trial:    {
    label: 'Trial', price: 'Gratis', priceAnual: 'Gratis',
    maxEmployees: null, color: '#b7791f',
    features: ['Hasta 10 días', 'Todas las funciones incluidas'],
  },
  basic:    {
    label: 'Equipo', price: '49 €/mes', priceAnual: '39 €/mes',
    maxEmployees: 25, color: '#3182ce',
    features: ['Hasta 25 empleados', 'App iOS y Android', 'GPS verificado', 'Panel de RRHH', 'Recompensas ilimitadas', 'Retos y tablón social', 'Soporte por email'],
  },
  premium:  {
    label: 'Pyme', price: '149 €/mes', priceAnual: '117 €/mes',
    maxEmployees: 75, color: '#6b46c1',
    features: ['Hasta 75 empleados', 'App iOS y Android', 'GPS verificado', 'Panel de RRHH', 'Recompensas ilimitadas', 'Retos y tablón social', 'Soporte prioritario'],
  },
  total:    {
    label: 'Empresa', price: '249 €/mes', priceAnual: '195 €/mes',
    maxEmployees: 125, color: '#E8472A',
    features: ['Hasta 125 empleados', 'App iOS y Android', 'GPS verificado', 'Panel de RRHH', 'Recompensas ilimitadas', 'Retos y tablón social', 'Soporte telefónico', 'API e integraciones', 'Gestor de cuenta dedicado'],
  },
  completo: {
    label: 'Completo', price: 'A medida', priceAnual: 'A medida',
    maxEmployees: null, color: '#1a1a1a',
    features: ['Empleados ilimitados', 'Todo incluido', 'SLA garantizado', 'Integración SSO', 'Gestor de cuenta dedicado'],
  },
};

interface PlanInfo {
  name: string;
  plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  employee_count: number;
}

function trialDaysLeft(trial_ends_at: string | null): number | null {
  if (!trial_ends_at) return null;
  return Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000));
}

export default function SubscriptionPage() {
  const [info, setInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/company/plan', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.json()).then(setInfo);
  }, []);

  if (!info) return <p className="loading">Cargando...</p>;

  const plan = PLAN_CONFIG[info.plan] || PLAN_CONFIG.trial;
  const daysLeft = trialDaysLeft(info.trial_ends_at);
  const usagePercent = plan.maxEmployees ? Math.min(100, (info.employee_count / plan.maxEmployees) * 100) : null;

  return (
    <div>
      <h2>Suscripción</h2>

      {/* Plan actual */}
      <div className="sub-current-card" style={{ borderTopColor: plan.color }}>
        <div className="sub-current-header">
          <div>
            <div className="sub-plan-name" style={{ color: plan.color }}>Plan {plan.label}</div>
            <div className="sub-plan-price">{plan.price}</div>
          </div>
          <span className={`sub-badge sub-${info.subscription_status}`}>
            {info.subscription_status}
          </span>
        </div>

        {/* Trial countdown */}
        {info.plan === 'trial' && daysLeft !== null && (
          <div className={`trial-badge ${daysLeft <= 3 ? 'trial-urgent' : ''}`} style={{ marginBottom: 16 }}>
            {daysLeft > 0
              ? `⏳ Tu periodo de prueba termina en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`
              : '⚠️ Tu periodo de prueba ha expirado. Actualiza tu plan para continuar.'}
          </div>
        )}

        {/* Uso de empleados */}
        <div className="usage-section">
          <div className="usage-label">
            <span>Empleados activos</span>
            <span>{info.employee_count}{plan.maxEmployees ? ` / ${plan.maxEmployees}` : ' / ∞'}</span>
          </div>
          {usagePercent !== null && (
            <div className="usage-bar">
              <div
                className="usage-fill"
                style={{
                  width: `${usagePercent}%`,
                  background: usagePercent >= 90 ? '#c0392b' : usagePercent >= 70 ? '#e07b39' : plan.color,
                }}
              />
            </div>
          )}
          {!plan.maxEmployees && (
            <div className="usage-bar">
              <div className="usage-fill" style={{ width: '100%', background: plan.color, opacity: 0.3 }} />
            </div>
          )}
        </div>
      </div>

      {/* Tabla de planes */}
      <h3 style={{ margin: '32px 0 16px' }}>Planes disponibles</h3>
      <div className="plans-grid">
        {Object.entries(PLAN_CONFIG).filter(([key]) => key !== 'trial').map(([key, p]) => {
          const planOrder = ['basic', 'premium', 'total', 'completo'];
          const currentIdx = planOrder.indexOf(info.plan);
          const thisIdx    = planOrder.indexOf(key);
          const isUpgrade  = info.plan === 'trial' || thisIdx > currentIdx;

          return (
            <div key={key} className={`plan-card ${info.plan === key ? 'plan-card-current' : ''}`} style={{ borderTopColor: p.color }}>
              {info.plan === key && <div className="plan-current-badge">Plan actual</div>}
              <div className="plan-card-name" style={{ color: p.color }}>{p.label}</div>
              <div className="plan-card-price">{p.price}</div>
              {p.priceAnual !== p.price && (
                <div className="plan-card-price-anual">o {p.priceAnual} facturado anualmente</div>
              )}
              <ul className="plan-features">
                {p.features.map(f => <li key={f}>✓ {f}</li>)}
              </ul>
              {info.plan !== key && (
                <a href="mailto:hola@rewalk.es" className="btn-plan-upgrade">
                  {isUpgrade ? '↑ Mejorar plan' : '↓ Cambiar plan'}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <p className="sub-contact-note">
        Para cambiar de plan contacta con nosotros en <strong>hola@rewalk.es</strong> o llámanos al <strong>+34 900 000 000</strong>
      </p>
    </div>
  );
}
