import { useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Eye, Phone } from 'lucide-react';
import { api } from '@/services/api';
import type { Notification } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { timeAgo } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';

const icons: Record<string, any> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  FOLLOW: UserPlus,
  FOLLOW_REQUEST: UserPlus,
  MENTION: AtSign,
  STORY_VIEW: Eye,
  CALL: Phone,
};

const labels: Record<string, string> = {
  LIKE: 'оценил(а) ваш пост',
  COMMENT: 'оставил(а) комментарий',
  FOLLOW: 'подписался(ась) на вас',
  FOLLOW_REQUEST: 'хочет подписаться',
  MENTION: 'упомянул(а) вас',
  STORY_VIEW: 'посмотрел(а) вашу историю',
  REPOST: 'репостнул(а)',
  REEL_LIKE: 'лайкнул(а) ваш рилс',
  CALL: 'звонил(а) вам',
  SYSTEM: 'Системное уведомление',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    api.get('/notifications').then((r) => setItems(r.data.data.items));
    api.post('/notifications/read-all').catch(() => {});
  }, []);

  if (items.length === 0) {
    return <EmptyState icon={<Bell size={28} />} title="Пока тишина" description="Здесь появятся уведомления о лайках, комментариях и подписках." />;
  }

  return (
    <div className="py-4 space-y-2">
      <h1 className="text-2xl font-bold mb-3 px-1">Уведомления</h1>
      {items.map((n) => {
        const Icon = icons[n.type] || Bell;
        return (
          <div key={n.id} className={`card p-3 flex items-center gap-3 ${n.isRead ? 'opacity-80' : ''}`}>
            <Avatar src={n.fromUser?.avatarUrl} name={n.fromUser?.fullName || n.fromUser?.username} size={42} />
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-semibold">{n.fromUser?.username || 'Vibe'}</span>{' '}
                <span className="text-text-muted">{labels[n.type] || ''}</span>
              </div>
              <div className="text-xs text-text-dim">{timeAgo(n.createdAt)}</div>
            </div>
            <Icon size={18} className="text-primary-300" />
          </div>
        );
      })}
    </div>
  );
}
