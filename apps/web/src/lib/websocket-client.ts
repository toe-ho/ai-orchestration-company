import { io, Socket } from 'socket.io-client';

/** Active socket connections keyed by companyId */
const sockets = new Map<string, Socket>();

/**
 * Returns a singleton Socket.io connection for the given companyId.
 * Creates a new connection if none exists yet.
 */
export function getSocket(companyId: string): Socket {
  const existing = sockets.get(companyId);
  if (existing?.connected || existing?.active) return existing;

  const socket = io('/events', {
    auth: { companyId },
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionAttempts: 10,
  });

  sockets.set(companyId, socket);
  return socket;
}

/** Disconnects and removes the socket for the given companyId */
export function disconnectSocket(companyId: string): void {
  const socket = sockets.get(companyId);
  if (socket) {
    socket.disconnect();
    sockets.delete(companyId);
  }
}
