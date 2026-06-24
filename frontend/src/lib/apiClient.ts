/**
 * Insight IS — API Client
 *
 * Централизованный HTTP-клиент для всех запросов к FastAPI backend.
 * Автоматически подставляет JWT access-token из localStorage,
 * обновляет его через refresh, перенаправляет на /login при 401.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "insight_access_token";
const REFRESH_KEY = "insight_refresh_token";

export const tokenStorage = {
    getAccess: (): string | null => localStorage.getItem(TOKEN_KEY),
    getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
    set: (access: string, refresh: string) => {
        localStorage.setItem(TOKEN_KEY, access);
        localStorage.setItem(REFRESH_KEY, refresh);
    },
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem("insight_user");
    },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiError {
    detail: unknown;
    status: number;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    retry = true
): Promise<T> {
    const token = tokenStorage.getAccess();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    // Try token refresh on 401
    if (response.status === 401 && retry) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            return apiFetch<T>(path, options, false);
        }
        tokenStorage.clear();
        window.location.href = "/";
        throw { detail: "Сессия истекла", status: 401 } as ApiError;
    }

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Ошибка сети" }));
        throw { ...err, status: response.status } as ApiError;
    }

    // 204 No Content
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
    const refresh = tokenStorage.getRefresh();
    if (!refresh) return false;
    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        tokenStorage.set(data.access_token, data.refresh_token);
        return true;
    } catch {
        return false;
    }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

export const apiClient = {
    get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),

    post: <T>(path: string, body?: unknown) =>
        apiFetch<T>(path, {
            method: "POST",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),

    patch: <T>(path: string, body?: unknown) =>
        apiFetch<T>(path, {
            method: "PATCH",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),

    delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
