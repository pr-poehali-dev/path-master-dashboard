import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { db, Level, Path } from '@/lib/db';
import { Session } from '@/lib/auth';

interface Props {
  path: Path;
  session: Session;
  onBack: () => void;
}

export default function QuestPlay({ path, session, onBack }: Props) {
  const levels = db.getLevels().filter(l => l.path_id === path.id).sort((a, b) => a.sort_order - b.sort_order);
  const allProgress = db.getProgress().filter(p => p.user_id === session.userId && p.path_id === path.id);

  const firstIncomplete = levels.findIndex(l => !allProgress.find(p => p.level_id === l.id && p.completed));
  const [currentIdx, setCurrentIdx] = useState(Math.max(0, firstIncomplete === -1 ? levels.length : firstIncomplete));
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [showPassage, setShowPassage] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const currentLevel: Level | undefined = levels[currentIdx];
  const currentProgress = currentLevel ? allProgress.find(p => p.level_id === currentLevel.id) : undefined;
  const isCompleted = !!currentProgress?.completed;
  const allDone = levels.length > 0 && allProgress.filter(p => p.completed).length === levels.length;

  const handleAnswer = () => {
    if (!currentLevel || !answer.trim()) return;
    const correct = answer.trim().toLowerCase() === currentLevel.answer.toLowerCase();
    setAttempts(a => a + 1);
    if (correct) {
      const score = Math.max(10, 100 - (hintUsed ? currentLevel.hint_penalty : 0) - attempts * 5);
      db.saveProgress({ user_id: session.userId, path_id: path.id, level_id: currentLevel.id, completed: true, used_hint: hintUsed, attempts: attempts + 1, score, completed_at: new Date().toISOString() });
      setResult('correct');
      setTimeout(() => setShowPassage(true), 600);
    } else {
      setResult('wrong');
      setTimeout(() => setResult(null), 1500);
    }
  };

  const handleNext = () => {
    setCurrentIdx(i => i + 1);
    setAnswer('');
    setShowHint(false);
    setHintUsed(false);
    setResult(null);
    setShowPassage(false);
    setAttempts(0);
  };

  const handleShowHint = () => {
    setShowHint(true);
    setHintUsed(true);
  };

  const completedCount = allProgress.filter(p => p.completed).length;

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center max-w-2xl mx-auto animate-fade-in">
      <div className="w-full mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4">
          <Icon name="ArrowLeft" size={14} />
          Назад к кабинету
        </button>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-cormorant text-xl font-bold text-gold">{path.title}</h2>
          <span className="text-xs text-muted-foreground">{completedCount} / {levels.length} уровней</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-1.5 rounded-full transition-all"
            style={{ width: `${levels.length > 0 ? (completedCount / levels.length) * 100 : 0}%` }} />
        </div>
      </div>

      {allDone ? (
        <div className="card-mystical p-10 text-center glow-gold w-full">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="font-cormorant text-3xl font-bold text-gold mb-2">Путь завершён!</h3>
          <p className="text-muted-foreground">Вы успешно прошли все уровни пути</p>
          <p className="text-xl font-bold text-gold mt-4">
            {allProgress.reduce((s, p) => s + p.score, 0)} очков
          </p>
          <button onClick={onBack} className="btn-gold mt-6 flex items-center gap-2 mx-auto">
            <Icon name="ArrowLeft" size={16} />
            В кабинет
          </button>
        </div>
      ) : currentLevel ? (
        <div className="card-mystical p-6 w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Уровень {currentIdx + 1} из {levels.length}</span>
            {currentLevel.hint && !hintUsed && (
              <button onClick={handleShowHint} className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/30 px-2 py-1 rounded">
                <Icon name="Lightbulb" size={12} />
                Подсказка (-{currentLevel.hint_penalty}%)
              </button>
            )}
          </div>
          <h3 className="font-bold text-lg mb-4">{currentLevel.title}</h3>

          {currentLevel.riddle_type === 'image' && currentLevel.riddle_file_url && (
            <img src={currentLevel.riddle_file_url} alt="загадка" className="w-full rounded-lg mb-4 max-h-48 object-cover" />
          )}
          {currentLevel.riddle_type === 'video' && currentLevel.riddle_file_url && (
            <video src={currentLevel.riddle_file_url} controls className="w-full rounded-lg mb-4" />
          )}
          {currentLevel.riddle_type === 'audio' && currentLevel.riddle_file_url && (
            <audio src={currentLevel.riddle_file_url} controls className="w-full mb-4" />
          )}

          {currentLevel.riddle_content && (
            <div className="bg-muted/40 rounded-xl p-5 mb-5 border border-border/50">
              <p className="font-cormorant text-xl text-center italic leading-relaxed">{currentLevel.riddle_content}</p>
            </div>
          )}

          {showHint && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
              <Icon name="Lightbulb" size={14} className="text-purple-400 mt-0.5" />
              <p className="text-sm text-purple-300">{currentLevel.hint}</p>
            </div>
          )}

          {!isCompleted && !showPassage && (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  className="input-mystical flex-1"
                  placeholder="Введите ответ..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAnswer()}
                />
                <button onClick={handleAnswer} className="btn-gold px-5 flex items-center gap-1.5">
                  <Icon name="Send" size={14} />
                  Ответить
                </button>
              </div>
              {result === 'wrong' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm flex items-center gap-2">
                  <Icon name="X" size={14} />
                  Неверно. Попробуйте ещё раз
                </div>
              )}
              {result === 'correct' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-green-400 text-sm flex items-center gap-2">
                  <Icon name="CheckCircle" size={14} />
                  Верно!
                </div>
              )}
            </>
          )}

          {showPassage && (
            <div className="text-center mt-4">
              <button className="passage-btn" onClick={handleNext}>
                ⚜ Проход открыт ⚜
              </button>
              {currentIdx < levels.length - 1 && (
                <p className="text-muted-foreground text-xs mt-2">Нажмите, чтобы перейти к следующему уровню</p>
              )}
            </div>
          )}

          {isCompleted && !showPassage && (
            <div className="text-center">
              <p className="text-green-400 text-sm mb-3 flex items-center justify-center gap-1">
                <Icon name="CheckCircle" size={14} />
                Этот уровень уже пройден
              </p>
              {currentIdx < levels.length - 1 && (
                <button onClick={handleNext} className="btn-gold flex items-center gap-2 mx-auto">
                  Следующий уровень
                  <Icon name="ArrowRight" size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card-mystical p-8 text-center w-full">
          <p className="text-muted-foreground">Уровни не найдены</p>
        </div>
      )}
    </div>
  );
}
