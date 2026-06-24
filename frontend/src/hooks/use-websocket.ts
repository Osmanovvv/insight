/**
 * Insight IS — useWebSocket Hook
 * Connects to the backend WebSocket endpoint for real-time notifications.
 * Authenticates via JWT token as query param.
 *
 * Usage:
 *   const { messages, status } = useNotificationWs();
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { tokenStorage } from "@/lib/apiClient";
import type { WsNotificationMessage } from "@/lib/types";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? "/ws";

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

export function useNotificationWs() {
    const [messages, setMessages] = useState<WsNotificationMessage[]>([]);
    const [status, setStatus] = useState<WsStatus>("disconnected");
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shouldReconnect = useRef(true);

    const connect = useCallback(() => {
        const token = tokenStorage.getAccess();
        if (!token) return;

        setStatus("connecting");
        const ws = new WebSocket(`${WS_BASE}/notifications?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus("connected");
        };

        ws.onmessage = (event) => {
            // Handle ping/pong keepalive
            if (event.data === "pong") return;
            try {
                const msg: WsNotificationMessage = JSON.parse(event.data);
                if (msg.type === "notification") {
                    setMessages((prev) => [msg, ...prev]);
                }
            } catch {
                // ignore malformed messages
            }
        };

        ws.onerror = () => {
            setStatus("error");
        };

        ws.onclose = () => {
            setStatus("disconnected");
            if (shouldReconnect.current) {
                reconnectTimer.current = setTimeout(connect, 5000);
            }
        };

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send("ping");
            }
        }, 30_000);

        return () => clearInterval(pingInterval);
    }, []);

    useEffect(() => {
        shouldReconnect.current = true;
        const cleanup = connect();
        return () => {
            shouldReconnect.current = false;
            cleanup?.();
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            wsRef.current?.close();
        };
    }, [connect]);

    const clearMessages = () => setMessages([]);

    return { messages, status, clearMessages };
}
