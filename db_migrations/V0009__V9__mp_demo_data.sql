INSERT INTO mp_users (name, email, phone, password_hash, role, is_verified) VALUES ('Владелец', 'owner@master-path.ru', '+79000000000', 'demo1234', 'owner', TRUE) ON CONFLICT (email) DO NOTHING;

INSERT INTO mp_users (name, email, phone, password_hash, role, is_verified) VALUES ('Александра', 'alex@example.ru', '+79111111111', 'pass123', 'participant', TRUE) ON CONFLICT (email) DO NOTHING;

INSERT INTO mp_sites (name, description, owner_id, integration_key) SELECT 'Главный квест-портал', 'Основная платформа для путей и загадок', u.id, 'MASTER-KEY-DEMO-001' FROM mp_users u WHERE u.email = 'owner@master-path.ru' ON CONFLICT (integration_key) DO NOTHING;

INSERT INTO mp_paths (site_id, title, description, sort_order) SELECT s.id, 'Путь Искателя', 'Первый путь для новых участников', 1 FROM mp_sites s WHERE s.integration_key = 'MASTER-KEY-DEMO-001';

INSERT INTO mp_paths (site_id, title, description, sort_order) SELECT s.id, 'Путь Мудреца', 'Путь для опытных участников', 2 FROM mp_sites s WHERE s.integration_key = 'MASTER-KEY-DEMO-001';