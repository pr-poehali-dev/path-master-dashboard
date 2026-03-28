import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { db, User } from '@/lib/db';
import { Session } from '@/lib/auth';
import InviteModal from './InviteModal';

interface Props { session: Session; }

type Invite = 'telegram' | 'vk' | 'sms';

export default function MembersManager({ session }: Props) {
  const [users, setUsers] = useState<(User & { password_hash?: string })[]>(() => db.getUsers() as (User & { password_hash?: string })[]);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [editUser, setEditUser] = useState<(User & { password_hash?: string }) | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '', password: '' });
  const [sites] = useState(() => db.getSites());
  const members = db.getMembers();

  const refresh = () => setUsers(db.getUsers() as (User & { password_hash?: string })[]);

  const startEdit = (u: User & { password_hash?: string }) => {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email || '', phone: u.phone || '', role: u.role, password: '' });
  };

  const handleSaveUser = () => {
    if (!editUser) return;
    const upd: Partial<User & { password_hash: string }> = { name: editForm.name, email: editForm.email, phone: editForm.phone, role: editForm.role as User['role'] };
    if (editForm.password) upd.password_hash = editForm.password;
    db.updateUser(editUser.id, upd);
    setEditUser(null);
    refresh();
  };

  const handleApproveMember = (siteId: number, userId: number) => {
    db.approveMember(siteId, userId);
    refresh();
  };

  const roleBadgeClass: Record<string, string> = {
    owner: 'badge-owner', admin: 'badge-admin', editor: 'badge-editor', participant: 'badge-participant',
  };
  const roleLabel: Record<string, string> = { owner: 'Владелец', admin: 'Администратор', editor: 'Редактор', participant: 'Участник' };

  const canEdit = session.role === 'owner' || session.role === 'admin';

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold font-cormorant text-gold">Участники</h2>
          <p className="text-muted-foreground text-sm mt-1">Управление ролями и доступами</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setInvite('telegram')} className="btn-purple flex items-center gap-1.5 text-sm">
              <Icon name="Send" size={14} />
              Telegram
            </button>
            <button onClick={() => setInvite('vk')} className="btn-blue flex items-center gap-1.5 text-sm">
              <Icon name="Users" size={14} />
              ВК
            </button>
            <button onClick={() => setInvite('sms')} className="flex items-center gap-1.5 text-sm bg-green-800/50 text-green-300 border border-green-600/40 font-semibold px-4 py-2.5 rounded-lg hover:scale-105 transition-all">
              <Icon name="MessageSquare" size={14} />
              SMS
            </button>
          </div>
        )}
      </div>

      <div className="card-mystical overflow-hidden">
        <table className="w-full table-mystical">
          <thead>
            <tr>
              <th className="text-left">Участник</th>
              <th className="text-left">Контакты</th>
              <th className="text-left">Роль</th>
              <th className="text-left">Статус</th>
              {canEdit && <th className="text-right">Действия</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const memberRecord = members.find(m => m.user_id === user.id);
              return (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-muted-foreground">{user.name[0]}</span>
                      </div>
                      <span className="font-medium text-sm">{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-role ${roleBadgeClass[user.role] || 'badge-participant'}`}>
                      {roleLabel[user.role] || user.role}
                    </span>
                  </td>
                  <td>
                    {memberRecord ? (
                      memberRecord.is_approved ? (
                        <span className="text-xs text-green-400 flex items-center gap-1"><Icon name="CheckCircle" size={12} />Активен</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-yellow-400">Ожидает</span>
                          {canEdit && (
                            <button onClick={() => handleApproveMember(memberRecord.site_id, user.id)} className="btn-gold-sm py-1 text-xs">
                              Одобрить
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">Владелец/Система</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="text-right">
                      <button onClick={() => startEdit(user)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Icon name="Pencil" size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditUser(null)}>
          <div className="modal-content">
            <h3 className="font-bold text-lg mb-4">Редактировать участника</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
                <input className="input-mystical" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input className="input-mystical" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Телефон</label>
                <input className="input-mystical" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              {(session.role === 'owner') && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Роль</label>
                  <select className="input-mystical" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="owner">Владелец</option>
                    <option value="admin">Администратор</option>
                    <option value="editor">Редактор</option>
                    <option value="participant">Участник</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Новый пароль (оставьте пустым, если не меняете)</label>
                <input className="input-mystical" type="password" placeholder="••••••••" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSaveUser} className="btn-gold flex-1 flex items-center justify-center gap-2">
                <Icon name="Save" size={14} />
                Сохранить
              </button>
              <button onClick={() => setEditUser(null)} className="btn-blue px-4">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {invite && <InviteModal type={invite} siteId={sites[0]?.id || 1} onClose={() => setInvite(null)} />}
    </div>
  );
}
