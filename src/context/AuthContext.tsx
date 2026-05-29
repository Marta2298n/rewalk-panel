import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  role: string | null;
  subscriptionStatus: string | null;
  login: (token: string, role: string, subscriptionStatus: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(localStorage.getItem('subscription_status'));

  function login(token: string, role: string, subscriptionStatus: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('subscription_status', subscriptionStatus);
    setToken(token);
    setRole(role);
    setSubscriptionStatus(subscriptionStatus);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('subscription_status');
    setToken(null);
    setRole(null);
    setSubscriptionStatus(null);
  }

  return (
    <AuthContext.Provider value={{ token, role, subscriptionStatus, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
