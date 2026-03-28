import { useState } from 'react';
import Icon from '@/components/ui/icon';
import StarField from './StarField';
import { login, register } from '@/lib/auth';

interface Props {
  onAuth: () => void;
}

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const [smsStep, setSmsStep] = useState(false);
  const [smsCode, setSmsCode] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = () => {
    setError('');
    const sess = login(form.email || form.phone, form.password);
    if (!sess) {
      setError('Неверный логин или пароль');
      return;
    }
    onAuth();
  };

  const handleRegister = () => {
    setError('');
    if (!form.name || !form.phone || !form.password) {
      setError('Заполните все обязательные поля');
      return;
    }
    if (form.password !== form.password2) {
      setError('Пароли не совпадают');
      return;
    }
    setSmsStep(true);
  };

  const handleSmsConfirm = () => {
    if (smsCode.length < 4) { setError('Введите код подтверждения'); return; }
    const res = register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
    if (!res.ok) { setError(res.error || 'Ошибка'); return; }
    const sess = login(form.phone, form.password);
    if (sess) onAuth();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <StarField />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #d4af37, #8b5cf6)' }}>
            <Icon name="Compass" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold font-cormorant shimmer-text">Мастер путей</h1>
          <p className="text-muted-foreground text-sm mt-1 font-montserrat">Платформа управления квестами</p>
        </div>

        <div className="card-mystical p-8 animate-scale-in">
          {!smsStep ? (
            <>
              <div className="flex rounded-lg overflow-hidden border border-border mb-6">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === 'login' ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900' : 'text-muted-foreground hover:text-foreground'}`}>
                  Вход
                </button>
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === 'register' ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900' : 'text-muted-foreground hover:text-foreground'}`}>
                  Регистрация
                </button>
              </div>

              {mode === 'register' && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Имя *</label>
                  <input className="input-mystical" placeholder="Ваше имя" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
              )}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">{mode === 'login' ? 'Email или телефон' : 'Email'}</label>
                <input className="input-mystical" placeholder={mode === 'login' ? 'email или +7...' : 'email@example.ru'} value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              {mode === 'register' && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Телефон * (для подтверждения)</label>
                  <input className="input-mystical" placeholder="+7 999 000 00 00" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              )}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
                <input className="input-mystical" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              {mode === 'register' && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Повторите пароль</label>
                  <input className="input-mystical" type="password" placeholder="••••••••" value={form.password2} onChange={e => set('password2', e.target.value)} />
                </div>
              )}
              {error && <div className="text-red-400 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}
              <button
                onClick={mode === 'login' ? handleLogin : handleRegister}
                className="btn-gold w-full justify-center flex items-center gap-2">
                <Icon name={mode === 'login' ? 'LogIn' : 'UserPlus'} size={16} />
                {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
              {mode === 'login' && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Демо: <span className="text-gold">owner@master-path.ru / demo1234</span>
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <Icon name="Phone" size={32} className="text-gold mx-auto mb-2" />
                <h3 className="font-bold text-lg">Подтверждение телефона</h3>
                <p className="text-muted-foreground text-sm mt-1">Введите код, отправленный на {form.phone}</p>
                <p className="text-xs text-yellow-500/70 mt-1">(Демо: введите любые 4+ цифры)</p>
              </div>
              <input className="input-mystical text-center text-2xl tracking-widest mb-4" placeholder="0000" maxLength={6} value={smsCode} onChange={e => setSmsCode(e.target.value)} />
              {error && <div className="text-red-400 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}
              <button onClick={handleSmsConfirm} className="btn-gold w-full flex items-center justify-center gap-2">
                <Icon name="CheckCircle" size={16} />
                Подтвердить
              </button>
              <button onClick={() => setSmsStep(false)} className="w-full mt-2 text-muted-foreground text-sm hover:text-foreground transition-colors">
                Назад
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
