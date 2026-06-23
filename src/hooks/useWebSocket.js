import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage a WebSocket connection for real-time chat.
 *
 * Key design decisions:
 * - `onMessageReceived` is stored in a ref so that callback identity changes
 *   do NOT tear down and rebuild the WebSocket connection. This prevents the
 *   infinite reconnect loop that occurs when the parent component re-renders
 *   (e.g., after fetching chat history) and passes a new function reference.
 * - Non-recoverable server close codes (4003 = auth/param failure, 4004 =
 *   permission/listing not found) are detected and prevent reconnection.
 * - Reconnection uses exponential backoff with a hard cap of 10 attempts.
 * - A stale-socket guard ensures that event handlers from a previous socket
 *   instance do not fire on the current state after a URL change.
 */

const MAX_RECONNECT_ATTEMPTS = 10;

// Server close codes that indicate permanent rejection — never retry these
const NON_RECOVERABLE_CODES = new Set([4003, 4004, 1008]);

export const useWebSocket = (url, onMessageReceived) => {
  const [status, setStatus] = useState(url ? 'Connecting...' : 'Disconnected');

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);
  const reconnectAttempts = useRef(0);

  // Store the latest callback in a ref to decouple it from the connection lifecycle
  const onMessageRef = useRef(onMessageReceived);
  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  /**
   * Tear down any active socket and pending reconnect timer.
   * Nullifies all event handlers first to prevent stale callbacks from firing.
   */
  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      const socket = wsRef.current;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000, 'Cleanup');
      }
      wsRef.current = null;
    }
  }, []);

  /**
   * Open a new WebSocket to `urlRef`. Includes stale-socket guards so that
   * if a newer connection supersedes this one, old event handlers are no-ops.
   */
  const connect = useCallback((targetUrl) => {
    if (!targetUrl) {
      setStatus('Disconnected');
      return;
    }

    // Don't open a duplicate connection
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus('Connecting...');

    let socket;
    try {
      socket = new WebSocket(targetUrl);
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      setStatus('Error');
      return;
    }
    wsRef.current = socket;

    socket.onopen = () => {
      // Stale guard: another connect() may have replaced wsRef since this socket was created
      if (wsRef.current !== socket) return;
      setStatus('Connected');
      reconnectDelay.current = 1000;
      reconnectAttempts.current = 0;
    };

    socket.onmessage = (event) => {
      if (wsRef.current !== socket) return;
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    socket.onclose = (event) => {
      if (wsRef.current !== socket) return;
      wsRef.current = null;

      // Server intentionally rejected the connection — do not retry
      if (NON_RECOVERABLE_CODES.has(event.code)) {
        setStatus('Error');
        if (event.code === 4003) {
          console.warn('[WS] Connection rejected: authentication failed or missing parameters');
        } else if (event.code === 4004) {
          console.warn('[WS] Connection rejected: permission denied or listing not found');
        }
        return;
      }

      // Clean close (e.g., component unmount) — do not retry
      if (event.wasClean) {
        setStatus('Disconnected');
        return;
      }

      // Unclean close — attempt reconnection with exponential backoff
      setStatus('Disconnected');
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connect(targetUrl);
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        }, reconnectDelay.current);
      } else {
        console.warn('[WS] Max reconnect attempts reached — giving up');
        setStatus('Error');
      }
    };

    // onerror is always followed by onclose, so let onclose handle state transitions
    socket.onerror = () => {
      if (wsRef.current !== socket) return;
      // Intentionally no state change here — onclose will fire next
    };
  }, []);

  /**
   * React to URL changes: tear down old connection, open new one.
   * URL is the only external dependency that should trigger reconnection.
   */
  useEffect(() => {
    cleanup();
    reconnectAttempts.current = 0;
    reconnectDelay.current = 1000;

    if (url) {
      connect(url);
    } else {
      setStatus('Disconnected');
    }

    return cleanup;
  }, [url, connect, cleanup]);

  /** Send a JSON message over the open WebSocket. Returns false if not connected. */
  const sendMessage = useCallback((messageData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageData));
      return true;
    }
    return false;
  }, []);

  return { status, sendMessage };
};
