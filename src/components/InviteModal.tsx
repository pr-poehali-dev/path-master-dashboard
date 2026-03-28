import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  type: 'telegram' | 'vk' | 'sms';
  siteId: number;
  onClose: () => void;
}

const typeConfig = {
  telegram: { label: 'Telegram', icon: 'Send', placeholder: '@username или +79...' },
  vk: { label: 'ВКонтакте', icon: 'Globe', placeholder: 'vk.com/username или ID' },
  sms: { label: 'SMS', icon: 'MessageSquare', placeholder: '+7 999 000 00 00' },
};

export default function InviteModal({ type, siteId, onClose }: Props) {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);
  const cfg = typeConfig[type];
  const inviteLink = `${window.location.origin}?join=${siteId}`;

  const handleSend = () => {
    if (!value.trim()) return;
    if (type === 'telegram') {
      const msg = encodeURIComponent(`Вас приглашают на квест-платформу Мастер путей! ${inviteLink}`);
      window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${msg}`, '_blank');
    } else if (type === 'vk') {
      window.open(`https://vk.com/share.php?url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent('Приглашение в Мастер путей')}`, '_blank');
    } else {
      const msg = encodeURIComponent(`Вас приглашают на квест! ${inviteLink}`);
      window.open(`sms:${value}?body=${msg}`, '_blank');
    }
    setSent(true);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Icon name={cfg.icon} size={18} className="text-purple-400" fallback="Send" />
            </div>
            <div>
              <h3 className="font-bold">Пригласить через {cfg.label}</h3>
              <p className="text-xs text-muted-foreground">Отправить ссылку участнику</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {!sent ? (
          <>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">{cfg.label}: адрес или номер</label>
              <input
                className="input-mystical"
                placeholder={cfg.placeholder}
                value={value}
                onChange={e => setValue(e.target.value)}
              />
            </div>
            <div className="mb-4 bg-muted/40 rounded-lg px-3 py-2 break-all">
              <p className="text-xs text-muted-foreground mb-1">Ссылка-приглашение:</p>
              <a href={inviteLink} className="text-gold text-xs hover:underline">{inviteLink}</a>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSend} className="btn-gold flex-1 flex items-center justify-center gap-2">
                <Icon name="Send" size={14} />
                Отправить
              </button>
              <button onClick={onClose} className="btn-blue px-4">Отмена</button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Icon name="CheckCircle" size={40} className="text-green-400 mx-auto mb-3" />
            <p className="font-semibold">Приглашение отправлено!</p>
            <p className="text-muted-foreground text-sm mt-1">Участник получит ссылку для входа на платформу</p>
            <button onClick={onClose} className="btn-gold mt-4 px-8">Закрыть</button>
          </div>
        )}
      </div>
    </div>
  );
}
