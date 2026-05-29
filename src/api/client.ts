const BASE_URL = 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; role: string; userId: string; subscription_status: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getDashboardMetrics: () =>
    request<{
      total_employees: number;
      active_this_month: number;
      total_km: string;
      total_calories_burned: number;
      total_minutes: number;
      period: string;
    }>('/company/dashboard-metrics'),

  registerEmployee: (name: string, email: string, password: string) =>
    request<{ id: string; name: string; email: string; role: string }>('/users/register-employee', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  listEmployees: () =>
    request<{ employees: { id: string; name: string; email: string; status: string; created_at: string }[] }>('/users/employees'),

  listRewards: () =>
    request<{ rewards: Reward[] }>('/rewards'),

  createReward: (data: { title: string; description: string; points_cost: number; stock: number; max_per_user: number | null; redemption_period: RedemptionPeriod }) =>
    request<Reward>('/rewards', { method: 'POST', body: JSON.stringify(data) }),

  redeemReward: (rewardId: string) =>
    request<{ message: string; points_remaining: number; redemption_code: string; reward_title: string }>(`/rewards/${rewardId}/redeem`, { method: 'POST' }),

  listMyRedemptions: () =>
    request<{ redemptions: Redemption[] }>('/rewards/my-redemptions'),

  listCompanyRedemptions: () =>
    request<{ redemptions: Redemption[] }>('/rewards/redemptions'),

  validateRedemption: (redemptionId: string) =>
    request<{ ok: boolean }>(`/rewards/redemptions/${redemptionId}/validate`, { method: 'PATCH' }),

  getMyPoints: () =>
    request<{ points_balance: number }>('/rewards/my-points'),

  getMyMonthlyStats: () =>
    request<{
      total_km: string;
      total_calories: number;
      total_minutes: number;
      total_points: number;
      activity_count: number;
    }>('/activities/my-stats'),

  getMyActivities: () =>
    request<{ activities: ActivityRecord[] }>('/activities/me'),

  getLeaderboard: () =>
    request<{ leaderboard: LeaderboardEntry[] }>('/activities/leaderboard'),

  logActivity: (data: {
    activity_type: string;
    distance_km: number;
    duration_seconds: number;
    start_time: string;
    end_time: string;
  }) => request<{ message: string; activity: ActivityRecord }>('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  listChallenges: () =>
    request<{ challenges: Challenge[] }>('/challenges'),

  createChallenge: (data: {
    title: string; description?: string; type: 'activity' | 'challenge';
    date?: string; location?: string; max_participants?: number;
  }) => request<Challenge>('/challenges', { method: 'POST', body: JSON.stringify(data) }),

  joinChallenge: (id: string) =>
    request<{ ok: boolean }>(`/challenges/${id}/join`, { method: 'POST' }),

  leaveChallenge: (id: string) =>
    request<{ ok: boolean }>(`/challenges/${id}/leave`, { method: 'POST' }),

  deleteChallenge: (id: string) =>
    request<{ ok: boolean }>(`/challenges/${id}`, { method: 'DELETE' }),

  updateChallengeStatus: (id: string, status: 'completed' | 'cancelled') =>
    request<{ ok: boolean }>(`/challenges/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getEmployeeRedemptions: (userId: string) =>
    request<{ redemptions: EmployeeRedemption[] }>(`/users/${userId}/redemptions`),

  getEmployeeRewardLimits: (userId: string) =>
    request<{ limits: EmployeeRewardLimit[] }>(`/users/${userId}/reward-limits`),

  upsertEmployeeLimit: (userId: string, rewardId: string, max_per_user: number, redemption_period: RedemptionPeriod) =>
    request<{ ok: boolean }>(`/users/${userId}/reward-limits/${rewardId}`, {
      method: 'PUT',
      body: JSON.stringify({ max_per_user, redemption_period }),
    }),

  deleteEmployeeLimit: (userId: string, rewardId: string) =>
    request<{ ok: boolean }>(`/users/${userId}/reward-limits/${rewardId}`, { method: 'DELETE' }),

  listCompanies: () =>
    request<{ companies: CompanySummary[] }>('/companies'),

  createCompany: (data: {
    name: string;
    tax_id: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
  }) => request<{ company: { id: string; name: string }; admin: { email: string } }>('/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateSubscription: (companyId: string, status: string) =>
    request<{ id: string; name: string; subscription_status: string }>(`/companies/${companyId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updatePlan: (companyId: string, plan: string) =>
    request<{ id: string; name: string; plan: string }>(`/companies/${companyId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    }),
};

export interface CompanySummary {
  id: string;
  name: string;
  tax_id: string;
  subscription_status: string;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
  employee_count: number;
  total_co2_kg: string;
  total_calories: number;
  admin_email: string;
}

export interface ActivityRecord {
  id: string;
  activity_type: string;
  distance_km: string;
  duration_seconds: number;
  calories_burned: number;
  co2_avoided_kg: string;
  points_earned: number;
  start_time: string;
  is_validated: boolean;
}

export interface Challenge {
  id: string;
  company_id: string;
  creator_id: string;
  creator_name: string;
  creator_role: string;
  title: string;
  description: string | null;
  type: 'activity' | 'challenge';
  status: 'open' | 'completed' | 'cancelled';
  date: string | null;
  location: string | null;
  max_participants: number | null;
  participant_count: number;
  is_joined: boolean;
  created_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  user_name: string;
  reward_id: string;
  reward_title: string;
  points_cost: number;
  redemption_code: string;
  status: 'pending' | 'used';
  claimed_at: string;
  validated_at: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_points: number;
  total_km: string;
  total_minutes: number;
  activity_count: number;
  is_me: boolean;
}

export type RedemptionPeriod = 'none' | 'monthly' | 'yearly';

export interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  stock: number;
  is_active: boolean;
  max_per_user: number | null;
  redemption_period: RedemptionPeriod;
}

export interface EmployeeRedemption {
  id: string;
  reward_id: string;
  reward_title: string;
  points_cost: number;
  redemption_code: string;
  status: 'pending' | 'used';
  claimed_at: string;
  validated_at: string | null;
}

export interface EmployeeRewardLimit {
  reward_id: string;
  reward_title: string;
  default_max: number | null;
  default_period: RedemptionPeriod;
  override_max: number | null;
  override_period: RedemptionPeriod | null;
  times_redeemed: number;
}
