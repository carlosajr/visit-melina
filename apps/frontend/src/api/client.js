const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const ADMIN_TOKEN_KEY = 'vm:admin-token';
const VISITOR_TOKEN_KEY = 'vm:visitor-token';

export function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY); }
export function setAdminToken(t) { localStorage.setItem(ADMIN_TOKEN_KEY, t); }
export function clearAdminToken() { localStorage.removeItem(ADMIN_TOKEN_KEY); }
export function hasAdminToken() { return !!getAdminToken(); }

export function getVisitorToken() { return sessionStorage.getItem(VISITOR_TOKEN_KEY); }
export function setVisitorToken(t) { sessionStorage.setItem(VISITOR_TOKEN_KEY, t); }
export function clearVisitorToken() { sessionStorage.removeItem(VISITOR_TOKEN_KEY); }

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const body = await res.json(); msg = body.message ?? msg; } catch { /* noop */ }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function api(path, opts = {}) {
  return apiFetch(path, opts);
}

export function apiAdmin(path, opts = {}) {
  return apiFetch(path, {
    ...opts,
    headers: { Authorization: `Bearer ${getAdminToken()}`, ...(opts.headers ?? {}) },
  });
}

export function apiVisitor(path, opts = {}) {
  return apiFetch(path, {
    ...opts,
    headers: { Authorization: `Bearer ${getVisitorToken()}`, ...(opts.headers ?? {}) },
  });
}
