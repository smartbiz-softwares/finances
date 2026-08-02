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

/**
 * Servidor al que apunta la aplicación.
 *
 * En web se deja vacío: las rutas relativas van al mismo origen que sirve la
 * página. En la app nativa no hay servidor propio, así que se compila con
 * VITE_API_BASE apuntando a producción.
 */
export const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

/** Antepone el servidor a una ruta de API. Úsalo en cualquier fetch directo. */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function api(path: string, options: any = {}) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  
  const formattedPath = path.startsWith('/api') 
    ? path 
    : `/api${path.startsWith('/') ? path : '/' + path}`;

  let res: Response;
  try {
    res = await fetch(apiUrl(formattedPath), { ...options, headers: { ...headers, ...options.headers } });
  } catch {
    // Respaldo solo útil en desarrollo local: en la app nativa API_BASE ya
    // apunta a producción y este segundo intento no tendría sentido.
    if (API_BASE) throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
    res = await fetch(`http://localhost:4000${formattedPath}`, { ...options, headers: { ...headers, ...options.headers } });
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
