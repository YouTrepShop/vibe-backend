import type { Server as IOServer } from 'socket.io';

export const ioRef: { io: IOServer | null } = { io: null };
