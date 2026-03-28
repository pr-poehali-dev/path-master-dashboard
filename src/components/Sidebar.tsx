import Icon from '@/components/ui/icon';
import { Session } from '@/lib/auth';

export type Section =
  | 'dashboard'
  | 'sites'
  | 'quest-editor'
  | 'members'
  | 'achievements'
  | 'cabinet';

interface NavItem {
  id: Section;
  label: string;
  icon: string;
  roles: string[];
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Панель управления', icon: 'LayoutDashboard', roles: ['owner', 'admin', 'editor', 'participant'] },
  { id: 'sites', label: 'Управление сайтами', icon: 'Globe', roles: ['owner', 'admin'] },
  { id: 'quest-editor', label: 'Редактор путей', icon: 'Map', roles: ['owner', 'admin', 'editor'] },
  { id: 'members', label: 'Участники', icon: 'Users', roles: ['owner', 'admin', 'editor'] },
  { id: 'achievements', label: 'Достижения', icon: 'Trophy', roles: ['owner', 'admin', 'editor', 'participant'] },
  { id: 'cabinet', label: 'Личный кабинет', icon: 'User', roles: ['owner', 'admin', 'editor', 'participant'] },
];

interface Props {
  session: Session;
  active: Section;
  onNav: (s: Section) => void;
  onLogout: () => void;
}

export default function Sidebar({ session, active, onNav, onLogout }: Props) {
  const items = NAV.filter(n => n.roles.includes(session.role));

  const roleBadge: Record<string, string> = {
    owner: 'Владелец',
    admin: 'Администратор',
    editor: 'Редактор',
    participant: 'Участник',
  };

  return (
    <aside className="bg-mystical-sidebar w-64 flex-shrink-0 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #d4af37, #8b5cf6)' }}>
            <Icon name="Compass" size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-gold font-montserrat leading-tight">Мастер путей</h1>
            <p className="text-xs text-muted-foreground">Управление квестами</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`nav-item w-full ${active === item.id ? 'active' : 'text-muted-foreground'}`}>
              <Icon name={item.icon} size={18} fallback="Circle" />
              <span className="font-montserrat">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Icon name="User" size={14} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{session.name}</p>
            <span className={`badge-role badge-${session.role}`}>{roleBadge[session.role] || session.role}</span>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-muted-foreground hover:text-red-400 text-sm transition-colors w-full">
          <Icon name="LogOut" size={14} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
