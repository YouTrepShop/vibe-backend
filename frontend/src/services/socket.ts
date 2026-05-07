import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:4000';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket && socket.connected) return socket;
  const token = useAuthStore.getState().accessToken;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 600,
    reconnectionDelayMax: 4000,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
