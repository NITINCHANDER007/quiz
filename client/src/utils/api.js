const API_URL = (import.meta.env.VITE_SERVER_URL || 'http://localhost:5000').replace(/\/$/, '');

function getAuthHeaders() {
  const token = localStorage.getItem('quizpulse_admin_token') || localStorage.getItem('wayground_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(endpoint, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Server error (${res.status})`,
      };
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Request timed out. The backend server might still be starting up.',
      };
    }
    return {
      success: false,
      message: `Cannot connect to backend server. Ensure backend is deployed and running.`,
    };
  }
}

export async function apiLogin(password) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

export async function apiVerify() {
  return request('/api/auth/verify', {
    headers: getAuthHeaders(),
  });
}

export async function apiGetQuizzes() {
  return request('/api/quizzes', {
    headers: getAuthHeaders(),
  });
}

export async function apiGetQuiz(id) {
  return request(`/api/quizzes/${id}`, {
    headers: getAuthHeaders(),
  });
}

export async function apiCreateQuiz(data) {
  return request('/api/quizzes', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function apiUpdateQuiz(id, data) {
  return request(`/api/quizzes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function apiDeleteQuiz(id) {
  return request(`/api/quizzes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function apiBulkImport(questions) {
  return request('/api/quizzes/bulk-import', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ questions }),
  });
}

export async function apiCheckRoom(code) {
  return request(`/api/games/check/${code}`);
}

export async function apiGetGameHistory() {
  return request('/api/games/history', {
    headers: getAuthHeaders(),
  });
}

export function getExportCSVUrl(code) {
  return `${API_URL}/api/games/${code}/export-csv`;
}
