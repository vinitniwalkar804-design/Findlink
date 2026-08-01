const API_BASE = '/api';

let _token: string | null = localStorage.getItem('findlink_token');

export function setToken(token: string | null) {
  _token = token;
  if (token) {
    localStorage.setItem('findlink_token', token);
  } else {
    localStorage.removeItem('findlink_token');
  }
}

export function getToken(): string | null {
  if (!_token) {
    _token = localStorage.getItem('findlink_token');
  }
  return _token;
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text();
    let message: string;
    try {
      const json = JSON.parse(body);
      message = json.error || res.statusText;
    } catch {
      message = body || res.statusText;
    }
    throw new Error(message);
  }

  // Check if response is JSON
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }

  return res.text() as unknown as T;
}

// Auth
export const api = {
  // Auth
  signup: (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: string;
    badge_number?: string;
    department?: string;
  }) => request<{ token: string; user: any }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  signin: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<any>('/auth/me'),

  updatePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Users
  getUsers: () => request<any[]>('/users'),

  updateUser: (id: string, data: { full_name?: string; phone?: string; avatar_url?: string }) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Stats & Analytics
  getStats: () => request<any>('/stats'),

  getAnalytics: () => request<any>('/analytics'),

  // Missing Persons
  getMissingPersons: (status?: string) =>
    request<any[]>(`/missing-persons${status ? `?status=${status}` : ''}`),

  deleteMissingPerson: (id: string) =>
    request(`/missing-persons/${id}`, {
      method: 'DELETE',
    }),

  updateMissingPersonStatus: (id: string, status: string) =>
    request(`/missing-persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getMyMissingPersons: () => request<any[]>('/missing-persons/my'),

  // Found Persons
  getFoundPersons: (status?: string) =>
    request<any[]>(`/found-persons${status ? `?status=${status}` : ''}`),

  deleteFoundPerson: (id: string) =>
    request(`/found-persons/${id}`, {
      method: 'DELETE',
    }),

  updateFoundPersonStatus: (id: string, status: string) =>
    request(`/found-persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getMyFoundPersons: () => request<any[]>('/found-persons/my'),

  // Face Matches
  getFaceMatches: (params?: { status?: string; missingPersonIds?: string[] }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.missingPersonIds?.length) query.set('missingPersonIds', params.missingPersonIds.join(','));
    const qs = query.toString();
    return request<any[]>(`/face-matches${qs ? `?${qs}` : ''}`);
  },

  updateFaceMatchStatus: (id: string, status: string) =>
    request(`/face-matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Reports (Admin)
  getReports: () => request<any[]>('/reports'),

  // Audit Logs (Admin)
  getAuditLogs: () => request<any[]>('/audit-logs'),

  // Notifications
  getNotifications: () => request<any[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),

// Police: Upload Found Person + Photo Match
  policeUploadFound: (data: {
    photoUrl: string;
    possibleName?: string;
    gender?: string;
    estimatedAge?: string;
    description?: string;
  }): Promise<{ found_person: any; matches: any[]; match_count: number }> => {
    return request('/police/upload-found', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Upload
  uploadImage: async (file: File, folder: string): Promise<{ url: string; error: string | null }> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { url: '', error: 'Unsupported image format. Use JPG, JPEG, PNG, or WEBP.' };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { url: '', error: 'Image must be 10 MB or smaller.' };
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);

      const token = getToken();
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        return { url: '', error: err || 'Upload failed' };
      }

      const data = await res.json();
      // Prepend with backend URL if needed
      const url = data.url;
      return { url, error: null };
    } catch (err) {
      return { url: '', error: err instanceof Error ? err.message : 'Upload failed' };
    }
  },
};

