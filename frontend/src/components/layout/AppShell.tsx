import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useUiStore } from '@/stores/uiStore';
import { useCallStore } from '@/stores/callStore';

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const pushMessage = useChatStore((s) => s.pushMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setCall = useCallStore((s) => s.setCall);
  const setCallStatus = useCallStore((s) => s.setStatus);
  const toast = useUiStore((s) => s.toast);

  useEffect(() => {
    if (!user) return;
    const sock = connectSocket();
    sock.on('message:new', (m) => pushMessage(m));
    sock.on('chat:typing', ({ chatId, userId, isTyping }) => setTyping(chatId, userId, isTyping));
    sock.on('notification:new', (n) =>
      toast({ type: 'info', title: 'Новое уведомление', description: n.type }),
    );
    sock.on('call:invite', ({ from, call }) => {
      setCall({ callId: call.id, type: call.type === 'VIDEO' ? 'VIDEO' : 'AUDIO', remoteUser: from });
      setCallStatus('incoming');
    });
    return () => {
      sock.off('message:new');
      sock.off('chat:typing');
      sock.off('notification:new');
      sock.off('call:invite');
      disconnectSocket();
    };
  }, [user, pushMessage, setTyping, setCall, setCallStatus, toast]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 px-safe pb-24 lg:pb-8 max-w-3xl mx-auto w-full">
          <Outlet />
        </div>
        <BottomNav />
      </main>
    </div>
  );
}
