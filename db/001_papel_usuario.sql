-- EDUCACUBE — papel do usuário (aluno | professor). Rodar UMA vez no Neon.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role        text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_set_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IS NULL OR role IN ('aluno', 'professor'));
  END IF;
END $$;

-- Última trava: mesmo com bug na API, o banco recusa trocar o papel depois de definido.
CREATE OR REPLACE FUNCTION users_role_imutavel() RETURNS trigger AS $$
BEGIN
  IF OLD.role IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'users.role é imutável depois de definido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_role_imutavel ON users;
CREATE TRIGGER trg_users_role_imutavel
  BEFORE UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION users_role_imutavel();

-- Correção manual de quem escolheu errado (desliga o gatilho de propósito):
--   ALTER TABLE users DISABLE TRIGGER trg_users_role_imutavel;
--   UPDATE users SET role = 'professor' WHERE firebase_uid = '<uid>';
--   ALTER TABLE users ENABLE TRIGGER trg_users_role_imutavel;
