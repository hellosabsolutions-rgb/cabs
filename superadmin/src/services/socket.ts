import { io, Socket } from 'socket.io-client';

function socketBase(): string {
  const api = import.meta.env.VITE_API_URL || '';
  if (api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
}

let socket: Socket | null = null;

export function connectSuperadminSocket(
  token: string,
  onEvent: (payload: unknown) => void
) {
  disconnectSuperadminSocket();
  socket = io(`${socketBase()}/notifications`, {
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
