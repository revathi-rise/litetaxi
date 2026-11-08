export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

let adminToken: string | null = null;

async function getAdminToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('litespark_admin_token');
    if (saved) return saved;
  }
  if (adminToken) return adminToken;

  try {
    // 1. Send OTP for dev admin phone
    const sendRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919000000001' }),
    });
    const sendData = await sendRes.json();
    const otp = sendData.devOtp || '000000';

    // 2. Verify OTP as admin
    const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919000000001', otp, role: 'admin' }),
    });
    const verifyData = await verifyRes.json();
    if (verifyData.accessToken) {
      adminToken = verifyData.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('litespark_admin_token', adminToken!);
      }
      return adminToken!;
    }
  } catch (err) {
    console.error('Error acquiring admin token:', err);
  }
  return '';
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // If token expired, clear and retry once
  if (res.status === 401) {
    adminToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('litespark_admin_token');
    }
    const freshToken = await getAdminToken();
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
        ...(options.headers || {}),
      },
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'API request failed');
  }

  return res.json();
}

export const adminApi = {
  getStats: () => fetchWithAuth('/admin/stats'),
  getDrivers: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return fetchWithAuth(`/admin/drivers?${params.toString()}`);
  },
  approveDriver: (id: string) =>
    fetchWithAuth(`/admin/drivers/${id}/approve`, { method: 'POST' }),
  rejectDriver: (id: string, reason?: string) =>
    fetchWithAuth(`/admin/drivers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Documents not meeting criteria' }),
    }),
  getCustomers: () => fetchWithAuth('/admin/customers'),
  getCurrentRides: () => fetchWithAuth('/admin/rides/current'),
  getBookings: (status?: string, search?: string, page = 1) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('pageSize', '25');
    return fetchWithAuth(`/admin/bookings?${params.toString()}`);
  },
};

