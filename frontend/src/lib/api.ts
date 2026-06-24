/**
 * Insight IS — API Service Functions
 * Typed wrappers over apiClient for each backend resource.
 */

import { apiClient, tokenStorage } from "./apiClient";
import type {
    Token,
    User,
    UserCreate,
    UserUpdate,
    News,
    Analysis,
    Notification,
    Subscription,
    Payment,
    Category,
    Asset,
    Blog,
    BlogCreate,
    BlogUpdate,
    AdminStats,
    UserWithSub,
    SubscriptionInfo,
} from "./types";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
    register: (data: UserCreate) =>
        apiClient.post<{ message: string; user_id: number }>("/auth/register", data),

    login: async (email: string, password: string): Promise<Token> => {
        const token = await apiClient.post<Token>("/auth/login", { email, password });
        tokenStorage.set(token.access_token, token.refresh_token);
        return token;
    },

    logout: () => tokenStorage.clear(),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
    me: () => apiClient.get<User>("/users/me"),
    list: (skip = 0, limit = 20) =>
        apiClient.get<User[]>(`/users/?skip=${skip}&limit=${limit}`),
    getById: (id: number) => apiClient.get<User>(`/users/${id}`),
    updateMe: (data: UserUpdate) => apiClient.patch<User>("/users/me", data),
    changePassword: (old_password: string, new_password: string) =>
        apiClient.patch<{ message: string }>("/users/me/password", { old_password, new_password }),
    update: (id: number, data: UserUpdate) => apiClient.patch<User>(`/users/${id}`, data),
    delete: (id: number) => apiClient.delete<void>(`/users/${id}`),
};

// ── News ──────────────────────────────────────────────────────────────────────

export const newsApi = {
    list: (params?: {
        skip?: number;
        limit?: number;
        category_id?: number;
        source?: string;
        date_from?: string;
        date_to?: string;
    }) => {
        const qs = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined) qs.append(k, String(v));
            });
        }
        return apiClient.get<News[]>(`/news/?${qs.toString()}`);
    },
    getById: (id: number) => apiClient.get<News>(`/news/${id}`),
    create: (data: Partial<News>) => apiClient.post<News>("/news/", data),
    update: (id: number, data: Partial<News>) => apiClient.patch<News>(`/news/${id}`, data),
    delete: (id: number) => apiClient.delete<void>(`/news/${id}`),
};

// ── Analysis ──────────────────────────────────────────────────────────────────

export const analysisApi = {
    list: (params?: { skip?: number; limit?: number; asset_id?: number; sentiment?: string; impact?: string; category?: string; title_search?: string }) => {
        const qs = new URLSearchParams();
        if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && qs.append(k, String(v)));
        return apiClient.get<Analysis[]>(`/analysis/?${qs}`);
    },
    count: (params?: { sentiment?: string; impact?: string; title_search?: string }) => {
        const qs = new URLSearchParams();
        if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && qs.append(k, String(v)));
        return apiClient.get<{ total: number }>(`/analysis/count?${qs}`);
    },
    getById: (id: number) => apiClient.get<Analysis>(`/analysis/${id}`),
    triggerForNews: (newsId: number) => apiClient.post<Analysis>(`/analysis/trigger/${newsId}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
    list: (unreadOnly = false) =>
        apiClient.get<Notification[]>(`/notifications/?unread_only=${unreadOnly}`),
    getById: (id: number) => apiClient.get<Notification>(`/notifications/${id}`),
    markRead: (id: number) =>
        apiClient.patch<Notification>(`/notifications/${id}`, { is_read: true }),
    delete: (id: number) => apiClient.delete<void>(`/notifications/${id}`),
    create: (data: { user_id: number; title: string; message: string }) =>
        apiClient.post<Notification>("/notifications/", data),
};

// ── Payments & Subscriptions ──────────────────────────────────────────────────

export const paymentsApi = {
    mySubscriptions: () => apiClient.get<Subscription[]>("/payments/subscriptions"),
    subscribe: (plan_id: number) =>
        apiClient.post<Subscription>("/payments/subscriptions", { plan_id }),
    myPayments: () => apiClient.get<Payment[]>("/payments/"),
};

// ── Categories ────────────────────────────────────────────────────────────────

export const categoriesApi = {
    list: () => apiClient.get<Category[]>("/categories/"),
    create: (name: string) => apiClient.post<Category>("/categories/", { name }),
    delete: (id: number) => apiClient.delete<void>(`/categories/${id}`),
};

// ── Assets ────────────────────────────────────────────────────────────────────

export const assetsApi = {
    list: (asset_type?: string) =>
        apiClient.get<Asset[]>(`/assets/${asset_type ? `?asset_type=${asset_type}` : ""}`),
    getById: (id: number) => apiClient.get<Asset>(`/assets/${id}`),
};

// ── Blogs ─────────────────────────────────────────────────────────────────────

export const blogsApi = {
    list: (includeHidden = false) =>
        apiClient.get<Blog[]>(`/blogs/?include_hidden=${includeHidden}`),
    listAdmin: () => apiClient.get<Blog[]>("/blogs/admin"),
    getById: (id: number) => apiClient.get<Blog>(`/blogs/${id}`),
    create: (data: BlogCreate) => apiClient.post<Blog>("/blogs/", data),
    update: (id: number, data: BlogUpdate) => apiClient.patch<Blog>(`/blogs/${id}`, data),
    delete: (id: number) => apiClient.delete<void>(`/blogs/${id}`),
    toggleVisibility: (id: number, is_visible: boolean) =>
        apiClient.patch<Blog>(`/blogs/${id}`, { is_visible }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
    stats: () => apiClient.get<AdminStats>("/blogs/stats"),
    listUsers: () => apiClient.get<UserWithSub[]>("/users/"),
    deleteUser: (id: number) => apiClient.delete<void>(`/users/${id}`),
    cancelSubscription: (userId: number) =>
        apiClient.post<{ message: string }>(`/payments/admin/subscriptions/${userId}/cancel`, {}),
    extendSubscription: (userId: number, days: number) =>
        apiClient.post<{ message: string }>(`/payments/admin/subscriptions/${userId}/extend?days=${days}`, {}),
};

// ── Subscription ──────────────────────────────────────────────────────────────

export interface CheckoutPayload {
    plan_id: number;
    card_number: string;
    card_holder: string;
    expiry: string;
    cvc: string;
}

export interface CheckoutResult {
    success: boolean;
    subscription_id: number;
    payment_id: number;
    transaction_id: string;
    amount: number;
    card_last4: string;
    status: string;
}

export const subscriptionApi = {
    mySubscription: () => apiClient.get<SubscriptionInfo>("/users/me/subscription"),
    subscribePro: () => apiClient.post<Subscription>("/payments/subscribe-pro", {}),
    checkout: (payload: CheckoutPayload) =>
        apiClient.post<CheckoutResult>("/payments/checkout", payload),
};
