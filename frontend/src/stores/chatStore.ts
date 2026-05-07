import { create } from 'zustand';
import type { Chat, Message } from '@/types';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  typing: Record<string, Record<string, boolean>>;
  setChats: (chats: Chat[]) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  pushMessage: (m: Message) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  messages: {},
  typing: {},
  setChats: (chats) => set({ chats }),
  setMessages: (chatId, messages) =>
    set((s) => ({ messages: { ...s.messages, [chatId]: messages } })),
  pushMessage: (m) =>
    set((s) => ({
      messages: { ...s.messages, [m.chatId]: [...(s.messages[m.chatId] || []), m] },
      chats: s.chats.map((c) =>
        c.id === m.chatId ? { ...c, lastMessage: m, lastMessageAt: m.createdAt } : c,
      ),
    })),
  setTyping: (chatId, userId, isTyping) =>
    set((s) => {
      const cur = { ...(s.typing[chatId] || {}) };
      if (isTyping) cur[userId] = true;
      else delete cur[userId];
      return { typing: { ...s.typing, [chatId]: cur } };
    }),
}));
