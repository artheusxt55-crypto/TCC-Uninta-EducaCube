-- EDUCACUBE — memória da AURA (preferências do usuário + resumo das conversas anteriores).
-- Rodar UMA vez no Neon, DEPOIS de 001, 002 e 003. Só adiciona uma tabela; não altera nada existente.
--
-- perfil e resumo ficam CIFRADOS (AES-256-GCM, mesma chave DADOS_CHAVE_CRIPTO dos outros dados pessoais).
-- Apagar a conta (linha em users) apaga a memória junto (ON DELETE CASCADE).

CREATE TABLE IF NOT EXISTS aura_memoria (
  uid              text        PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
  perfil           text,                                 -- cifrado: lista JSON de preferências/fatos estáveis
  resumo           text,                                 -- cifrado: resumo curto das conversas anteriores
  ativa            boolean     NOT NULL DEFAULT true,    -- false = a AURA não aprende nem usa a memória
  versao           integer     NOT NULL DEFAULT 0,       -- evita duas atualizações simultâneas se sobrescreverem
  ultima_tentativa timestamptz,                          -- limita a frequência de atualizações por usuário
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now()
);
