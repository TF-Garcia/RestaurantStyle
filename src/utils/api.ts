const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiUrl = (path: string) => `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

export const csrfToken = () => document.cookie.split('; ').find((item) => item.startsWith('csrf_token='))?.split('=')[1] || '';

export const apiFetch = (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const csrf = csrfToken();
  if (csrf && !headers.has('x-csrf-token')) headers.set('x-csrf-token', csrf);
  return fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers,
  });
};
