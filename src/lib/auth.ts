import { db, User } from './db';

const SESSION_KEY = 'mp_session';

export interface Session {
  userId: number;
  role: string;
  name: string;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_e) {
    // ignore
  }
  return null;
}

export function login(login: string, password: string): Session | null {
  const user = db.findUserByEmailOrPhone(login, password);
  if (!user) return null;
  const session: Session = { userId: user.id, role: user.role, name: user.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function register(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): { ok: boolean; error?: string; user?: User } {
  const users = db.getUsers();
  if (users.find(u => u.email === data.email)) {
    return { ok: false, error: 'Email уже используется' };
  }
  if (users.find(u => u.phone === data.phone)) {
    return { ok: false, error: 'Телефон уже зарегистрирован' };
  }
  const newUser = db.addUser({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password_hash: data.password,
    role: 'participant',
    is_verified: true,
  });
  return { ok: true, user: newUser as unknown as User };
}
