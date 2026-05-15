import 'server-only';

import axios from 'axios';
import { headers } from 'next/headers';

import { getSessionId } from '@/lib/auth/session';

const API_ENDPOINT =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_ENDPOINT ??
  'http://localhost:5432';
const MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const apiClient = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

const api = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SENSITIVE_QUERY_KEYS = new Set(['tk', 'token', 'session_id']);

function sanitizeFrontendPath(referer: string): string {
  try {
    const url = new URL(referer);
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, 'REDACTED');
      }
    }
    return url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '');
  } catch {
    return referer.split('?')[0] ?? referer;
  }
}

api.interceptors.request.use(async (config) => {
  const sessionId = await getSessionId();
  config.headers = config.headers ?? {};

  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }

  if (MUTATION_METHODS.includes(config.method?.toUpperCase() ?? '')) {
    const headerStore = await headers();
    const referer = headerStore.get('referer');
    if (referer) {
      config.headers['X-Frontend-Path'] = sanitizeFrontendPath(referer);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export { api, apiClient };
