const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('wayground_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiLogin(password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.json();
}

export async function apiVerify() {
  const res = await fetch(`${API_URL}/api/auth/verify`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function apiGetQuizzes() {
  const res = await fetch(`${API_URL}/api/quizzes`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function apiGetQuiz(id) {
  const res = await fetch(`${API_URL}/api/quizzes/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function apiCreateQuiz(data) {
  const res = await fetch(`${API_URL}/api/quizzes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiUpdateQuiz(id, data) {
  const res = await fetch(`${API_URL}/api/quizzes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiDeleteQuiz(id) {
  const res = await fetch(`${API_URL}/api/quizzes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function apiBulkImport(questions) {
  const res = await fetch(`${API_URL}/api/quizzes/bulk-import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ questions }),
  });
  return res.json();
}

export async function apiCheckRoom(code) {
  const res = await fetch(`${API_URL}/api/games/check/${code}`);
  return res.json();
}

export async function apiGetGameHistory() {
  const res = await fetch(`${API_URL}/api/games/history`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export function getExportCSVUrl(code) {
  return `${API_URL}/api/games/${code}/export-csv`;
}
