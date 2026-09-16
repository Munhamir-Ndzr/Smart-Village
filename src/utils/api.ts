// API client untuk backend Smart Village.
// Membaca base URL dari VITE_API_URL (Vite .env.local) atau process.env (untuk tes CLI).
// Semua fungsi silent-fallback: kalau API tidak dikonfigurasi/offline, kembalikan hasil default.

import { getAdminAuth } from './storage';

function resolveApiBase(): string {
  try {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (viteEnv?.VITE_API_URL) return viteEnv.VITE_API_URL.replace(/\/+$/, '');
  } catch {
    // non-Vite environment (mis. tes dengan tsx/node)
  }
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL.replace(/\/+$/, '');
  }
  return '';
}

export const API_BASE_URL = resolveApiBase();
export const isApiConfigured = (): boolean => API_BASE_URL.length > 0;

const DEFAULT_TIMEOUT = 8000;

function authToken(): string | undefined {
  try {
    return getAdminAuth()?.token;
  } catch {
    return undefined;
  }
}

async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return (await res.json().catch(() => ({}))) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function tryApi<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!isApiConfigured()) return null;
  try {
    return await fn();
  } catch {
    return null;
  }
}

// ---- AUTH ----
export interface LoginResult {
  token: string;
  role: string;
  name: string;
  username: string;
}

export const apiLogin = (username: string, password: string) =>
  api<LoginResult>('/api/auth/login', { method: 'POST', body: { username, password } });

// ---- PERMOHONAN SURAT ----
export const fetchPermohonan = () => api<any[]>('/api/permohonan');
export const createPermohonan = (data: unknown) =>
  api<any>('/api/permohonan', { method: 'POST', body: data });
export const updatePermohonan = (id: string, updates: unknown) =>
  api<any>(`/api/permohonan/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: updates,
    token: authToken(),
  });

// ---- LAPORAN / ASPIRASI ----
export const fetchLaporan = () => api<any[]>('/api/laporan');
export const createLaporan = (data: unknown) =>
  api<any>('/api/laporan', { method: 'POST', body: data });
export const updateLaporan = (id: string, updates: unknown) =>
  api<any>(`/api/laporan/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: updates,
    token: authToken(),
  });

// ---- KONTEN PUBLIK ----
export const fetchBerita = () => api<any[]>('/api/berita');
export const fetchPengumuman = () => api<any[]>('/api/pengumuman');
export const fetchUmkm = () => api<any[]>('/api/umkm');

// ---- FIRE-AND-FORGET (tulis ke API kalau tersedia, jangan ganggu UX) ----
export function syncPermohonanToApi(data: unknown): void {
  if (isApiConfigured()) {
    createPermohonan(data).catch(() => {});
  }
}

export function syncLaporanToApi(data: unknown): void {
  if (isApiConfigured()) {
    createLaporan(data).catch(() => {});
  }
}