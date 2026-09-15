import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';

let socket: Socket | null = null;

export function connectSuperadminSocket(
  token: string,
  onEvent: (payload: unknown) => void
) {
  disconnectSuperadminSocket();
  socket = io(`${SOCKET_URL}/notifications`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    // room join happens server-side for superadmin role
  });

  socket.on('platform:event', onEvent);
  socket.on('notification:new', onEvent);

  return socket;
}

export function disconnectSuperadminSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
