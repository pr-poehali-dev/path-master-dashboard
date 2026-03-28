import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { db, Site, INTEGRATION_TEMPLATE } from '@/lib/db';
import { Session } from '@/lib/auth';

interface Props { session: Session; }

export default function SitesManager({ session }: Props) {
  const [sites, setSites] = useState<Site[]>(() => db.getSites());
  const [editing, setEditing] = useState<Site | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [copied, setCopied] = useState<number | null>(null);

  const refresh = () => setSites(db.getSites());
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.name) return;
    db.addSite({ name: form.name, description: form.description, owner_id: session.userId, is_active: true });
    setAdding(false);
    setForm({ name: '', description: '' });
    refresh();
  };

  const handleEdit = () => {
    if (!editing) return;
    db.updateSite(editing.id, { name: form.name, description: form.description });
    setEditing(null);
    refresh();
  };

  const handleCopyIntegration = (site: Site) => {
    const text = INTEGRATION_TEMPLATE(site);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(site.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const startEdit = (site: Site) => {
    setEditing(site);
    setForm({ name: site.name, description: site.description });
  };

  const handleToggle = (site: Site) => {
    db.updateSite(site.id, { is_active: !site.is_active });
    refresh();
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold font-cormorant text-gold">Управление сайтами</h2>
          <p className="text-muted-foreground text-sm mt-1">Добавление и настройка квест-сайтов</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-gold flex items-center gap-2">
          <Icon name="Plus" size={16} />
          Добавить сайт
        </button>
      </div>

      <div className="grid gap-4">
        {sites.map(site => {
          const paths = db.getPaths().filter(p => p.site_id === site.id);
          return (
            <div key={site.id} className="card-mystical p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name="Globe" size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base">{site.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${site.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {site.is_active ? 'Активен' : 'Выкл'}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{site.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Icon name="Key" size={12} className="text-gold" />
                      <code className="text-xs text-gold/80 bg-muted/50 px-2 py-0.5 rounded">{site.integration_key}</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{paths.length} путей</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopyIntegration(site)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold transition-all ${copied === site.id ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25'}`}>
                    <Icon name={copied === site.id ? 'CheckCircle' : 'Copy'} size={12} />
                    {copied === site.id ? 'Скопировано!' : 'Скопировать данные интеграции'}
                  </button>
                  <button onClick={() => startEdit(site)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button onClick={() => handleToggle(site)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name={site.is_active ? 'EyeOff' : 'Eye'} size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(adding || editing) && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setAdding(false), setEditing(null))}>
          <div className="modal-content">
            <h3 className="font-bold text-lg mb-4">{adding ? 'Новый сайт' : 'Редактировать сайт'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Название сайта</label>
                <input className="input-mystical" placeholder="Например: Квест Лесная Тайна" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
                <textarea className="input-mystical resize-none" rows={3} placeholder="Описание квест-платформы" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={adding ? handleAdd : handleEdit} className="btn-gold flex-1 flex items-center justify-center gap-2">
                <Icon name="Save" size={14} />
                Сохранить
              </button>
              <button onClick={() => { setAdding(false); setEditing(null); }} className="btn-blue px-4">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
