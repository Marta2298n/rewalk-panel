import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { CompanySummary } from '../api/client';

const PLAN_PRICES: Record<string, number> = {
  trial: 0, equipo: 39, pyme: 117, empresa: 195,
};

const PLAN_COLORS: Record<string, string> = {
  trial: '#b7791f', equipo: '#3182ce', pyme: '#6b46c1', empresa: '#1a1a1a',
};

const STATUS_LABELS: Record<string, string> = {
  trial: '🟡 Trial', active: '🟢 Activa', suspended: '🔴 Suspendida', cancelled: '⚫ Cancelada',
};

const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial', equipo: 'Equipo (25 emp)', pyme: 'Pyme (75 emp)', empresa: 'Empresa (125 emp)',
};

const ALL_PLANS = ['trial', 'equipo', 'pyme', 'empresa'];

const STATUS_ACTIONS: Record<string, { label: string; value: string; variant: string }[]> = {
  trial:     [{ label: 'Activar', value: 'active', variant: 'action-green' }, { label: 'Suspender', value: 'suspended', variant: 'action-red' }],
  active:    [{ label: 'Suspender', value: 'suspended', variant: 'action-red' }, { label: 'Cancelar', value: 'cancelled', variant: 'action-grey' }],
  suspended: [{ label: 'Reactivar', value: 'active', variant: 'action-green' }, { label: 'Cancelar', value: 'cancelled', variant: 'action-grey' }],
  cancelled: [{ label: 'Reactivar', value: 'active', variant: 'action-green' }],
};

function trialDaysLeft(trial_ends_at: string | null): number | null {
  if (!trial_ends_at) return null;
  return Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000));
}

export default function SuperadminPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.listCompanies().then(r => setCompanies(r.companies)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const active    = companies.filter(c => c.subscription_status === 'active').length;
  const trials    = companies.filter(c => c.subscription_status === 'trial').length;
  const suspended = companies.filter(c => c.subscription_status === 'suspended' || c.subscription_status === 'cancelled').length;
  const urgentTrials = companies.filter(c => {
    const d = trialDaysLeft(c.trial_ends_at);
    return c.subscription_status === 'trial' && d !== null && d <= 3;
  }).length;

  return (
    <div>
      {/* KPIs de negocio */}
      <div className="metrics-grid" style={{ marginBottom: 32 }}>
        <div className="metric-card">
          <div className="metric-icon">🏢</div>
          <div className="metric-value">{companies.length}</div>
          <div className="metric-label">Empresas cliente</div>
        </div>
        <div className="metric-card green">
          <div className="metric-icon">✅</div>
          <div className="metric-value">{active}</div>
          <div className="metric-label">Suscripciones activas</div>
        </div>
        <div className="metric-card orange">
          <div className="metric-icon">⏳</div>
          <div className="metric-value">
            {trials}
            {urgentTrials > 0 && (
              <span style={{ fontSize: 14, fontWeight: 600, color: '#c0392b', marginLeft: 6 }}>
                ({urgentTrials} expiran pronto)
              </span>
            )}
          </div>
          <div className="metric-label">En periodo de prueba</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⛔</div>
          <div className="metric-value">{suspended}</div>
          <div className="metric-label">Suspendidas / canceladas</div>
        </div>
      </div>

      <div className="superadmin-header">
        <h2>Empresas cliente</h2>
        <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Nueva empresa'}
        </button>
      </div>

      {showForm && <CreateCompanyForm onCreated={() => { setShowForm(false); load(); }} />}
      {loading && <p className="loading">Cargando...</p>}
      {!loading && companies.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>🏢</div>
          <p>Aún no hay empresas cliente. Crea la primera pulsando "Nueva empresa".</p>
        </div>
      )}

      <div className="companies-grid">
        {companies.map(c => <CompanyCard key={c.id} company={c} onUpdated={load} />)}
      </div>
    </div>
  );
}

