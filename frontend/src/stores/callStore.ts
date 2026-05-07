import { create } from 'zustand';
import type { User } from '@/types';

export type CallStatus = 'idle' | 'incoming' | 'outgoing' | 'ongoing' | 'ended';

interface CallState {
  status: CallStatus;
  callId: string | null;
  type: 'AUDIO' | 'VIDEO';
  remoteUser: User | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  setStatus: (s: CallStatus) => void;
  setCall: (data: Partial<CallState>) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  callId: null,
  type: 'AUDIO',
  remoteUser: null,
  localStream: null,
  remoteStream: null,
  micEnabled: true,
  cameraEnabled: true,
  setStatus: (status) => set({ status }),
  setCall: (data) => set((s) => ({ ...s, ...data })),
  reset: () =>
    set({
      status: 'idle',
      callId: null,
      type: 'AUDIO',
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      micEnabled: true,
      cameraEnabled: true,
    }),
}));
