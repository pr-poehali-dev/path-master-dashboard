import { useState } from 'react';
import Icon from '@/components/ui/icon';
import StarField from './StarField';
import { login, register, registerOwner, isFirstRun } from '@/lib/auth';
import { sendVerifyCodeSms } from '@/lib/sms';

interface Props {
  onAuth: () => void;
}

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function AuthPage({ onAuth }: Props) {
  const firstRun = isFirstRun();
  const [mode, setMode] = useState<'login' | 'register'>(firstRun ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const [smsStep, setSmsStep] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [sending, setSending] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = () => {
    setError('');
    const sess = login(form.email || form.phone, form.password);
    if (!sess) { setError('Неверный логин или пароль'); return; }
    onAuth();
  };

  const handleRegister = async () => {
    setError('');
    if (!form.name || !form.phone || !form.password) { setError('Заполните все обязательные поля'); return; }
    if (form.password !== form.password2) { setError('Пароли не совпадают'); return; }
    setSending(true);
    const code = generateCode();
    setExpectedCode(code);
    await sendVerifyCodeSms(form.phone, code);
    setSending(false);
    setSmsStep(true);
  };

  const handleSmsConfirm = () => {
    if (smsCode.trim() !== expectedCode) { setError('Неверный код. Проверьте SMS и попробуйте снова'); return; }
    if (firstRun) {
      const res = registerOwner({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      if (!res.ok) { setError(res.error || 'Ошибка'); return; }
    } else {
      const res = register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      if (!res.ok) { setError(res.error || 'Ошибка'); return; }
    }
    const sess = login(form.phone || form.email, form.password);
    if (sess) onAuth();
  };

  const handleResend = async () => {
    setSending(true);
    const code = generateCode();
    setExpectedCode(code);
    await sendVerifyCodeSms(form.phone, code);
    setSending(false);
    setSmsCode('');
    setError('');
  };

  const isRegister = mode === 'register' || firstRun;
  const isLoginMode = mode === 'login' && !firstRun;

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
          {firstRun && (
            <div className="mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 flex items-start gap-2">
              <Icon name="Crown" size={16} className="text-gold mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-300">
                Первый запуск. Зарегистрируйте аккаунт Владельца — он получит полный доступ ко всем функциям платформы.
              </p>
            </div>
          )}

          {!smsStep ? (
            <>
              {!firstRun && (
                <div className="flex rounded-lg overflow-hidden border border-border mb-6">
                  <button onClick={() => { setMode('login'); setError(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === 'login' ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900' : 'text-muted-foreground hover:text-foreground'}`}>
                    Вход
                  </button>
                  <button onClick={() => { setMode('register'); setError(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === 'register' ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900' : 'text-muted-foreground hover:text-foreground'}`}>
                    Регистрация
                  </button>
                </div>
              )}

              {isRegister && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Имя *</label>
                  <input className="input-mystical" placeholder="Ваше имя" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">
                  {isLoginMode ? 'Email или телефон' : 'Email (необязательно)'}
                </label>
                <input className="input-mystical" placeholder={isLoginMode ? 'email или +7...' : 'email@example.ru'} value={form.email} onChange={e => set('email', e.target.value)} />
              </div>

              {isRegister && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Телефон * (для подтверждения по SMS)</label>
                  <input className="input-mystical" placeholder="+7 999 000 00 00" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
                <input className="input-mystical" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => isLoginMode && e.key === 'Enter' && handleLogin()} />
              </div>

              {isRegister && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Повторите пароль</label>
                  <input className="input-mystical" type="password" placeholder="••••••••" value={form.password2} onChange={e => set('password2', e.target.value)} />
                </div>
              )}

              {error && <div className="text-red-400 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}

              <button onClick={isLoginMode ? handleLogin : handleRegister} disabled={sending}
                className="btn-gold w-full justify-center flex items-center gap-2 disabled:opacity-60">
                {sending
                  ? <><Icon name="Loader" size={16} className="animate-spin" />Отправка SMS...</>
                  : isLoginMode
                    ? <><Icon name="LogIn" size={16} />Войти</>
                    : firstRun
                      ? <><Icon name="Crown" size={16} />Создать аккаунт владельца</>
                      : <><Icon name="UserPlus" size={16} />Зарегистрироваться</>
                }
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
                  <Icon name="Phone" size={28} className="text-green-400" />
                </div>
                <h3 className="font-bold text-lg">Подтверждение телефона</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Код отправлен на <span className="text-foreground font-medium">{form.phone}</span>
                </p>
              </div>
              <input className="input-mystical text-center text-2xl tracking-widest mb-4" placeholder="0000"
                maxLength={6} value={smsCode} onChange={e => setSmsCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSmsConfirm()} autoFocus />
              {error && <div className="text-red-400 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}
              <button onClick={handleSmsConfirm} className="btn-gold w-full flex items-center justify-center gap-2">
                <Icon name="CheckCircle" size={16} />
                Подтвердить
              </button>
              <div className="flex items-center justify-between mt-3">
                <button onClick={() => { setSmsStep(false); setError(''); }} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                  Назад
                </button>
                <button onClick={handleResend} disabled={sending} className="text-gold text-sm hover:text-yellow-400 transition-colors disabled:opacity-50">
                  {sending ? 'Отправка...' : 'Отправить повторно'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
