/**
 * Centralized fetch wrapper that includes credentials and default headers.
 * Use this instead of calling fetch directly so cookies (session) are sent by default.
 */
import { safeLocalStorage } from '../storage/safeLocalStorage';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function apiFetch(input: string, init?: RequestInit) {
  const url = input.startsWith('http')
    ? input
    : `${API_BASE}${input.startsWith('/') ? '' : '/'}${input}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const merged: RequestInit = {
    credentials: 'include', // ensure cookies are sent in cross-site environments
    ...init,
    headers: {
      ...headers,
      ...(init && init.headers ? init.headers : {}),
    },
  };

  const response = await fetch(url, merged);

  if (response.status === 401) {
    // Session expired or invalid
    // Prevent redirect loop if we're already on the login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  return response;
}

export default apiFetch;
