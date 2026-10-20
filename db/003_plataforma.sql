-- EDUCACUBE — turmas, matrículas, atividades, entregas e correções. Rodar DEPOIS de 001 e 002.
-- Donos são identificados por firebase_uid (text): independe do tipo de users.id.

CREATE TABLE IF NOT EXISTS turmas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_uid  text        NOT NULL,
  nome           text        NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 120),
  disciplina     text        NOT NULL CHECK (char_length(disciplina) BETWEEN 2 AND 120),
  ano_letivo     text,
  descricao      text,
  codigo         text        NOT NULL UNIQUE,
  arquivada      boolean     NOT NULL DEFAULT false,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS turmas_professor_idx ON turmas (professor_uid);

CREATE TABLE IF NOT EXISTS matriculas (
  turma_id   uuid        NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  aluno_uid  text        NOT NULL,
  entrou_em  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (turma_id, aluno_uid)
);
CREATE INDEX IF NOT EXISTS matriculas_aluno_idx ON matriculas (aluno_uid);

CREATE TABLE IF NOT EXISTS atividades (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id       uuid         NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  titulo         text         NOT NULL CHECK (char_length(titulo) BETWEEN 2 AND 160),
  instrucoes     text         NOT NULL DEFAULT '',
  tipo           text         NOT NULL DEFAULT 'atividade' CHECK (tipo IN ('atividade', 'avaliacao')),
  prazo          timestamptz,
  pontos         numeric(5,2) NOT NULL DEFAULT 10 CHECK (pontos > 0 AND pontos <= 100),
  publicada      boolean      NOT NULL DEFAULT true,
  criado_em      timestamptz  NOT NULL DEFAULT now(),
  atualizado_em  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atividades_turma_idx ON atividades (turma_id);

CREATE TABLE IF NOT EXISTS entregas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id   uuid         NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  aluno_uid      text         NOT NULL,
  resposta       text         NOT NULL CHECK (char_length(resposta) BETWEEN 1 AND 20000),
  enviada_em     timestamptz  NOT NULL DEFAULT now(),
  atualizada_em  timestamptz  NOT NULL DEFAULT now(),
  nota           numeric(5,2) CHECK (nota IS NULL OR nota >= 0),
  feedback       text,
  corrigida_em   timestamptz,
  corrigida_por  text,
  UNIQUE (atividade_id, aluno_uid)
);
CREATE INDEX IF NOT EXISTS entregas_aluno_idx ON entregas (aluno_uid);
