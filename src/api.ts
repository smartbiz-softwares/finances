let _token: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('hera_token') : null;
let _user: any = null;
let _listeners: Array<(user: any) => void> = [];

export function setToken(token: string | null) {
  _token = token;
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('hera_token', token);
    else localStorage.removeItem('hera_token');
  }
}

export function getToken() { return _token; }

export function setUser(user: any) {
  _user = user;
  _listeners.forEach(fn => fn(user));
}

export function getUser() { return _user; }

export function onAuthChange(fn: (user: any) => void) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}

async function api(path: string, options: any = {}) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  
  const formattedPath = path.startsWith('/api') 
    ? path 
    : `/api${path.startsWith('/') ? path : '/' + path}`;

  let res: Response;
  try {
    // Try relative path first (Vite proxy / production server)
    res = await fetch(formattedPath, { ...options, headers: { ...headers, ...options.headers } });
  } catch {
    // Fallback to explicit localhost:4000
    const fallbackUrl = `http://localhost:4000${formattedPath}`;
    res = await fetch(fallbackUrl, { ...options, headers: { ...headers, ...options.headers } });
  }

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Respuesta del servidor (${res.status}): ${text.slice(0, 80)}`);
  }
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const auth = {
  get currentUser() { return _user; }
};

export async function signOut() {
  setToken(null);
  setUser(null);
}

export async function fetchApi(path: string, options?: any) {
  return api(path, options);
}

export { api as default };
