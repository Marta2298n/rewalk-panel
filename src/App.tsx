import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RewardsPage from './pages/RewardsPage';
import EmployeePage from './pages/EmployeePage';
import EmployeesPage from './pages/EmployeesPage';
import SuperadminPage from './pages/SuperadminPage';
import SubscriptionPage from './pages/SubscriptionPage';
import BillingPage from './pages/BillingPage';
import ChallengesPage from './pages/ChallengesPage';
import { useState } from 'react';

type AdminTab = 'dashboard' | 'employees' | 'rewards' | 'challenges' | 'subscription';
type SuperadminTab = 'companies' | 'billing';

function SuspensionBanner() {
  const { subscriptionStatus } = useAuth();
  if (subscriptionStatus !== 'suspended' && subscriptionStatus !== 'cancelled') return null;
  return (
    <div className="suspension-banner">
      {subscriptionStatus === 'suspended'
        ? '⚠️ Cuenta suspendida — algunas funciones están desactivadas. Contacta con rewalk para reactivarla.'
        : '🚫 Cuenta cancelada — el servicio está desactivado. Contacta con rewalk.'}
    </div>
  );
}

function SuperadminPanel() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<SuperadminTab>('companies');

  return (
    <div>
      <header className="dashboard-header">
        <div className="header-brand">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="30 20 380 88" height="36">
            <text x="36" y="102" fontFamily="Arial Black, sans-serif" fontSize="76" fontWeight="900" fill="#FAF8F5" letterSpacing="-3">rew</text>
            <polygon points="182,102 232,28 282,102" fill="#E8472A"/>
            <line x1="196" y1="71" x2="268" y2="71" stroke="#111111" strokeWidth="8"/>
            <text x="286" y="102" fontFamily="Arial Black, sans-serif" fontSize="76" fontWeight="900" fill="#FAF8F5" letterSpacing="-3">lk</text>
          </svg>
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${tab === 'companies' ? 'active' : ''}`} onClick={() => setTab('companies')}>🏢 Empresas</button>
          <button className={`nav-btn ${tab === 'billing' ? 'active' : ''}`} onClick={() => setTab('billing')}>💶 Facturación</button>
        </nav>
        <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
      </header>
      <main className="dashboard-main">
        {tab === 'companies' && <SuperadminPage />}
        {tab === 'billing' && <BillingPage />}
      </main>
    </div>
  );
}

function AdminPanel() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [rewardsInitialTab, setRewardsInitialTab] = useState<'catalog' | 'redemptions'>('catalog');

  function handleNavigate(target: AdminTab, subTab?: 'catalog' | 'redemptions') {
    if (target === 'rewards' && subTab) setRewardsInitialTab(subTab);
    setTab(target);
  }

  return (
    <div>
      <header className="dashboard-header">
        <div className="header-brand">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="30 20 380 88" height="36">
            <text x="36" y="102" fontFamily="Arial Black, sans-serif" fontSize="76" fontWeight="900" fill="#FAF8F5" letterSpacing="-3">rew</text>
            <polygon points="182,102 232,28 282,102" fill="#E8472A"/>
            <line x1="196" y1="71" x2="268" y2="71" stroke="#111111" strokeWidth="8"/>
            <text x="286" y="102" fontFamily="Arial Black, sans-serif" fontSize="76" fontWeight="900" fill="#FAF8F5" letterSpacing="-3">lk</text>
          </svg>
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={`nav-btn ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}>Empleados</button>
          <button className={`nav-btn ${tab === 'rewards' ? 'active' : ''}`} onClick={() => handleNavigate('rewards', 'catalog')}>Recompensas</button>
          <button className={`nav-btn ${tab === 'challenges' ? 'active' : ''}`} onClick={() => setTab('challenges')}>Retos</button>
          <button className={`nav-btn ${tab === 'subscription' ? 'active' : ''}`} onClick={() => setTab('subscription')}>Suscripción</button>
        </nav>
        <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
      </header>
      <SuspensionBanner />
      <main className="dashboard-main">
        {tab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {tab === 'employees' && <EmployeesPage />}
        {tab === 'rewards' && <RewardsPage initialTab={rewardsInitialTab} />}
        {tab === 'challenges' && <ChallengesPage />}
        {tab === 'subscription' && <SubscriptionPage />}
      </main>
    </div>
  );
}

function EmployeePanel() {
  const { logout } = useAuth();
  return (
    <div>
      <header className="dashboard-header">
        <div className="header-brand">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="30 20 380 88" height="36">
            <text x="36" y="102" fontFamily="Arial Black, sans-serif" fontSize="76" fontWeight="900" fill="#FAF8F5" letterSpacing="-3">rew</text>
            <polygon points="182,102 232,28 282,102" fill="#E8472A"/>
            <line x1="196" y1="71" x2="268" y2="71" stroke="#111111" strokeWidth="8"/>
            <text x="286" y="102" fontFamily="Arial Black, sans-serif" fontSize="76" fontWeight="900" fill="#FAF8F5" letterSpacing="-3">lk</text>
          </svg>
        </div>
        <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
      </header>
      <SuspensionBanner />
      <main className="dashboard-main">
        <EmployeePage />
      </main>
    </div>
  );
}

function AppContent() {
  const { token, role } = useAuth();
  if (!token) return <LoginPage />;
  if (role === 'employee') return <EmployeePanel />;
  if (role === 'superadmin') return <SuperadminPanel />;
  return <AdminPanel />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
