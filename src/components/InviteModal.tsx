import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { sendInviteSms } from '@/lib/sms';
import { db } from '@/lib/db';

interface Props {
  type: 'vk' | 'sms';
  siteId: number;
  onClose: () => void;
}

export default function InviteModal({ type, siteId, onClose }: Props) {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const site = db.getSites().find(s => s.id === siteId);
  const siteName = site?.name || 'Мастер путей';
  const inviteLink = `${window.location.origin}?join=${siteId}`;

  const handleSend = async () => {
    if (!value.trim()) { setError('Введите данные'); return; }
    setError('');

    if (type === 'vk') {
      window.open(
        `https://vk.com/share.php?url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent(`Приглашение в квест «${siteName}»`)}&comment=${encodeURIComponent(`Присоединяйтесь к квест-платформе «${siteName}»!`)}`,
        '_blank'
      );
      setSent(true);
    } else {
      setSending(true);
      const res = await sendInviteSms(value.trim(), siteName, inviteLink);
      setSending(false);
      if (res.ok) {
        setSent(true);
      } else {
        setError('Не удалось отправить SMS. Проверьте номер телефона и попробуйте снова.');
      }
    }
  };

  const config = {
    vk: { label: 'ВКонтакте', icon: 'Globe', placeholder: 'Введите любые данные — откроется окно ВК', inputLabel: 'Комментарий к публикации (необязательно)' },
    sms: { label: 'SMS', icon: 'MessageSquare', placeholder: '+7 999 000 00 00', inputLabel: 'Номер телефона получателя' },
  };
  const cfg = config[type];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'vk' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
              <Icon name={cfg.icon} size={18} className={type === 'vk' ? 'text-blue-400' : 'text-green-400'} fallback="Send" />
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
            <div className="mb-4 bg-muted/40 rounded-lg px-3 py-2 break-all">
              <p className="text-xs text-muted-foreground mb-1">Ссылка-приглашение:</p>
              <span className="text-gold text-xs">{inviteLink}</span>
            </div>

            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">{cfg.inputLabel}</label>
              <input
                className="input-mystical"
                placeholder={cfg.placeholder}
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-2">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSend}
                disabled={sending}
                className="btn-gold flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {sending
                  ? <><Icon name="Loader" size={14} className="animate-spin" /> Отправка...</>
                  : <><Icon name="Send" size={14} /> {type === 'vk' ? 'Поделиться в ВК' : 'Отправить SMS'}</>
                }
              </button>
              <button onClick={onClose} className="btn-blue px-4">Отмена</button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Icon name="CheckCircle" size={40} className="text-green-400 mx-auto mb-3" />
            <p className="font-semibold">
              {type === 'vk' ? 'Открыто окно ВКонтакте!' : 'SMS отправлено!'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {type === 'vk'
                ? 'Опубликуйте запись — участник увидит приглашение'
                : 'Участник получит SMS со ссылкой для входа'}
            </p>
            <button onClick={onClose} className="btn-gold mt-4 px-8">Закрыть</button>
          </div>
        )}
      </div>
    </div>
  );
}
