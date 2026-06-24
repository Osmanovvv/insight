/**
 * Insight IS — TypeScript Types for API responses
 * Mirrors the Pydantic schemas from the FastAPI backend.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface Token {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export type UserRole = "investor" | "trader" | "admin";

export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    first_name?: string;
    last_name?: string;
    is_active: boolean;
    created_at: string;
}

export interface UserCreate {
    username: string;
    email: string;
    password: string;
    role?: UserRole;
    first_name?: string;
    last_name?: string;
}

export interface UserUpdate {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
}

// ── News ──────────────────────────────────────────────────────────────────────

export interface News {
    id: number;
    title: string;
    content?: string;
    source?: string;
    url?: string;
    publication_date?: string;
    category_id?: number;
    category_name?: string | null;
    sentiment_score?: number;
    impact_score?: number;
}

export interface NewsCreate {
    title: string;
    content?: string;
    source?: string;
    url?: string;
    publication_date?: string;
    category_id?: number;
    sentiment_score?: number;
    impact_score?: number;
}

// ── Analysis ──────────────────────────────────────────────────────────────────

export interface Analysis {
    id: number;
    news_id?: number;
    asset_id?: number;
    summary?: string;
    sentiment?: "positive" | "negative" | "neutral";
    impact?: "high" | "medium" | "low";
    confidence?: number;
    created_at: string;
    news?: News | null;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

// ── Payments & Subscriptions ──────────────────────────────────────────────────

export interface Subscription {
    id: number;
    user_id: number;
    plan_id: number;
    status: "active" | "expired" | "cancelled";
    started_at: string;
    expires_at?: string;
    is_active: boolean;
}

export interface Payment {
    id: number;
    subscription_id: number;
    amount: number;
    transaction_id: string;
    status: "pending" | "completed" | "failed" | "refunded";
    created_at: string;
}

// ── Categories & Assets ───────────────────────────────────────────────────────

export interface Category {
    id: number;
    name: string;
}

export interface Asset {
    id: number;
    name: string;
    ticker: string;
    asset_type: "stock" | "crypto" | "commodity" | "forex" | "index";
    exchange?: string;
}

// ── Blogs ─────────────────────────────────────────────────────────────────────

export interface Blog {
    id: number;
    title: string;
    content: string;
    sources?: string[] | null;
    is_visible: boolean;
    created_at: string;
    updated_at?: string | null;
}

export interface BlogCreate {
    title: string;
    content: string;
    sources?: string[];
}

export interface BlogUpdate {
    title?: string;
    content?: string;
    sources?: string[];
    is_visible?: boolean;
}

// ── Admin Stats ───────────────────────────────────────────────────────────────

export interface AdminStats {
    users_today: number;
    news_today: number;
    total_blogs: number;
    total_users: number;
    total_news: number;
}

// ── User with Subscription ────────────────────────────────────────────────────

export interface UserWithSub extends User {
    subscription_plan?: string | null;
    subscription_expires?: string | null;
    subscription_active: boolean;
}

// ── Subscription Info ─────────────────────────────────────────────────────────

export interface SubscriptionInfo {
    plan: string;
    is_active: boolean;
    expires_at?: string | null;
    started_at?: string | null;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// ── WebSocket messages ────────────────────────────────────────────────────────

export interface WsNotificationMessage {
    type: "notification" | "connected";
    id?: number;
    title?: string;
    message?: string;
    user_id?: number;
}
