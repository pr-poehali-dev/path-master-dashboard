import Icon from '@/components/ui/icon';
import { db } from '@/lib/db';

export default function Achievements() {
  const users = db.getUsers();
  const paths = db.getPaths();
  const levels = db.getLevels();
  const progress = db.getProgress();

  const leaderboard = users.map(user => {
    const userProgress = progress.filter(p => p.user_id === user.id);
    const completed = userProgress.filter(p => p.completed);
    const totalScore = completed.reduce((sum, p) => sum + p.score, 0);
    const usedHints = userProgress.filter(p => p.used_hint).length;
    const pathsCompleted = new Set(completed.map(p => p.path_id)).size;
    return { user, completed: completed.length, totalScore, usedHints, pathsCompleted };
  }).sort((a, b) => b.totalScore - a.totalScore || b.completed - a.completed);

  const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
  const medalIcons = ['Trophy', 'Medal', 'Award'];

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-cormorant text-gold">Таблица достижений</h2>
        <p className="text-muted-foreground text-sm mt-1">Прогресс всех участников в реальном времени</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {leaderboard.slice(0, 3).map((entry, idx) => (
          <div key={entry.user.id} className={`card-mystical p-5 text-center ${idx === 0 ? 'glow-gold' : ''}`}>
            <Icon name={medalIcons[idx]} size={32} className={`${medalColors[idx]} mx-auto mb-2`} fallback="Trophy" />
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <span className="font-bold text-lg">{entry.user.name[0]}</span>
            </div>
            <p className="font-bold text-sm">{entry.user.name}</p>
            <p className={`text-2xl font-bold mt-1 ${idx === 0 ? 'text-gold' : 'text-muted-foreground'}`}>{entry.totalScore}</p>
            <p className="text-xs text-muted-foreground">очков</p>
            <div className="mt-3 flex justify-center gap-3 text-xs text-muted-foreground">
              <span>✅ {entry.completed}</span>
              <span>💡 {entry.usedHints}</span>
              <span>🗺️ {entry.pathsCompleted}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card-mystical overflow-hidden">
        <table className="w-full table-mystical">
          <thead>
            <tr>
              <th className="text-left w-10">#</th>
              <th className="text-left">Участник</th>
              <th className="text-center">Очки</th>
              <th className="text-center">Уровней пройдено</th>
              <th className="text-center">Путей завершено</th>
              <th className="text-center">Подсказок</th>
              <th className="text-left">Прогресс</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => {
              const totalLevels = levels.length;
              const pct = totalLevels > 0 ? Math.round((entry.completed / totalLevels) * 100) : 0;
              return (
                <tr key={entry.user.id}>
                  <td>
                    {idx < 3 ? (
                      <Icon name={medalIcons[idx]} size={16} className={medalColors[idx]} fallback="Circle" />
                    ) : (
                      <span className="text-muted-foreground">{idx + 1}</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold">{entry.user.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.user.name}</p>
                        <span className={`badge-role badge-${entry.user.role} text-xs`}>{entry.user.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="text-gold font-bold">{entry.totalScore}</span>
                  </td>
                  <td className="text-center text-sm">{entry.completed}</td>
                  <td className="text-center text-sm">{entry.pathsCompleted}</td>
                  <td className="text-center text-sm">
                    {entry.usedHints > 0 ? <span className="text-yellow-400">💡 {entry.usedHints}</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {paths.map(path => {
          const pathLevels = levels.filter(l => l.path_id === path.id);
          const pathProgress = progress.filter(p => p.path_id === path.id && p.completed);
          const participantsStarted = new Set(pathProgress.map(p => p.user_id)).size;
          return (
            <div key={path.id} className="card-mystical p-4">
              <Icon name="Map" size={18} className="text-purple-400 mb-2" />
              <p className="font-semibold text-sm">{path.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{pathLevels.length} уровней</p>
              <p className="text-xs text-gold mt-1">{participantsStarted} участников</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
