import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { db, Path, Level } from '@/lib/db';

export default function QuestEditor() {
  const [sites] = useState(() => db.getSites());
  const [paths, setPaths] = useState<Path[]>(() => db.getPaths());
  const [levels, setLevels] = useState<Level[]>(() => db.getLevels());
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [selectedSite, setSelectedSite] = useState<number>(sites[0]?.id || 0);
  const [pathModal, setPathModal] = useState<'add' | 'edit' | null>(null);
  const [levelModal, setLevelModal] = useState<'add' | 'edit' | null>(null);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [pathForm, setPathForm] = useState({ title: '', description: '' });
  const [levelForm, setLevelForm] = useState({
    title: '', riddle_type: 'text' as Level['riddle_type'],
    riddle_content: '', riddle_file_url: '', hint: '', answer: '', hint_penalty: 10,
  });

  const refresh = () => {
    setPaths(db.getPaths());
    setLevels(db.getLevels());
  };

  const sitePaths = paths.filter(p => p.site_id === selectedSite);
  const pathLevels = selectedPath ? levels.filter(l => l.path_id === selectedPath.id).sort((a, b) => a.sort_order - b.sort_order) : [];

  const handleAddPath = () => {
    if (!pathForm.title) return;
    db.addPath({ site_id: selectedSite, title: pathForm.title, description: pathForm.description, sort_order: sitePaths.length + 1, is_active: true });
    setPathModal(null);
    setPathForm({ title: '', description: '' });
    refresh();
  };

  const handleEditPath = () => {
    if (!selectedPath) return;
    db.updatePath(selectedPath.id, { title: pathForm.title, description: pathForm.description });
    setPathModal(null);
    refresh();
    setSelectedPath(p => p ? { ...p, title: pathForm.title, description: pathForm.description } : null);
  };

  const handleDeletePath = (path: Path) => {
    if (!confirm(`Удалить путь "${path.title}" и все его уровни?`)) return;
    db.deletePath(path.id);
    if (selectedPath?.id === path.id) setSelectedPath(null);
    refresh();
  };

  const handleAddLevel = () => {
    if (!selectedPath || !levelForm.title || !levelForm.answer) return;
    db.addLevel({
      path_id: selectedPath.id,
      title: levelForm.title,
      sort_order: pathLevels.length + 1,
      riddle_type: levelForm.riddle_type,
      riddle_content: levelForm.riddle_content,
      riddle_file_url: levelForm.riddle_file_url,
      hint: levelForm.hint,
      answer: levelForm.answer.toLowerCase().trim(),
      hint_penalty: levelForm.hint_penalty,
    });
    setLevelModal(null);
    resetLevelForm();
    refresh();
  };

  const handleEditLevel = () => {
    if (!editingLevel) return;
    db.updateLevel(editingLevel.id, {
      title: levelForm.title,
      riddle_type: levelForm.riddle_type,
      riddle_content: levelForm.riddle_content,
      riddle_file_url: levelForm.riddle_file_url,
      hint: levelForm.hint,
      answer: levelForm.answer.toLowerCase().trim(),
      hint_penalty: levelForm.hint_penalty,
    });
    setLevelModal(null);
    setEditingLevel(null);
    resetLevelForm();
    refresh();
  };

  const handleDeleteLevel = (level: Level) => {
    if (!confirm(`Удалить уровень "${level.title}"?`)) return;
    db.deleteLevel(level.id);
    refresh();
  };

  const resetLevelForm = () => setLevelForm({ title: '', riddle_type: 'text', riddle_content: '', riddle_file_url: '', hint: '', answer: '', hint_penalty: 10 });

  const startEditLevel = (level: Level) => {
    setEditingLevel(level);
    setLevelForm({ title: level.title, riddle_type: level.riddle_type, riddle_content: level.riddle_content || '', riddle_file_url: level.riddle_file_url || '', hint: level.hint || '', answer: level.answer, hint_penalty: level.hint_penalty });
    setLevelModal('edit');
  };

  const riddleTypeLabel: Record<string, string> = { text: '📝 Текст', image: '🖼️ Картинка', video: '🎥 Видео', audio: '🎵 Аудио' };

  return (
    <div className="p-6 animate-fade-in h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-cormorant text-gold">Редактор путей</h2>
        <p className="text-muted-foreground text-sm mt-1">Создание квестов, уровней и загадок</p>
      </div>

      <div className="flex gap-4 mb-4">
        {sites.map(s => (
          <button key={s.id} onClick={() => setSelectedSite(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedSite === s.id ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-mystical p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-header flex items-center gap-2">
              <Icon name="Map" size={15} className="text-gold" />
              Пути ({sitePaths.length})
            </h3>
            <button onClick={() => { setPathForm({ title: '', description: '' }); setPathModal('add'); }} className="btn-gold-sm flex items-center gap-1">
              <Icon name="Plus" size={12} />
              Добавить путь
            </button>
          </div>
          <div className="space-y-2">
            {sitePaths.map(path => (
              <div
                key={path.id}
                onClick={() => setSelectedPath(path)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${selectedPath?.id === path.id ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-border/50 hover:border-border bg-muted/20'}`}>
                <div>
                  <p className="font-medium text-sm">{path.title}</p>
                  <p className="text-xs text-muted-foreground">{levels.filter(l => l.path_id === path.id).length} уровней</p>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { startEditLevel(path as unknown as Level); setPathForm({ title: path.title, description: path.description }); setPathModal('edit'); setSelectedPath(path); }}
                    className="p-1.5 text-muted-foreground hover:text-foreground">
                    <Icon name="Pencil" size={13} />
                  </button>
                  <button onClick={() => handleDeletePath(path)} className="p-1.5 text-muted-foreground hover:text-red-400">
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              </div>
            ))}
            {sitePaths.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">Нет путей. Создайте первый!</p>
            )}
          </div>
        </div>

        <div className="card-mystical p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-header flex items-center gap-2">
              <Icon name="Layers" size={15} className="text-gold" />
              {selectedPath ? `Уровни: ${selectedPath.title}` : 'Выберите путь'}
            </h3>
            {selectedPath && (
              <button onClick={() => { resetLevelForm(); setLevelModal('add'); }} className="btn-gold-sm flex items-center gap-1">
                <Icon name="Plus" size={12} />
                Добавить уровень
              </button>
            )}
          </div>
          {!selectedPath && (
            <p className="text-muted-foreground text-sm text-center py-8">Выберите путь слева</p>
          )}
          <div className="space-y-2">
            {pathLevels.map((level, idx) => (
              <div key={level.id} className="border border-border/50 rounded-lg p-3 bg-muted/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="text-gold font-bold text-sm min-w-6">{idx + 1}.</span>
                    <div>
                      <p className="font-medium text-sm">{level.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{riddleTypeLabel[level.riddle_type]}</span>
                        {level.hint && <span className="text-xs text-purple-400">💡 Подсказка</span>}
                        <span className="text-xs text-muted-foreground">Штраф: -{level.hint_penalty}%</span>
                      </div>
                      {level.riddle_content && (
                        <p className="text-xs text-muted-foreground/70 mt-1 italic truncate max-w-52">{level.riddle_content}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEditLevel(level)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      <Icon name="Pencil" size={13} />
                    </button>
                    <button onClick={() => handleDeleteLevel(level)} className="p-1.5 text-muted-foreground hover:text-red-400">
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {selectedPath && pathLevels.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">Нет уровней. Добавьте первый!</p>
            )}
          </div>
        </div>
      </div>

      {pathModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPathModal(null)}>
          <div className="modal-content">
            <h3 className="font-bold text-lg mb-4">{pathModal === 'add' ? 'Новый путь' : 'Редактировать путь'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Название пути *</label>
                <input className="input-mystical" placeholder="Путь Искателя..." value={pathForm.title} onChange={e => setPathForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
                <textarea className="input-mystical resize-none" rows={2} value={pathForm.description} onChange={e => setPathForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={pathModal === 'add' ? handleAddPath : handleEditPath} className="btn-gold flex-1 flex items-center justify-center gap-2">
                <Icon name="Save" size={14} />
                Сохранить
              </button>
              <button onClick={() => setPathModal(null)} className="btn-blue px-4">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {levelModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && (setLevelModal(null), setEditingLevel(null))}>
          <div className="modal-content max-w-lg">
            <h3 className="font-bold text-lg mb-4">{levelModal === 'add' ? 'Новый уровень' : 'Редактировать уровень'}</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Название уровня *</label>
                <input className="input-mystical" placeholder="Уровень 1: Начало пути" value={levelForm.title} onChange={e => setLevelForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Тип загадки</label>
                <div className="flex gap-2 flex-wrap">
                  {(['text', 'image', 'video', 'audio'] as const).map(t => (
                    <button key={t} onClick={() => setLevelForm(f => ({ ...f, riddle_type: t }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${levelForm.riddle_type === t ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-muted text-muted-foreground'}`}>
                      {riddleTypeLabel[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Текст загадки</label>
                <textarea className="input-mystical resize-none" rows={3} placeholder="Введите загадку..." value={levelForm.riddle_content} onChange={e => setLevelForm(f => ({ ...f, riddle_content: e.target.value }))} />
              </div>
              {levelForm.riddle_type !== 'text' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">URL файла ({levelForm.riddle_type})</label>
                  <input className="input-mystical" placeholder="https://..." value={levelForm.riddle_file_url} onChange={e => setLevelForm(f => ({ ...f, riddle_file_url: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Правильный ответ *</label>
                <input className="input-mystical" placeholder="слово-ответ" value={levelForm.answer} onChange={e => setLevelForm(f => ({ ...f, answer: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Подсказка (необязательно)</label>
                <input className="input-mystical" placeholder="Подскажите участникам..." value={levelForm.hint} onChange={e => setLevelForm(f => ({ ...f, hint: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Штраф за подсказку: -{levelForm.hint_penalty}%</label>
                <input type="range" min={5} max={50} step={5} value={levelForm.hint_penalty}
                  onChange={e => setLevelForm(f => ({ ...f, hint_penalty: +e.target.value }))}
                  className="w-full accent-yellow-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={levelModal === 'add' ? handleAddLevel : handleEditLevel} className="btn-gold flex-1 flex items-center justify-center gap-2">
                <Icon name="Save" size={14} />
                Сохранить
              </button>
              <button onClick={() => { setLevelModal(null); setEditingLevel(null); }} className="btn-blue px-4">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
