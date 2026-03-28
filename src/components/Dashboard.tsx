import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { db } from '@/lib/db';
import { Session } from '@/lib/auth';
import { Section } from './Sidebar';
import InviteModal from './InviteModal';

interface Props {
  session: Session;
  onNav: (s: Section) => void;
}

export default function Dashboard({ session, onNav }: Props) {
  const [invite, setInvite] = useState<'telegram' | 'vk' | 'sms' | null>(null);
  const sites = db.getSites();
  const paths = db.getPaths();
  const users = db.getUsers();
  const progress = db.getProgress();
  const joinRequests = db.getJoinRequests().filter(r => r.status === 'pending');

  const completedLevels = progress.filter(p => p.completed).length;
  const activePaths = paths.filter(p => p.is_active).length;

  const handleAcceptSite = () => {
    const siteName = prompt('Название нового сайта-квеста:');
    if (!siteName) return;
    db.addSite({ name: siteName, description: 'Новый квест-сайт', owner_id: session.userId, is_active: true });
    window.location.reload();
  };

  const handleApproveRequest = (id: number) => {
    db.updateJoinRequest(id, 'approved');
    const req = db.getJoinRequests().find(r => r.id === id);
    if (req && req.site_id) {
      const users2 = db.getUsers();
      const u = users2.find(u => u.phone === req.phone || u.email === req.email);
      if (u) db.approveMember(req.site_id, u.id);
    }
    window.location.reload();
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold font-cormorant text-gold">Панель управления</h2>
          <p className="text-muted-foreground text-sm mt-1">Добро пожаловать, {session.name}</p>
        </div>
        {(session.role === 'owner' || session.role === 'admin') && (
          <button onClick={handleAcceptSite} className="btn-gold flex items-center gap-2">
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
            {sites.map(site => {
              const sitePaths = paths.filter(p => p.site_id === site.id);
              return (
                <div key={site.id} className="border border-border/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{site.name}</span>
                    <span className="text-xs text-muted-foreground">{sitePaths.length} путей</span>
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
                  <div key={req.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.phone || req.email}</p>
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
            <button onClick={() => setInvite('telegram')} className="btn-purple flex items-center gap-2">
              <Icon name="Send" size={14} />
              Telegram
            </button>
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
    </div>
  );
}
