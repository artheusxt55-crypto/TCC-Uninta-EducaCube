-- EDUCACUBE — biblioteca da AURA (Meus Estudos, Provas e Exercícios, Materiais) e configurações.
-- Rodar UMA vez no Neon, DEPOIS de 001–004. Só adiciona tabelas; não altera nada existente.
-- titulo, conteudo e dados ficam CIFRADOS (AES-256-GCM, DADOS_CHAVE_CRIPTO), presos ao UID.
-- Apagar a conta (linha em users) apaga tudo junto (ON DELETE CASCADE).

CREATE TABLE IF NOT EXISTS aura_itens (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  uid           text        NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
  tipo          text        NOT NULL CHECK (tipo IN ('estudo', 'prova', 'material')),
  titulo        text        NOT NULL,   -- cifrado
  conteudo      text        NOT NULL,   -- cifrado
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS aura_itens_uid_tipo_idx ON aura_itens (uid, tipo, criado_em DESC);

CREATE TABLE IF NOT EXISTS aura_config (
  uid           text        PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
  dados         text,                   -- cifrado: JSON com tom, nível, tamanho e instruções
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
