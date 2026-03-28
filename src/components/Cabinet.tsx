import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { db, Path } from '@/lib/db';
import { Session } from '@/lib/auth';
import QuestPlay from './QuestPlay';

interface Props { session: Session; onSessionUpdate: (s: Session) => void; }

export default function Cabinet({ session, onSessionUpdate }: Props) {
  const [tab, setTab] = useState<'paths' | 'messages' | 'profile'>('paths');
  const [playPath, setPlayPath] = useState<Path | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: session.name, email: '', phone: '', password: '', password2: '' });
  const [profileError, setProfileError] = useState('');

  const user = db.getUsers().find(u => u.id === session.userId);
  const paths = db.getPaths().filter(p => p.is_active);
  const access = db.getAccess().filter(a => a.user_id === session.userId);
  const progress = db.getProgress().filter(p => p.user_id === session.userId);
  const messages = db.getMessages().filter(m => m.from_user_id === session.userId || m.to_user_id === session.userId);
  const adminUser = db.getUsers().find(u => u.role === 'owner' || u.role === 'admin');

  if (playPath) {
    return <QuestPlay path={playPath} session={session} onBack={() => setPlayPath(null)} />;
  }

  const handleRequestAccess = (pathId: number) => {
    db.requestAccess(pathId, session.userId);
    window.location.reload();
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !adminUser) return;
    db.sendMessage({ from_user_id: session.userId, to_user_id: adminUser.id, site_id: 1, content: messageText });
    setMessageText('');
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 3000);
  };

  const handleSaveProfile = () => {
    setProfileError('');
    if (profileForm.password && profileForm.password !== profileForm.password2) {
      setProfileError('Пароли не совпадают'); return;
    }
    const upd: Record<string, string> = { name: profileForm.name };
    if (profileForm.email) upd.email = profileForm.email;
    if (profileForm.phone) upd.phone = profileForm.phone;
    if (profileForm.password) upd.password_hash = profileForm.password;
    db.updateUser(session.userId, upd);
    onSessionUpdate({ ...session, name: profileForm.name });
    setEditProfile(false);
  };

  const totalScore = progress.filter(p => p.completed).reduce((s, p) => s + p.score, 0);
  const completedLevels = progress.filter(p => p.completed).length;

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-cormorant text-gold">Личный кабинет</h2>
          <p className="text-muted-foreground text-sm mt-1">{session.name}</p>
        </div>
        <a href="https://yoomoney.ru/to/410017253212598/0" target="_blank" rel="noreferrer"
          className="btn-gold flex items-center gap-2">
          <Icon name="CreditCard" size={16} />
          Оплата
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Очков набрано', value: totalScore, icon: 'Star', color: 'text-gold' },
          { label: 'Уровней пройдено', value: completedLevels, icon: 'CheckCircle', color: 'text-green-400' },
          { label: 'Доступных путей', value: access.filter(a => a.is_active).length, icon: 'Map', color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="card-mystical p-4 text-center">
            <Icon name={s.icon} size={22} className={`${s.color} mx-auto mb-1`} fallback="Circle" />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 bg-muted/30 rounded-lg p-1 w-fit">
        {(['paths', 'messages', 'profile'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-yellow-500/20 text-yellow-400' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'paths' ? '🗺️ Пути' : t === 'messages' ? '💬 Сообщения' : '👤 Профиль'}
          </button>
        ))}
      </div>

      {tab === 'paths' && (
        <div className="space-y-4">
          <h3 className="section-header">Доступные пути</h3>
          {paths.map(path => {
            const acc = access.find(a => a.path_id === path.id);
            const pathProgress = progress.filter(p => p.path_id === path.id && p.completed);
            const levels = db.getLevels().filter(l => l.path_id === path.id);
            const pct = levels.length > 0 ? Math.round((pathProgress.length / levels.length) * 100) : 0;
            return (
              <div key={path.id} className="card-mystical p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Map" size={16} className="text-purple-400" />
                      <h4 className="font-bold">{path.title}</h4>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{path.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5 max-w-48">
                        <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{levels.length} уровней · {pathProgress.length} пройдено</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {!acc ? (
                      <button onClick={() => handleRequestAccess(path.id)} className="btn-purple text-sm flex items-center gap-1.5">
                        <Icon name="KeyRound" size={14} />
                        Запросить доступ
                      </button>
                    ) : !acc.is_active ? (
                      <div className="text-center">
                        <span className="text-xs text-yellow-400 block mb-1">Ожидает активации</span>
                        <Icon name="Clock" size={20} className="text-yellow-400 mx-auto" />
                      </div>
                    ) : (
                      <button onClick={() => setPlayPath(path)} className="btn-gold flex items-center gap-2">
                        <Icon name="Play" size={14} />
                        Начать {path.title}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {paths.length === 0 && (
            <div className="card-mystical p-8 text-center">
              <Icon name="Map" size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Нет доступных путей</p>
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-4">
          <h3 className="section-header">Сообщить администратору</h3>
          <div className="card-mystical p-5">
            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {messages.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Нет сообщений</p>}
              {messages.map(msg => {
                const isOwn = msg.from_user_id === session.userId;
                const sender = db.getUsers().find(u => u.id === msg.from_user_id);
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${isOwn ? 'bg-yellow-500/20 text-yellow-100' : 'bg-muted text-foreground'}`}>
                      {!isOwn && <p className="text-xs text-muted-foreground mb-0.5">{sender?.name}</p>}
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-50 mt-0.5">{new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {messageSent && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-green-400 text-sm mb-2 flex items-center gap-2">
                <Icon name="CheckCircle" size={14} />
                Сообщение отправлено
              </div>
            )}
            <div className="flex gap-2">
              <input className="input-mystical flex-1" placeholder="Напишите сообщение..." value={messageText} onChange={e => setMessageText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
              <button onClick={handleSendMessage} className="btn-gold px-4 flex items-center gap-1">
                <Icon name="Send" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="card-mystical p-6 max-w-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-header">Мой профиль</h3>
            <button onClick={() => setEditProfile(!editProfile)} className="btn-gold-sm flex items-center gap-1">
              <Icon name={editProfile ? 'X' : 'Pencil'} size={12} />
              {editProfile ? 'Отмена' : 'Редактировать'}
            </button>
          </div>
          {!editProfile ? (
            <div className="space-y-3">
              {[
                { label: 'Имя', value: user?.name },
                { label: 'Email', value: user?.email },
                { label: 'Телефон', value: user?.phone },
                { label: 'Роль', value: user?.role },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground text-sm">{f.label}</span>
                  <span className="font-medium text-sm">{f.value || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
                <input className="input-mystical" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input className="input-mystical" placeholder={user?.email} value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Телефон</label>
                <input className="input-mystical" placeholder={user?.phone} value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Новый пароль</label>
                <input className="input-mystical" type="password" placeholder="••••••••" value={profileForm.password} onChange={e => setProfileForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Подтвердите пароль</label>
                <input className="input-mystical" type="password" placeholder="••••••••" value={profileForm.password2} onChange={e => setProfileForm(f => ({ ...f, password2: e.target.value }))} />
              </div>
              {profileError && <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{profileError}</div>}
              <button onClick={handleSaveProfile} className="btn-gold w-full flex items-center justify-center gap-2">
                <Icon name="Save" size={14} />
                Сохранить изменения
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
