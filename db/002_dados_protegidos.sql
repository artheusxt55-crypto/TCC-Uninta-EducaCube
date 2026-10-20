-- EDUCACUBE — dados pessoais cifrados. Rodar UMA vez, DEPOIS do 001.
ALTER TABLE users ALTER COLUMN email        TYPE text;
ALTER TABLE users ALTER COLUMN display_name TYPE text;
ALTER TABLE users ALTER COLUMN photo_url    TYPE text;

-- Índice cego (HMAC do e-mail): unicidade e busca sem guardar o e-mail em texto puro.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_hash_key
  ON users (email_hash) WHERE email_hash IS NOT NULL;

-- Um eventual UNIQUE em `email` perde a utilidade (cada cifra é diferente). A unicidade passa a
-- vir de firebase_uid + email_hash. Linhas antigas (texto puro) são cifradas no próximo login.
