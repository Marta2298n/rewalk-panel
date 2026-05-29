import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Challenge } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChallengesPage() {
  const { role } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'available' | 'mine'>('available');

  const load = () => {
    setLoading(true);
    api.listChallenges().then(r => setChallenges(r.challenges)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const isAdmin = role === 'company_admin' || role === 'superadmin';
  const open = challenges.filter(c => c.status === 'open');
  const past = challenges.filter(c => c.status !== 'open');
  const filtered = filter === 'available' ? open : open.filter(c => c.is_joined);
  const pastMine = past.filter(c => c.is_joined);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>🏆 Retos y Actividades</h2>
        <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Proponer actividad'}
        </button>
      </div>

      {showForm && (
        <CreateChallengeForm
          isAdmin={isAdmin}
          onCreated={() => { setShowForm(false); load(); }}
        />
      )}

      <div className="sub-tabs" style={{ marginBottom: 24 }}>
        <button className={`sub-tab-btn ${filter === 'available' ? 'active' : ''}`} onClick={() => setFilter('available')}>
          Retos disponibles ({open.length})
        </button>
        <button className={`sub-tab-btn ${filter === 'mine' ? 'active' : ''}`} onClick={() => setFilter('mine')}>
          Tus retos {open.filter(c => c.is_joined).length > 0 && (
            <span className="badge-count">{open.filter(c => c.is_joined).length}</span>
          )}
        </button>
      </div>

      {loading && <p className="loading">Cargando...</p>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 40 }}>🏃</div>
          <p>{filter === 'available' ? 'No hay retos activos.' : 'Aún no te has apuntado a ningún reto. ¡Explora los disponibles!'}</p>
        </div>
      )}

      <div className="challenges-list">
        {filtered.map(c => (
          <ChallengeCard key={c.id} challenge={c} isAdmin={isAdmin} onUpdated={load} />
        ))}
      </div>

      {filter === 'mine' && pastMine.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: 15, color: '#888', marginBottom: 16 }}>Anteriores</h3>
          <div className="challenges-list">
            {pastMine.map(c => (
              <ChallengeCard key={c.id} challenge={c} isAdmin={isAdmin} onUpdated={load} past />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de reto/actividad ─────────────────────────────────────────────────
function getUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).userId ?? null;
  } catch { return null; }
}

function ChallengeCard({ challenge: c, isAdmin, onUpdated, past = false }: {
  challenge: Challenge; isAdmin: boolean; onUpdated: () => void; past?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [calendarDone, setCalendarDone] = useState(false);
  const userId = getUserIdFromToken();
  const isOwn = !!userId && c.creator_id === userId;

  const isOfficial = c.creator_role === 'company_admin' || c.creator_role === 'superadmin';

  async function handleJoin() {
    setLoading(true);
    try { await api.joinChallenge(c.id); onUpdated(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error'); }
    finally { setLoading(false); }
  }

  async function handleLeave() {
    setLoading(true);
    try { await api.leaveChallenge(c.id); onUpdated(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error'); }
    finally { setLoading(false); }
  }

  async function handleStatus(status: 'completed' | 'cancelled') {
    setLoading(true);
    try { await api.updateChallengeStatus(c.id, status); onUpdated(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error'); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este reto? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    try { await api.deleteChallenge(c.id); onUpdated(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error'); }
    finally { setLoading(false); }
  }

  function handleCalendar() {
    setCalendarDone(true);
    setTimeout(() => setCalendarDone(false), 3000);
  }

  const isFull = c.max_participants !== null && c.participant_count >= c.max_participants;

  return (
    <div className={`challenge-card ${past ? 'challenge-past' : ''} ${c.status === 'cancelled' ? 'challenge-cancelled' : ''}`}>
      <div className="challenge-card-top">
        <div className="challenge-badges">
          <span className={`challenge-type-badge ${c.type}`}>
            {c.type === 'challenge' ? '🏆 Reto oficial' : '📣 Actividad'}
          </span>
          {isOfficial && <span className="challenge-official-badge">Empresa</span>}
          {c.status === 'completed' && <span className="challenge-status-badge completed">✅ Completado</span>}
          {c.status === 'cancelled' && <span className="challenge-status-badge cancelled">Cancelado</span>}
        </div>
        {isAdmin && c.status === 'open' && (
          <div className="challenge-admin-actions">
            <button className="challenge-admin-btn complete" onClick={() => handleStatus('completed')} disabled={loading}>✅ Completar</button>
            <button className="challenge-admin-btn cancel" onClick={() => handleStatus('cancelled')} disabled={loading}>Cancelar</button>
          </div>
        )}
      </div>

      <div className="challenge-title">{c.title}</div>
      {c.description && <div className="challenge-desc">{c.description}</div>}

      <div className="challenge-meta">
        {c.date && (
          <span className="challenge-meta-item">
            📅 {new Date(c.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        )}
        {c.location && <span className="challenge-meta-item">📍 {c.location}</span>}
        <span className="challenge-meta-item">
          👥 {c.participant_count}{c.max_participants ? ` / ${c.max_participants}` : ''} apuntados
        </span>
        <span className="challenge-meta-item" style={{ color: '#888' }}>
          por {c.creator_name}
        </span>
      </div>

      {c.status === 'open' && !isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {c.is_joined ? (
            <button className="btn-challenge-leave" onClick={handleLeave} disabled={loading}>
              {loading ? '...' : '✓ Apuntado — Salir'}
            </button>
          ) : (
            <button className="btn-primary" style={{ marginTop: 0 }} onClick={handleJoin} disabled={loading || isFull}>
              {loading ? '...' : isFull ? 'Aforo completo' : '¡Me apunto!'}
            </button>
          )}
          {c.is_joined && c.date && (
            calendarDone
              ? <span style={{ fontSize: 13, color: '#1a8a4a', fontWeight: 600 }}>✅ Añadido al calendario</span>
              : <button className="btn-secondary" style={{ marginTop: 0 }} onClick={handleCalendar}>📅 Añadir al calendario</button>
          )}
          {isOwn && (
            <button className="btn-secondary" style={{ marginTop: 0, borderColor: '#e74c3c', color: '#e74c3c' }} onClick={handleDelete} disabled={loading}>
              🗑 Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Formulario crear reto/actividad ───────────────────────────────────────────
function CreateChallengeForm({ isAdmin, onCreated }: { isAdmin: boolean; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'activity' | 'challenge'>(isAdmin ? 'challenge' : 'activity');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.createChallenge({
        title, description, type,
        date: date || undefined,
        location: location || undefined,
        max_participants: maxParticipants ? Number(maxParticipants) : undefined,
      });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-section" style={{ marginBottom: 28 }}>
      <h3>Proponer actividad</h3>
      <form onSubmit={handleSubmit} className="challenge-form">
        {isAdmin && (
          <div className="challenge-type-selector">
            <button type="button" className={`type-btn ${type === 'activity' ? 'active' : ''}`} onClick={() => setType('activity')}>
              📣 Actividad social
            </button>
            <button type="button" className={`type-btn ${type === 'challenge' ? 'active' : ''}`} onClick={() => setType('challenge')}>
              🏆 Reto oficial
            </button>
          </div>
        )}
        <input placeholder="Título — ej: Pádel viernes 19h, Carrera 5km Finanzas vs Marketing" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea placeholder="Descripción (opcional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        <div className="form-row">
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Lugar</label>
            <input placeholder="Ej: Pistas pádel Retiro" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Máx. participantes</label>
            <input type="number" min={2} placeholder="Sin límite" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar en el tablón'}
        </button>
      </form>
      {error && <p className="error-msg" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
