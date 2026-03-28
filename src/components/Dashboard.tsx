import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { db, INTEGRATION_TEMPLATE } from '@/lib/db';
import { Session } from '@/lib/auth';
import { Section } from './Sidebar';
import InviteModal from './InviteModal';
import { sendAccessRequestSms } from '@/lib/sms';

interface Props {
  session: Session;
  onNav: (s: Section) => void;
}

type InviteType = 'vk' | 'sms';

interface AcceptModal {
  mode: 'form' | 'key' | null;
}

export default function Dashboard({ session, onNav }: Props) {
  const [invite, setInvite] = useState<InviteType | null>(null);
  const [acceptModal, setAcceptModal] = useState<AcceptModal>({ mode: null });
  const [newSiteForm, setNewSiteForm] = useState({ name: '', description: '' });
  const [integrationKey, setIntegrationKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [copiedKey, setCopiedKey] = useState<number | null>(null);

  const sites = db.getSites();
  const paths = db.getPaths();
  const users = db.getUsers();
  const progress = db.getProgress();
  const joinRequests = db.getJoinRequests().filter(r => r.status === 'pending');

  const completedLevels = progress.filter(p => p.completed).length;
  const activePaths = paths.filter(p => p.is_active).length;

  const handleCreateNewSite = () => {
    if (!newSiteForm.name.trim()) return;
    const newSite = db.addSite({
      name: newSiteForm.name,
      description: newSiteForm.description || 'Квест-сайт платформы Мастер путей',
      owner_id: session.userId,
      is_active: true,
    });
    setAcceptModal({ mode: null });
    setNewSiteForm({ name: '', description: '' });
    setTimeout(() => {
      const text = INTEGRATION_TEMPLATE(newSite);
      navigator.clipboard.writeText(text);
    }, 300);
    alert(`Сайт «${newSite.name}» создан!\n\nДанные интеграции скопированы в буфер обмена — вставьте их в ИИ-генератор для создания квест-сайта.`);
    window.location.reload();
  };

  const handleAcceptByKey = () => {
    setKeyError('');
    if (!integrationKey.trim()) { setKeyError('Введите ключ интеграции'); return; }
    const existingSite = sites.find(s => s.integration_key === integrationKey.trim());
    if (existingSite) {
      setKeyError('Сайт с таким ключом уже подключён');
      return;
    }
    db.addSite({
      name: `Сайт (${integrationKey.trim().slice(0, 8)})`,
      description: 'Подключён по ключу интеграции',
      owner_id: session.userId,
      is_active: true,
      integration_key: integrationKey.trim(),
    });
    setAcceptModal({ mode: null });
    setIntegrationKey('');
    window.location.reload();
  };

  const handleApproveRequest = async (id: number) => {
    db.updateJoinRequest(id, 'approved');
    const req = db.getJoinRequests().find(r => r.id === id);
    if (req?.site_id) {
      const u = db.getUsers().find(u => u.phone === req.phone || u.email === req.email);
      if (u) db.approveMember(req.site_id, u.id);
    }
    const owner = db.getUsers().find(u => u.id === session.userId);
    if (owner?.phone && req) {
      await sendAccessRequestSms(owner.phone, req.name, 'квест-платформе');
    }
    window.location.reload();
  };

  const handleCopyIntegration = (siteId: number) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    navigator.clipboard.writeText(INTEGRATION_TEMPLATE(site));
    setCopiedKey(siteId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold font-cormorant text-gold">Панель управления</h2>
          <p className="text-muted-foreground text-sm mt-1">Добро пожаловать, {session.name}</p>
        </div>
        {(session.role === 'owner' || session.role === 'admin') && (
          <button onClick={() => setAcceptModal({ mode: 'form' })} className="btn-gold flex items-center gap-2">
            <Icon name="Plus" size={16} />
            Принять дополнение
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: 'Globe', label: 'Сайты', value: sites.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: 'Map', label: 'Активных путей', value: activePaths, color: 'text-gold', bg: 'bg-yellow-500/10' },
          { icon: 'Users', label: 'Участников', value: users.length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: 'Star', label: 'Пройдено уровней', value: completedLevels, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map(stat => (
          <div key={stat.label} className="card-mystical p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <Icon name={stat.icon} size={20} className={stat.color} fallback="Circle" />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-mystical p-5">
          <h3 className="section-header mb-4 flex items-center gap-2">
            <Icon name="Map" size={16} className="text-gold" />
            Пути по сайтам
          </h3>
          <div className="space-y-3">
            {sites.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Нет подключённых сайтов</p>
            )}
            {sites.map(site => {
              const sitePaths = paths.filter(p => p.site_id === site.id);
              return (
                <div key={site.id} className="border border-border/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{site.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{sitePaths.length} путей</span>
                      <button
                        onClick={() => handleCopyIntegration(site.id)}
                        className={`text-xs px-2 py-0.5 rounded transition-all flex items-center gap-1 ${copiedKey === site.id ? 'text-green-400' : 'text-gold/70 hover:text-gold'}`}>
                        <Icon name={copiedKey === site.id ? 'CheckCircle' : 'Copy'} size={10} />
                        {copiedKey === site.id ? 'Скопировано' : 'Данные интеграции'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sitePaths.map(path => (
                      <span key={path.id} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                        {path.title}
                      </span>
                    ))}
                    {sitePaths.length === 0 && <span className="text-xs text-muted-foreground">Нет путей</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => onNav('sites')} className="btn-blue w-full mt-4 flex items-center justify-center gap-2 text-sm">
            <Icon name="Settings" size={14} />
            Управление сайтами
          </button>
        </div>

        {(session.role === 'owner' || session.role === 'admin') && (
          <div className="card-mystical p-5">
            <h3 className="section-header mb-4 flex items-center gap-2">
              <Icon name="Bell" size={16} className="text-gold" />
              Запросы на участие
              {joinRequests.length > 0 && (
                <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{joinRequests.length}</span>
              )}
            </h3>
            {joinRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Новых запросов нет</p>
            ) : (
              <div className="space-y-2">
                {joinRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.phone || req.email}</p>
                      <p className="text-xs text-muted-foreground/60">{new Date(req.created_at).toLocaleDateString('ru')}</p>
                    </div>
                    <button
                      onClick={() => handleApproveRequest(req.id)}
                      className="btn-gold-sm flex items-center gap-1">
                      <Icon name="Check" size={12} />
                      Принять
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {(session.role === 'owner' || session.role === 'admin') && (
        <div className="card-mystical p-5">
          <h3 className="section-header mb-4 flex items-center gap-2">
            <Icon name="UserPlus" size={16} className="text-gold" />
            Пригласить участника
          </h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setInvite('vk')} className="btn-blue flex items-center gap-2">
              <Icon name="Users" size={14} />
              ВКонтакте
            </button>
            <button onClick={() => setInvite('sms')} className="flex items-center gap-2 bg-green-800/50 text-green-300 border border-green-600/40 font-semibold px-5 py-2.5 rounded-lg hover:scale-105 transition-all duration-300">
              <Icon name="MessageSquare" size={14} />
              SMS
            </button>
          </div>
        </div>
      )}

      {invite && (
        <InviteModal type={invite} siteId={sites[0]?.id || 1} onClose={() => setInvite(null)} />
      )}

      {acceptModal.mode && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAcceptModal({ mode: null })}>
          <div className="modal-content max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Icon name="Plus" size={18} className="text-gold" />
                Принять дополнение
              </h3>
              <button onClick={() => setAcceptModal({ mode: null })} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setAcceptModal({ mode: 'form' })}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all border ${acceptModal.mode === 'form' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                Создать новый сайт
              </button>
              <button
                onClick={() => setAcceptModal({ mode: 'key' })}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all border ${acceptModal.mode === 'key' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                Принять по ключу
              </button>
            </div>

            {acceptModal.mode === 'form' && (
              <>
                <p className="text-muted-foreground text-sm mb-4">
                  Создайте новый сайт-квест. После создания данные интеграции автоматически скопируются — вставьте их в ИИ-генератор для создания квест-сайта.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Название сайта *</label>
                    <input
                      className="input-mystical"
                      placeholder="Например: Квест Лесная Тайна"
                      value={newSiteForm.name}
                      onChange={e => setNewSiteForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
                    <textarea
                      className="input-mystical resize-none"
                      rows={2}
                      placeholder="Краткое описание квеста"
                      value={newSiteForm.description}
                      onChange={e => setNewSiteForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-yellow-400/80 flex items-start gap-1.5">
                    <Icon name="Info" size={12} className="mt-0.5 flex-shrink-0" />
                    После создания данные интеграции скопируются в буфер. Вставьте их в ИИ-генератор — он создаст сайт, готовый к подключению.
                  </p>
                </div>
                <button
                  onClick={handleCreateNewSite}
                  className="btn-gold w-full flex items-center justify-center gap-2 mt-4">
                  <Icon name="Sparkles" size={16} />
                  Создать и скопировать данные интеграции
                </button>
              </>
            )}

            {acceptModal.mode === 'key' && (
              <>
                <p className="text-muted-foreground text-sm mb-4">
                  Введите ключ интеграции от уже созданного квест-сайта, чтобы подключить его к платформе.
                </p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ключ интеграции</label>
                  <input
                    className="input-mystical font-mono tracking-wide"
                    placeholder="MP-XXXX-XXXX-XXXX"
                    value={integrationKey}
                    onChange={e => setIntegrationKey(e.target.value)}
                  />
                </div>
                {keyError && (
                  <div className="text-red-400 text-sm mt-2 bg-red-500/10 px-3 py-2 rounded-lg">{keyError}</div>
                )}
                <button
                  onClick={handleAcceptByKey}
                  className="btn-gold w-full flex items-center justify-center gap-2 mt-4">
                  <Icon name="Link" size={16} />
                  Подключить сайт
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
