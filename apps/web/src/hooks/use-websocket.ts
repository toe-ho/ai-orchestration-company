import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '../lib/websocket-client.js';

/** Shape of any company-level event coming over the socket */
export interface CompanySocketEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface UseWebSocketResult {
  connected: boolean;
  lastEvent: CompanySocketEvent | null;
}

/**
 * Opens a WebSocket connection for the given companyId.
 * Disconnects automatically on unmount or when companyId changes.
 */
export function useWebSocket(companyId: string | undefined): UseWebSocketResult {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<CompanySocketEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const socket = getSocket(companyId);
    socketRef.current = socket;

    setConnected(socket.connected);

    const onConnect = (): void => setConnected(true);
    const onDisconnect = (): void => setConnected(false);
    const onAnyEvent = (eventName: string, payload: unknown): void => {
      if (eventName === 'ping' || eventName === 'connect' || eventName === 'disconnect') return;
      const event = payload as CompanySocketEvent;
      if (event?.type) setLastEvent(event);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.onAny(onAnyEvent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.offAny(onAnyEvent);
      disconnectSocket(companyId);
      socketRef.current = null;
      setConnected(false);
    };
  }, [companyId]);

  return { connected, lastEvent };
}
