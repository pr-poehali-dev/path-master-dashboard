export type Role = 'owner' | 'admin' | 'editor' | 'participant';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  is_verified: boolean;
  created_at: string;
}

export interface Site {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  integration_key: string;
  is_active: boolean;
  created_at: string;
}

export interface Path {
  id: number;
  site_id: number;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Level {
  id: number;
  path_id: number;
  title: string;
  sort_order: number;
  riddle_type: 'text' | 'image' | 'video' | 'audio';
  riddle_content: string;
  riddle_file_url?: string;
  hint?: string;
  answer: string;
  hint_penalty: number;
  created_at: string;
}

export interface PathAccess {
  id: number;
  path_id: number;
  user_id: number;
  access_token: string;
  is_active: boolean;
  requested_at: string;
}

export interface Progress {
  id: number;
  user_id: number;
  path_id: number;
  level_id: number;
  completed: boolean;
  used_hint: boolean;
  score: number;
  completed_at?: string;
}

export interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  site_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface JoinRequest {
  id: number;
  site_id: number;
  name: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// Local state store (localStorage-backed)
const STORAGE_KEY = 'master_paths_db';

function getDB(): Record<string, unknown[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initDB();
}

function saveDB(db: Record<string, unknown[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function initDB(): Record<string, unknown[]> {
  const db: Record<string, unknown[]> = {
    users: [
      { id: 1, name: 'Владелец', email: 'owner@master-path.ru', phone: '+79000000000', password_hash: 'demo1234', role: 'owner', is_verified: true, created_at: new Date().toISOString() },
      { id: 2, name: 'Александра', email: 'alex@example.ru', phone: '+79111111111', password_hash: 'pass123', role: 'participant', is_verified: true, created_at: new Date().toISOString() },
      { id: 3, name: 'Максим Ред.', email: 'maks@example.ru', phone: '+79222222222', password_hash: 'pass123', role: 'editor', is_verified: true, created_at: new Date().toISOString() },
    ],
    sites: [
      { id: 1, name: 'Главный квест-портал', description: 'Основная платформа для путей и загадок', owner_id: 1, integration_key: 'MASTER-KEY-DEMO-001', is_active: true, created_at: new Date().toISOString() },
    ],
    site_members: [
      { id: 1, site_id: 1, user_id: 2, role: 'participant', is_approved: true, invited_at: new Date().toISOString() },
      { id: 2, site_id: 1, user_id: 3, role: 'editor', is_approved: true, invited_at: new Date().toISOString() },
    ],
    paths: [
      { id: 1, site_id: 1, title: 'Путь Искателя', description: 'Первый путь для новых участников', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
      { id: 2, site_id: 1, title: 'Путь Мудреца', description: 'Путь для опытных участников', sort_order: 2, is_active: true, created_at: new Date().toISOString() },
    ],
    levels: [
      { id: 1, path_id: 1, title: 'Уровень 1: Начало пути', sort_order: 1, riddle_type: 'text', riddle_content: 'Я говорю без уст, и слышу без ушей, не имею тела, но оживаю на ветру. Что я?', hint: 'Подумай о природных явлениях', answer: 'эхо', hint_penalty: 10, created_at: new Date().toISOString() },
      { id: 2, path_id: 1, title: 'Уровень 2: Испытание тьмой', sort_order: 2, riddle_type: 'text', riddle_content: 'Чем больше берёшь — тем больше становится. Что это?', hint: 'Связано с физическим действием', answer: 'яма', hint_penalty: 10, created_at: new Date().toISOString() },
      { id: 3, path_id: 1, title: 'Уровень 3: Врата истины', sort_order: 3, riddle_type: 'text', riddle_content: 'Всегда впереди тебя, но не может быть увидено. Что это?', hint: 'Это то, что ещё не наступило', answer: 'будущее', hint_penalty: 15, created_at: new Date().toISOString() },
      { id: 4, path_id: 2, title: 'Уровень 1: Зеркало разума', sort_order: 1, riddle_type: 'text', riddle_content: 'Что есть у человека, что нельзя ни продать, ни купить, ни украсть?', hint: 'Это неотъемлемая часть каждого', answer: 'душа', hint_penalty: 20, created_at: new Date().toISOString() },
    ],
    path_access: [
      { id: 1, path_id: 1, user_id: 2, access_token: 'tok-alex-path1-demo', is_active: true, requested_at: new Date().toISOString() },
    ],
    progress: [
      { id: 1, user_id: 2, path_id: 1, level_id: 1, completed: true, used_hint: false, score: 100, completed_at: new Date().toISOString() },
      { id: 2, user_id: 2, path_id: 1, level_id: 2, completed: false, used_hint: false, score: 100 },
    ],
    messages: [],
    join_requests: [
      { id: 1, site_id: 1, name: 'Новый участник', phone: '+79333333333', email: 'new@test.ru', status: 'pending', created_at: new Date().toISOString() },
    ],
  };
  saveDB(db);
  return db;
}

// Generic CRUD helpers
export const db = {
  getUsers: (): User[] => (getDB().users || []) as User[],
  getSites: (): Site[] => (getDB().sites || []) as Site[],
  getPaths: (): Path[] => (getDB().paths || []) as Path[],
  getLevels: (): Level[] => (getDB().levels || []) as Level[],
  getMembers: () => (getDB().site_members || []) as { id: number; site_id: number; user_id: number; role: Role; is_approved: boolean; invited_at: string }[],
  getAccess: (): PathAccess[] => (getDB().path_access || []) as PathAccess[],
  getProgress: (): Progress[] => (getDB().progress || []) as Progress[],
  getMessages: (): Message[] => (getDB().messages || []) as Message[],
  getJoinRequests: (): JoinRequest[] => (getDB().join_requests || []) as JoinRequest[],

  addUser: (user: Omit<User, 'id' | 'created_at'> & { password_hash: string }) => {
    const d = getDB();
    const users = d.users as (User & { password_hash: string })[];
    const id = Math.max(0, ...users.map(u => u.id)) + 1;
    const newUser = { ...user, id, created_at: new Date().toISOString() };
    d.users = [...users, newUser];
    saveDB(d);
    return newUser;
  },

  updateUser: (id: number, data: Partial<User & { password_hash: string }>) => {
    const d = getDB();
    d.users = (d.users as User[]).map(u => u.id === id ? { ...u, ...data } : u);
    saveDB(d);
  },

  addSite: (site: Omit<Site, 'id' | 'created_at' | 'integration_key'>) => {
    const d = getDB();
    const sites = d.sites as Site[];
    const id = Math.max(0, ...sites.map(s => s.id)) + 1;
    const key = `KEY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const newSite = { ...site, id, integration_key: key, created_at: new Date().toISOString() };
    d.sites = [...sites, newSite];
    saveDB(d);
    return newSite;
  },

  updateSite: (id: number, data: Partial<Site>) => {
    const d = getDB();
    d.sites = (d.sites as Site[]).map(s => s.id === id ? { ...s, ...data } : s);
    saveDB(d);
  },

  addPath: (path: Omit<Path, 'id' | 'created_at'>) => {
    const d = getDB();
    const paths = d.paths as Path[];
    const id = Math.max(0, ...paths.map(p => p.id)) + 1;
    const newPath = { ...path, id, created_at: new Date().toISOString() };
    d.paths = [...paths, newPath];
    saveDB(d);
    return newPath;
  },

  updatePath: (id: number, data: Partial<Path>) => {
    const d = getDB();
    d.paths = (d.paths as Path[]).map(p => p.id === id ? { ...p, ...data } : p);
    saveDB(d);
  },

  addLevel: (level: Omit<Level, 'id' | 'created_at'>) => {
    const d = getDB();
    const levels = d.levels as Level[];
    const id = Math.max(0, ...levels.map(l => l.id)) + 1;
    const newLevel = { ...level, id, created_at: new Date().toISOString() };
    d.levels = [...levels, newLevel];
    saveDB(d);
    return newLevel;
  },

  updateLevel: (id: number, data: Partial<Level>) => {
    const d = getDB();
    d.levels = (d.levels as Level[]).map(l => l.id === id ? { ...l, ...data } : l);
    saveDB(d);
  },

  deleteLevel: (id: number) => {
    const d = getDB();
    d.levels = (d.levels as Level[]).filter(l => l.id !== id);
    saveDB(d);
  },

  deletePath: (id: number) => {
    const d = getDB();
    d.paths = (d.paths as Path[]).filter(p => p.id !== id);
    d.levels = (d.levels as Level[]).filter(l => l.path_id !== id);
    saveDB(d);
  },

  addMember: (member: { site_id: number; user_id: number; role: Role }) => {
    const d = getDB();
    const members = d.site_members as { id: number; site_id: number; user_id: number; role: Role; is_approved: boolean; invited_at: string }[];
    const exists = members.find(m => m.site_id === member.site_id && m.user_id === member.user_id);
    if (exists) return exists;
    const id = Math.max(0, ...members.map(m => m.id)) + 1;
    const newMember = { ...member, id, is_approved: false, invited_at: new Date().toISOString() };
    d.site_members = [...members, newMember];
    saveDB(d);
    return newMember;
  },

  approveMember: (site_id: number, user_id: number) => {
    const d = getDB();
    d.site_members = (d.site_members as { id: number; site_id: number; user_id: number; role: Role; is_approved: boolean; invited_at: string }[]).map(m =>
      m.site_id === site_id && m.user_id === user_id ? { ...m, is_approved: true } : m
    );
    saveDB(d);
  },

  requestAccess: (path_id: number, user_id: number) => {
    const d = getDB();
    const access = d.path_access as PathAccess[];
    const exists = access.find(a => a.path_id === path_id && a.user_id === user_id);
    if (exists) return exists;
    const id = Math.max(0, ...access.map(a => a.id)) + 1;
    const token = `tok-${user_id}-path${path_id}-${Date.now()}`;
    const newAccess = { id, path_id, user_id, access_token: token, is_active: false, requested_at: new Date().toISOString() };
    d.path_access = [...access, newAccess];
    saveDB(d);
    return newAccess;
  },

  activateAccess: (path_id: number, user_id: number) => {
    const d = getDB();
    d.path_access = (d.path_access as PathAccess[]).map(a =>
      a.path_id === path_id && a.user_id === user_id ? { ...a, is_active: true, activated_at: new Date().toISOString() } : a
    );
    saveDB(d);
  },

  saveProgress: (prog: Omit<Progress, 'id'>) => {
    const d = getDB();
    const progress = d.progress as Progress[];
    const existing = progress.find(p => p.user_id === prog.user_id && p.level_id === prog.level_id);
    if (existing) {
      d.progress = progress.map(p => p.user_id === prog.user_id && p.level_id === prog.level_id ? { ...p, ...prog } : p);
    } else {
      const id = Math.max(0, ...progress.map(p => p.id)) + 1;
      d.progress = [...progress, { ...prog, id }];
    }
    saveDB(d);
  },

  sendMessage: (msg: Omit<Message, 'id' | 'created_at' | 'is_read'>) => {
    const d = getDB();
    const messages = d.messages as Message[];
    const id = Math.max(0, ...messages.map(m => m.id), 0) + 1;
    const newMsg = { ...msg, id, is_read: false, created_at: new Date().toISOString() };
    d.messages = [...messages, newMsg];
    saveDB(d);
    return newMsg;
  },

  addJoinRequest: (req: Omit<JoinRequest, 'id' | 'status' | 'created_at'>) => {
    const d = getDB();
    const reqs = d.join_requests as JoinRequest[];
    const id = Math.max(0, ...reqs.map(r => r.id), 0) + 1;
    const newReq = { ...req, id, status: 'pending' as const, created_at: new Date().toISOString() };
    d.join_requests = [...reqs, newReq];
    saveDB(d);
    return newReq;
  },

  updateJoinRequest: (id: number, status: 'approved' | 'rejected') => {
    const d = getDB();
    d.join_requests = (d.join_requests as JoinRequest[]).map(r => r.id === id ? { ...r, status } : r);
    saveDB(d);
  },

  findUserByEmailOrPhone: (login: string, password: string): (User & { password_hash: string }) | null => {
    const users = getDB().users as (User & { password_hash: string })[];
    return users.find(u => (u.email === login || u.phone === login) && u.password_hash === password) || null;
  },

  deleteSite: (id: number) => {
    const d = getDB();
    d.sites = (d.sites as Site[]).filter(s => s.id !== id);
    saveDB(d);
  },
};

export const INTEGRATION_TEMPLATE = (site: Site) => `МАСТЕР ПУТЕЙ — ДАННЫЕ ИНТЕГРАЦИИ
=====================================
Платформа: Мастер путей
Сайт: ${site.name}
Ключ интеграции: ${site.integration_key}
Создан: ${new Date(site.created_at).toLocaleDateString('ru')}

ИНСТРУКЦИЯ ДЛЯ ИИ-ГЕНЕРАТОРА:
Создай сайт-квест, интегрированный с платформой "Мастер путей".
Ключ интеграции сайта: ${site.integration_key}
При запросе участника на квест — отправлять на платформу с ключом: ${site.integration_key}
Форма регистрации участников должна передавать: имя, телефон, email и ключ: ${site.integration_key}
Кнопка "Запросить участие" ведёт на: /join?key=${site.integration_key}
Используй синий+золотой стиль. Заголовок: "${site.name}"
=====================================`;