// ── Tarjeta de empresa ────────────────────────────────────────────────────────
function CompanyCard({ company: c, onUpdated }: { company: CompanySummary; onUpdated: () => void }) {
  const [saving, setSaving] = useState(false);
  const daysLeft = trialDaysLeft(c.trial_ends_at);
  const price = PLAN_PRICES[c.plan] || 0;
  const isSuspended = c.subscription_status === 'suspended';
  const isCancelled  = c.subscription_status === 'cancelled';
  const actions = STATUS_ACTIONS[c.subscription_status] || [];

  async function handleStatus(status: string) {
    setSaving(true);
    try { await api.updateSubscription(c.id, status); onUpdated(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  }

  async function handlePlan(plan: string) {
    setSaving(true);
    try { await api.updatePlan(c.id, plan); onUpdated(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error'); }
    finally { setSaving(false); }
  }

  return (
    <div className={`company-card ${isSuspended ? 'card-suspended' : ''} ${isCancelled ? 'card-cancelled' : ''}`}>
      {/* Cabecera: nombre + estado */}
      <div className="company-card-header">
        <div>
          <div className="company-name">{c.name}</div>
          <div className="company-taxid">{c.tax_id}</div>
        </div>
        <span className={`sub-badge sub-${c.subscription_status}`}>
          {STATUS_LABELS[c.subscription_status] || c.subscription_status}
        </span>
      </div>

      {/* Plan + cuota */}
      <div className="plan-row">
        <span className="plan-label">Plan:</span>
        <select
          className="plan-select"
          value={c.plan || 'trial'}
          onChange={e => handlePlan(e.target.value)}
          disabled={saving}
        >
          {ALL_PLANS.map(p => (
            <option key={p} value={p}>
              {PLAN_LABELS[p]}{PLAN_PRICES[p] > 0 ? ` — ${PLAN_PRICES[p]} €/mes` : ' — Gratis'}
            </option>
          ))}
        </select>
      </div>

      {/* Trial countdown */}
      {c.subscription_status === 'trial' && daysLeft !== null && (
        <div className={`trial-badge ${daysLeft <= 3 ? 'trial-urgent' : ''}`}>
          {daysLeft > 0
            ? `⏳ Trial: ${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`
            : '⚠️ Trial expirado'}
        </div>
      )}

      {/* Meta: admin + alta + cuota */}
      <div className="company-meta">
        <div className="company-meta-row">
          <span className="company-meta-label">Admin</span>
          <span className="company-meta-value">{c.admin_email || '—'}</span>
        </div>
        <div className="company-meta-row">
          <span className="company-meta-label">Alta</span>
          <span className="company-meta-value">{new Date(c.created_at).toLocaleDateString('es-ES')}</span>
        </div>
        <div className="company-meta-row">
          <span className="company-meta-label">Cuota</span>
          <span className="company-meta-value" style={{ fontWeight: 700, color: price > 0 ? PLAN_COLORS[c.plan] : '#888' }}>
            {price > 0 ? `${price} €/mes` : 'Trial gratuito'}
          </span>
        </div>
      </div>

      {/* Acciones */}
      {actions.length > 0 && (
        <div className="company-actions">
          {actions.map(a => (
            <button key={a.value} className={`action-btn ${a.variant}`} onClick={() => handleStatus(a.value)} disabled={saving}>
              {saving ? '...' : a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Formulario nueva empresa ──────────────────────────────────────────────────
function CreateCompanyForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [tax_id, setTaxId] = useState('');
  const [admin_name, setAdminName] = useState('');
  const [admin_email, setAdminEmail] = useState('');
  const [admin_password, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await api.createCompany({ name, tax_id, admin_name, admin_email, admin_password });
      setSuccess(`✅ Empresa "${res.company.name}" creada. Admin: ${res.admin.email}`);
      setTimeout(onCreated, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear empresa');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-section" style={{ marginBottom: 28 }}>
      <h3>Nueva empresa cliente</h3>
      <form className="create-company-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre de la empresa</label>
          <input placeholder="Ej: Telefónica S.A." value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>CIF / NIF</label>
          <input placeholder="Ej: A28015865" value={tax_id} onChange={e => setTaxId(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Nombre del administrador RRHH</label>
          <input placeholder="Ej: Laura Martínez" value={admin_name} onChange={e => setAdminName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email del administrador</label>
          <input type="email" placeholder="rrhh@empresa.com" value={admin_email} onChange={e => setAdminEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Contraseña temporal</label>
          <input type="password" placeholder="El admin podrá cambiarla después" value={admin_password} onChange={e => setAdminPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creando...' : 'Crear empresa y admin'}
        </button>
      </form>
      {success && <p className="success-msg" style={{ marginTop: 12 }}>{success}</p>}
      {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}
