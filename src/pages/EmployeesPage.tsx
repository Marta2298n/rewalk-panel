import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EmployeeRedemption, EmployeeRewardLimit, RedemptionPeriod } from '../api/client';

interface Employee {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

type EmployeeTab = 'redemptions' | 'limits';

const PERIOD_LABEL: Record<RedemptionPeriod, string> = {
  none: 'Total',
  monthly: 'Mensual',
  yearly: 'Anual',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [search, setSearch] = useState('');

  const loadEmployees = () => {
    api.listEmployees()
      .then(r => setEmployees(r.employees))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEmployees(); }, []);

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    return emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
  });

  if (loading) return <p className="loading">Cargando empleados...</p>;

  return (
    <div className="employees-page">
      {!selected ? (
        <>
          <RegisterEmployee onRegistered={loadEmployees} />

          <div className="employees-list-header">
            <h2>Empleados</h2>
            <input
              className="employee-search"
              type="search"
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {employees.length === 0 ? (
            <p className="loading">No hay empleados registrados todavía.</p>
          ) : filtered.length === 0 ? (
            <p className="loading">No hay resultados para «{search}».</p>
          ) : (
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Alta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ color: '#555' }}>{emp.email}</td>
                    <td>
                      <span className={`status-badge ${emp.status}`}>
                        {emp.status === 'active' ? 'Activo' : emp.status}
                      </span>
                    </td>
                    <td>{new Date(emp.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <button className="btn-view-employee" onClick={() => setSelected(emp)}>
                        Ver perfil →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <EmployeeProfile employee={selected} onBack={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── Registrar empleado ────────────────────────────────────────────────────────
function RegisterEmployee({ onRegistered }: { onRegistered: () => void }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const emp = await api.registerEmployee(name, email, password);
      setSuccess(`✅ ${emp.name} registrado correctamente`);
      setName(''); setEmail(''); setPassword('');
      onRegistered();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-section" style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Empleados</h3>
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setOpen(o => !o)}>
          {open ? '✕ Cancelar' : '+ Añadir empleado'}
        </button>
      </div>
      {open && (
        <form className="register-form" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <input placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña temporal" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
      )}
      {success && <p className="success-msg" style={{ marginTop: 10 }}>{success}</p>}
      {error   && <p className="error-msg"   style={{ marginTop: 10 }}>{error}</p>}
    </div>
  );
}

// ── Perfil individual ─────────────────────────────────────────────────────────
function EmployeeProfile({ employee, onBack }: { employee: Employee; onBack: () => void }) {
  const [tab, setTab] = useState<EmployeeTab>('redemptions');
  const [redemptions, setRedemptions] = useState<EmployeeRedemption[]>([]);
  const [limits, setLimits] = useState<EmployeeRewardLimit[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    if (tab === 'redemptions') {
      api.getEmployeeRedemptions(employee.id)
        .then(r => setRedemptions(r.redemptions))
        .finally(() => setLoadingData(false));
    } else {
      api.getEmployeeRewardLimits(employee.id)
        .then(r => setLimits(r.limits))
        .finally(() => setLoadingData(false));
    }
  }, [tab, employee.id]);

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <div>
          <h2 style={{ margin: 0 }}>{employee.name}</h2>
          <p style={{ margin: 0, color: '#777', fontSize: 14 }}>{employee.email}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="sub-tabs" style={{ marginBottom: 24 }}>
        <button
          className={`sub-tab-btn ${tab === 'redemptions' ? 'active' : ''}`}
          onClick={() => setTab('redemptions')}
        >
          🎫 Vales canjeados
        </button>
        <button
          className={`sub-tab-btn ${tab === 'limits' ? 'active' : ''}`}
          onClick={() => setTab('limits')}
        >
          🔒 Límites de canje
        </button>
      </div>

      {loadingData ? (
        <p className="loading">Cargando...</p>
      ) : tab === 'redemptions' ? (
        <RedemptionsTab redemptions={redemptions} />
      ) : (
        <LimitsTab limits={limits} employeeId={employee.id} onUpdated={() => {
          api.getEmployeeRewardLimits(employee.id).then(r => setLimits(r.limits));
        }} />
      )}
    </div>
  );
}

// ── Tab: vales canjeados ──────────────────────────────────────────────────────
function RedemptionsTab({ redemptions }: { redemptions: EmployeeRedemption[] }) {
  if (redemptions.length === 0) {
    return <p className="loading">Este empleado todavía no ha canjeado ninguna recompensa.</p>;
  }
  return (
    <table className="employee-table">
      <thead>
        <tr>
          <th>Recompensa</th>
          <th>Código</th>
          <th>Puntos</th>
          <th>Fecha</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {redemptions.map(r => (
          <tr key={r.id}>
            <td style={{ fontWeight: 600 }}>{r.reward_title}</td>
            <td><span className="redemption-code-badge">{r.redemption_code}</span></td>
            <td>⭐ {r.points_cost}</td>
            <td>{new Date(r.claimed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            <td>
              <span className={`status-badge ${r.status}`}>
                {r.status === 'pending' ? 'Pendiente' : 'Validado'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Tab: límites de canje ─────────────────────────────────────────────────────
function LimitsTab({ limits, employeeId, onUpdated }: {
  limits: EmployeeRewardLimit[];
  employeeId: string;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null); // rewardId en edición
  const [editMax, setEditMax] = useState('');
  const [editPeriod, setEditPeriod] = useState<RedemptionPeriod>('none');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function startEdit(limit: EmployeeRewardLimit) {
    setEditing(limit.reward_id);
    setEditMax(String(limit.override_max ?? limit.default_max ?? 1));
    setEditPeriod(limit.override_period ?? limit.default_period);
    setError('');
  }

  async function handleSave(rewardId: string) {
    if (!editMax || Number(editMax) < 1) { setError('El límite debe ser >= 1'); return; }
    setSaving(true);
    setError('');
    try {
      await api.upsertEmployeeLimit(employeeId, rewardId, Number(editMax), editPeriod);
      setEditing(null);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rewardId: string) {
    setSaving(true);
    setError('');
    try {
      await api.deleteEmployeeLimit(employeeId, rewardId);
      setEditing(null);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  }

  if (limits.length === 0) {
    return <p className="loading">No hay recompensas activas en el catálogo.</p>;
  }

  return (
    <div>
      {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}
      <table className="employee-table">
        <thead>
          <tr>
            <th>Recompensa</th>
            <th>Límite general</th>
            <th>Override empleado</th>
            <th>Canjeado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {limits.map(l => {
            const effectiveMax    = l.override_max    ?? l.default_max;
            const effectivePeriod = l.override_period ?? l.default_period;
            const isEditing = editing === l.reward_id;

            return (
              <tr key={l.reward_id}>
                <td style={{ fontWeight: 600 }}>{l.reward_title}</td>

                {/* Límite general */}
                <td style={{ color: '#666' }}>
                  {l.default_max === null
                    ? '∞ Sin límite'
                    : `${l.default_max} · ${PERIOD_LABEL[l.default_period]}`}
                </td>

                {/* Override / edición */}
                <td>
                  {isEditing ? (
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number"
                        className="limit-input"
                        min={1}
                        value={editMax}
                        onChange={e => setEditMax(e.target.value)}
                        style={{ width: 60 }}
                      />
                      <select
                        className="limit-period-select"
                        value={editPeriod}
                        onChange={e => setEditPeriod(e.target.value as RedemptionPeriod)}
                      >
                        <option value="none">Total</option>
                        <option value="monthly">Mensual</option>
                        <option value="yearly">Anual</option>
                      </select>
                    </span>
                  ) : l.override_max !== null ? (
                    <span style={{ color: '#E8472A', fontWeight: 600 }}>
                      {l.override_max} · {PERIOD_LABEL[l.override_period!]}
                    </span>
                  ) : (
                    <span style={{ color: '#aaa' }}>—</span>
                  )}
                </td>

                {/* Contador */}
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: effectiveMax !== null && l.times_redeemed >= effectiveMax ? '#E8472A' : '#333',
                  }}>
                    {l.times_redeemed}{effectiveMax !== null ? `/${effectiveMax}` : ''}
                    {effectivePeriod !== 'none' ? ` (${PERIOD_LABEL[effectivePeriod].toLowerCase()})` : ''}
                  </span>
                </td>

                {/* Acciones */}
                <td>
                  {isEditing ? (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-validate" onClick={() => handleSave(l.reward_id)} disabled={saving}>
                        {saving ? '...' : 'Guardar'}
                      </button>
                      {l.override_max !== null && (
                        <button className="btn-delete-limit" onClick={() => handleDelete(l.reward_id)} disabled={saving}>
                          Quitar
                        </button>
                      )}
                      <button className="btn-cancel-edit" onClick={() => setEditing(null)}>Cancelar</button>
                    </span>
                  ) : (
                    <button className="btn-edit-limit" onClick={() => startEdit(l)}>
                      {l.override_max !== null ? '✏️ Editar' : '+ Personalizar'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
