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
  } catch (_e) {
    // ignore parse error
  }
  return initDB();
}

function saveDB(db: Record<string, unknown[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function initDB(): Record<string, unknown[]> {
  const db: Record<string, unknown[]> = {
    users: [],
    sites: [],
    site_members: [],
    paths: [],
    levels: [],
    path_access: [],
    progress: [],
    messages: [],
    join_requests: [],
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

  addSite: (site: Omit<Site, 'id' | 'created_at' | 'integration_key'> & { integration_key?: string }) => {
    const d = getDB();
    const sites = d.sites as Site[];
    const id = Math.max(0, ...sites.map(s => s.id)) + 1;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const key = site.integration_key || `MP-${seg()}-${seg()}-${seg()}`;
    const { integration_key: _ik, ...rest } = site;
    void _ik;
    const newSite = { ...rest, id, integration_key: key, created_at: new Date().toISOString() };
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

export const INTEGRATION_TEMPLATE = (site: Site) => `МАСТЕР ПУТЕЙ — ДАННЫЕ ИНТЕГРАЦИИ ДЛЯ ИИ-ГЕНЕРАТОРА
=====================================================
Скопируй этот блок целиком и вставь в запрос ИИ-генератору сайтов.

ЗАДАЧА ДЛЯ ИИ:
Создай сайт-квест, который интегрируется с платформой "Мастер путей".
Название сайта: «${site.name}»

КЛЮЧ ИНТЕГРАЦИИ (обязательный параметр): ${site.integration_key}

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
1. На главной странице — форма регистрации участника с полями: Имя, Телефон, Email.
2. При отправке формы — POST-запрос на главную платформу с параметрами:
   { "name": "...", "phone": "...", "email": "...", "integration_key": "${site.integration_key}" }
3. Кнопка «Запросить участие в квесте» создаёт заявку с ключом: ${site.integration_key}
4. После регистрации показывать: «Ваша заявка принята! Владелец активирует доступ.»
5. Уникальная ссылка для участника имеет формат: /quest?key=${site.integration_key}&user=ID

СТИЛЬ:
- Основные цвета: тёмно-синий (#0a0f1e) + золотой (#d4af37) + фиолетовый акцент (#8b5cf6)
- Шрифты: Montserrat (заголовки), Cormorant (декоративный)
- Атмосфера: мистика, квест, приключение

ИДЕНТИФИКАТОР ПЛАТФОРМЫ: master-paths-v1
КЛЮЧ САЙТА: ${site.integration_key}
=====================================================`;

export function generateIntegrationKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [4, 4, 4].map(() =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return `MP-${segments.join('-')}`;
}