import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, Video, Send, Paperclip, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { api } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useCallStore } from '@/stores/callStore';
import type { Chat, Message } from '@/types';
import { getSocket } from '@/services/socket';
import { chatTimestamp } from '@/lib/format';
import { cn } from '@/lib/cn';

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const setStatus = useCallStore((s) => s.setStatus);
  const setCall = useCallStore((s) => s.setCall);
  const messagesByChat = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const pushMessage = useChatStore((s) => s.pushMessage);
  const typingMap = useChatStore((s) => s.typing);

  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = id ? messagesByChat[id] || [] : [];
  const peer = chat?.members.find((m) => m.user.id !== me?.id)?.user;
  const typingUsers = id ? typingMap[id] || {} : {};
  const isPeerTyping = peer && typingUsers[peer.id];

  useEffect(() => {
    if (!id) return;
    api.get(`/chats/${id}`).then((r) => setChat(r.data.data));
    api.get(`/messages/${id}`).then((r) => setMessages(id, (r.data.data.items || []).reverse()));
    const sock = getSocket();
    if (sock) sock.emit('chat:join', { chatId: id });
    api.post(`/chats/${id}/read`).catch(() => {});
  }, [id, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  let typingTimer: any;
  function onChange(v: string) {
    setText(v);
    if (!id) return;
    const sock = getSocket();
    sock?.emit('chat:typing', { chatId: id, isTyping: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => sock?.emit('chat:typing', { chatId: id, isTyping: false }), 1500);
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!id || !text.trim()) return;
    setSending(true);
    try {
      const r = await api.post(`/messages/${id}`, { content: text.trim() });
      pushMessage(r.data.data);
      setText('');
    } finally {
      setSending(false);
    }
  }

  async function uploadFile(f?: File) {
    if (!f || !id) return;
    const fd = new FormData();
    fd.append('file', f);
    const up = await api.post(`/messages/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const r = await api.post(`/messages/${id}`, {
      type: up.data.data.mediaType,
      mediaUrl: up.data.data.url,
      mediaType: up.data.data.mediaType,
    });
    pushMessage(r.data.data);
  }

  async function call(type: 'AUDIO' | 'VIDEO') {
    if (!peer || !id) return;
    const r = await api.post('/calls', { chatId: id, type, participantIds: [peer.id] });
    const sock = getSocket();
    sock?.emit('call:invite', { toUserId: peer.id, type });
    setCall({ type, remoteUser: peer, callId: r.data.data.id });
    setStatus('outgoing');
  }

  return (
    <div className="-mx-4 h-[calc(100vh-3.5rem)] flex flex-col">
      <header className="flex items-center gap-2 p-3 border-b border-border bg-bg-soft/40 backdrop-blur-2xl">
        <button onClick={() => navigate('/chats')} className="p-2 -ml-2 rounded-lg hover:bg-white/5 lg:hidden">
          <ArrowLeft size={20} />
        </button>
        <Avatar src={peer?.avatarUrl} name={peer?.fullName || peer?.username} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{chat?.title || peer?.fullName || peer?.username || '...'}</div>
          <div className="text-xs text-text-muted">{isPeerTyping ? 'печатает…' : 'в сети'}</div>
        </div>
        <button onClick={() => call('AUDIO')} className="p-2 hover:bg-white/5 rounded-lg"><Phone size={18} /></button>
        <button onClick={() => call('VIDEO')} className="p-2 hover:bg-white/5 rounded-lg"><Video size={18} /></button>
        <button className="p-2 hover:bg-white/5 rounded-lg"><MoreHorizontal size={18} /></button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => <Bubble key={m.id} m={m} mine={m.senderId === me?.id} />)}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="p-3 border-t border-border bg-bg-soft/40 backdrop-blur-2xl flex items-end gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="p-2 hover:bg-white/5 rounded-lg">
          <Paperclip size={18} />
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => uploadFile(e.target.files?.[0] || undefined)} />
        <textarea
          rows={1}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Написать сообщение…"
          className="input resize-none max-h-32"
        />
        <button type="submit" disabled={!text.trim() || sending} className="btn-primary px-4">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function Bubble({ m, mine }: { m: Message; mine: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-3 py-2',
        mine ? 'bg-vibe-gradient text-white rounded-br-md' : 'bg-bg-soft border border-border rounded-bl-md',
      )}>
        {m.mediaUrl && (
          m.mediaType === 'IMAGE' ? <img src={m.mediaUrl} className="rounded-xl mb-1 max-w-xs" /> :
          m.mediaType === 'VIDEO' ? <video src={m.mediaUrl} controls className="rounded-xl mb-1 max-w-xs" /> :
          <a href={m.mediaUrl} target="_blank" className="underline" rel="noreferrer">Файл</a>
        )}
        {m.content && <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>}
        <div className={cn('text-[10px] mt-1', mine ? 'text-white/70' : 'text-text-dim')}>{chatTimestamp(m.createdAt)}</div>
      </div>
    </div>
  );
}
