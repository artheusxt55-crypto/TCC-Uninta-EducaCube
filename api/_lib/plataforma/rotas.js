import { randomInt } from "node:crypto";
import { sql } from "../neon.js";
import { ErroApi } from "../seguranca.js";
import { decifrar } from "../cripto.js";
import { uuid, texto, numero, data, booleano, opcao, statusDaEntrega } from "./validacao.js";

/* REGRAS DA PLATAFORMA (turmas, atividades, entregas).
   Cada consulta já carrega a condição de POSSE:
     professor -> turmas.professor_uid = ele
     aluno     -> matriculas.aluno_uid = ele
   Recurso de outra pessoa responde 404 (não confirma que existe). */

const naoEncontrado = (o = "Recurso") => new ErroApi(404, "NOT_FOUND", `${o} não encontrado.`);

const abrir = (valor, contexto) => {
  try {
    return decifrar(valor, contexto);
  } catch {
    return null;
  }
};
const nomeSeguro = (v) => abrir(v, "users.display_name");
const emailSeguro = (v) => abrir(v, "users.email");

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I
const gerarCodigo = () => Array.from({ length: 6 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");

/* =============== PROFESSOR — turmas =============== */

async function turmaDoProfessor(turmaId, uid) {
  const r = await sql`
    SELECT id, nome, disciplina, ano_letivo, descricao, codigo, arquivada, criado_em
    FROM turmas WHERE id = ${turmaId} AND professor_uid = ${uid} LIMIT 1`;
  if (!r.length) throw naoEncontrado("Turma");
  return r[0];
}

async function atividadeDoProfessor(atividadeId, uid) {
  const r = await sql`
    SELECT a.id, a.turma_id, a.titulo, a.instrucoes, a.tipo, a.prazo, a.pontos, a.publicada
    FROM atividades a JOIN turmas t ON t.id = a.turma_id
    WHERE a.id = ${atividadeId} AND t.professor_uid = ${uid} LIMIT 1`;
  if (!r.length) throw naoEncontrado("Atividade");
  return r[0];
}

const resumoProfessor = async ({ uid }) => {
  const r = await sql`
    SELECT
      (SELECT COUNT(*) FROM turmas WHERE professor_uid = ${uid} AND NOT arquivada)::int AS turmas,
      (SELECT COUNT(DISTINCT m.aluno_uid) FROM matriculas m JOIN turmas t ON t.id = m.turma_id
        WHERE t.professor_uid = ${uid} AND NOT t.arquivada)::int AS alunos,
      (SELECT COUNT(*) FROM atividades a JOIN turmas t ON t.id = a.turma_id
        WHERE t.professor_uid = ${uid} AND NOT t.arquivada)::int AS atividades,
      (SELECT COUNT(*) FROM entregas e JOIN atividades a ON a.id = e.atividade_id
        JOIN turmas t ON t.id = a.turma_id
        WHERE t.professor_uid = ${uid} AND e.corrigida_em IS NULL)::int AS a_corrigir`;
  return { dados: { resumo: r[0] } };
};

const listarTurmasProfessor = async ({ uid }) => {
  const turmas = await sql`
    SELECT t.id, t.nome, t.disciplina, t.ano_letivo, t.descricao, t.codigo, t.arquivada, t.criado_em,
      (SELECT COUNT(*) FROM matriculas m WHERE m.turma_id = t.id)::int AS total_alunos,
      (SELECT COUNT(*) FROM atividades a WHERE a.turma_id = t.id)::int AS total_atividades
    FROM turmas t WHERE t.professor_uid = ${uid}
    ORDER BY t.arquivada, t.criado_em DESC`;
  return { dados: { turmas } };
};

const criarTurma = async ({ uid, corpo }) => {
  const nome = texto(corpo.nome, "Nome", { min: 2, max: 120, obrigatorio: true });
  const disciplina = texto(corpo.disciplina, "Disciplina", { min: 2, max: 120, obrigatorio: true });
  const anoLetivo = texto(corpo.anoLetivo, "Ano letivo", { max: 20 }) || null;
  const descricao = texto(corpo.descricao, "Descrição", { max: 1000 }) || null;

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    try {
      const r = await sql`
        INSERT INTO turmas (professor_uid, nome, disciplina, ano_letivo, descricao, codigo)
        VALUES (${uid}, ${nome}, ${disciplina}, ${anoLetivo}, ${descricao}, ${gerarCodigo()})
        RETURNING id, nome, disciplina, ano_letivo, descricao, codigo, arquivada, criado_em`;
      return { status: 201, dados: { turma: { ...r[0], total_alunos: 0, total_atividades: 0 } } };
    } catch (erro) {
      if (erro?.code !== "23505") throw erro; // só repete se o código colidiu
    }
  }
  throw new ErroApi(500, "CODE_GENERATION_FAILED", "Não foi possível gerar o código da turma.");
};

const obterTurmaProfessor = async ({ uid, params }) => ({
  dados: { turma: await turmaDoProfessor(uuid(params.id), uid) },
});

const atualizarTurma = async ({ uid, params, corpo }) => {
  const id = uuid(params.id);
  const nome = texto(corpo.nome, "Nome", { min: 2, max: 120 });
  const disciplina = texto(corpo.disciplina, "Disciplina", { min: 2, max: 120 });
  const anoLetivo = texto(corpo.anoLetivo, "Ano letivo", { max: 20 });
  const descricao = texto(corpo.descricao, "Descrição", { max: 1000 });
  const arquivada = booleano(corpo.arquivada, "Arquivada");

  const r = await sql`
    UPDATE turmas SET
      nome = COALESCE(${nome ?? null}, nome),
      disciplina = COALESCE(${disciplina ?? null}, disciplina),
      ano_letivo = COALESCE(${anoLetivo ?? null}, ano_letivo),
      descricao = COALESCE(${descricao ?? null}, descricao),
      arquivada = COALESCE(${arquivada ?? null}::boolean, arquivada),
      atualizado_em = now()
    WHERE id = ${id} AND professor_uid = ${uid}
    RETURNING id, nome, disciplina, ano_letivo, descricao, codigo, arquivada, criado_em`;
  if (!r.length) throw naoEncontrado("Turma");
  return { dados: { turma: r[0] } };
};

const excluirTurma = async ({ uid, params }) => {
  const r = await sql`
    DELETE FROM turmas WHERE id = ${uuid(params.id)} AND professor_uid = ${uid} RETURNING id`;
  if (!r.length) throw naoEncontrado("Turma");
  return { dados: { removida: true } };
};

const alunosDaTurma = async ({ uid, params }) => {
  const id = uuid(params.id);
  await turmaDoProfessor(id, uid);

  const linhas = await sql`
    SELECT m.aluno_uid, m.entrou_em, u.display_name, u.email
    FROM matriculas m LEFT JOIN users u ON u.firebase_uid = m.aluno_uid
    WHERE m.turma_id = ${id} ORDER BY m.entrou_em`;

  return {
    dados: {
      alunos: linhas.map((l) => ({
        uid: l.aluno_uid,
        nome: nomeSeguro(l.display_name),
        email: emailSeguro(l.email),
        entrouEm: l.entrou_em,
      })),
    },
  };
};

const removerAluno = async ({ uid, params }) => {
  const id = uuid(params.id);
  const alunoUid = texto(params.alunoUid, "Aluno", { min: 1, max: 128, obrigatorio: true });
  await turmaDoProfessor(id, uid);
  const r = await sql`
    DELETE FROM matriculas WHERE turma_id = ${id} AND aluno_uid = ${alunoUid} RETURNING aluno_uid`;
  if (!r.length) throw naoEncontrado("Aluno");
  return { dados: { removido: true } };
};

/* =============== PROFESSOR — atividades =============== */

const listarAtividadesDaTurma = async ({ uid, params }) => {
  const id = uuid(params.id);
  await turmaDoProfessor(id, uid);

  const atividades = await sql`
    SELECT a.id, a.titulo, a.instrucoes, a.tipo, a.prazo, a.pontos, a.publicada, a.criado_em,
      (SELECT COUNT(*) FROM entregas e WHERE e.atividade_id = a.id)::int AS entregas,
      (SELECT COUNT(*) FROM entregas e WHERE e.atividade_id = a.id AND e.corrigida_em IS NOT NULL)::int AS corrigidas,
      (SELECT COUNT(*) FROM matriculas m WHERE m.turma_id = a.turma_id)::int AS total_alunos
    FROM atividades a WHERE a.turma_id = ${id}
    ORDER BY a.prazo NULLS LAST, a.criado_em DESC`;
  return { dados: { atividades } };
};

const criarAtividade = async ({ uid, params, corpo }) => {
  const turmaId = uuid(params.id);

  const titulo = texto(corpo.titulo, "Título", { min: 2, max: 160, obrigatorio: true });
  const instrucoes = texto(corpo.instrucoes, "Instruções", { max: 10000 }) ?? "";
  const tipo = opcao(corpo.tipo, "Tipo", ["atividade", "avaliacao"], "atividade");
  const prazo = data(corpo.prazo, "Prazo") ?? null;
  const pontos = numero(corpo.pontos, "Pontos", { min: 0.01, max: 100 }) ?? 10;
  const publicada = booleano(corpo.publicada, "Publicada") ?? true;

  await turmaDoProfessor(turmaId, uid);

  const r = await sql`
    INSERT INTO atividades (turma_id, titulo, instrucoes, tipo, prazo, pontos, publicada)
    VALUES (${turmaId}, ${titulo}, ${instrucoes}, ${tipo}, ${prazo}, ${pontos}, ${publicada})
    RETURNING id, turma_id, titulo, instrucoes, tipo, prazo, pontos, publicada, criado_em`;
  return { status: 201, dados: { atividade: r[0] } };
};

const atualizarAtividade = async ({ uid, params, corpo }) => {
  const id = uuid(params.id);
  await atividadeDoProfessor(id, uid);

  const titulo = texto(corpo.titulo, "Título", { min: 2, max: 160 });
  const instrucoes = texto(corpo.instrucoes, "Instruções", { max: 10000 });
  const tipo = opcao(corpo.tipo, "Tipo", ["atividade", "avaliacao"], undefined);
  const prazo = data(corpo.prazo, "Prazo"); // null limpa o prazo
  const pontos = numero(corpo.pontos, "Pontos", { min: 0.01, max: 100 });
  const publicada = booleano(corpo.publicada, "Publicada");
  const mudaPrazo = prazo !== undefined;

  const r = await sql`
    UPDATE atividades SET
      titulo = COALESCE(${titulo ?? null}, titulo),
      instrucoes = COALESCE(${instrucoes ?? null}, instrucoes),
      tipo = COALESCE(${tipo ?? null}, tipo),
      prazo = CASE WHEN ${mudaPrazo}::boolean THEN ${prazo ?? null}::timestamptz ELSE prazo END,
      pontos = COALESCE(${pontos ?? null}::numeric, pontos),
      publicada = COALESCE(${publicada ?? null}::boolean, publicada),
      atualizado_em = now()
    WHERE id = ${id}
      AND turma_id IN (SELECT id FROM turmas WHERE professor_uid = ${uid})
    RETURNING id, turma_id, titulo, instrucoes, tipo, prazo, pontos, publicada`;
  if (!r.length) throw naoEncontrado("Atividade");
  return { dados: { atividade: r[0] } };
};

const excluirAtividade = async ({ uid, params }) => {
  const id = uuid(params.id);
  await atividadeDoProfessor(id, uid);
  await sql`
    DELETE FROM atividades
    WHERE id = ${id} AND turma_id IN (SELECT id FROM turmas WHERE professor_uid = ${uid})`;
  return { dados: { removida: true } };
};

const entregasDaAtividade = async ({ uid, params }) => {
  const id = uuid(params.id);
  const atividade = await atividadeDoProfessor(id, uid);

  const linhas = await sql`
    SELECT m.aluno_uid, u.display_name, u.email,
           e.id AS entrega_id, e.resposta, e.enviada_em, e.nota, e.feedback, e.corrigida_em
    FROM matriculas m
    LEFT JOIN users u ON u.firebase_uid = m.aluno_uid
    LEFT JOIN entregas e ON e.aluno_uid = m.aluno_uid AND e.atividade_id = ${id}
    WHERE m.turma_id = ${atividade.turma_id}
    ORDER BY (e.id IS NULL), e.enviada_em`;

  return {
    dados: {
      atividade,
      entregas: linhas.map((l) => ({
        alunoUid: l.aluno_uid,
        aluno: nomeSeguro(l.display_name) || emailSeguro(l.email),
        entregaId: l.entrega_id,
        resposta: l.resposta,
        enviadaEm: l.enviada_em,
        nota: l.nota === null ? null : Number(l.nota),
        feedback: l.feedback,
        corrigidaEm: l.corrigida_em,
        status: statusDaEntrega({ entrega_id: l.entrega_id, corrigida_em: l.corrigida_em, prazo: atividade.prazo }),
      })),
    },
  };
};

const corrigirEntrega = async ({ uid, params, corpo }) => {
  const id = uuid(params.id);

  const posse = await sql`
    SELECT e.id, a.pontos
    FROM entregas e JOIN atividades a ON a.id = e.atividade_id
    JOIN turmas t ON t.id = a.turma_id
    WHERE e.id = ${id} AND t.professor_uid = ${uid} LIMIT 1`;
  if (!posse.length) throw naoEncontrado("Entrega");

  const nota = numero(corpo.nota, "Nota", { min: 0, max: Number(posse[0].pontos), obrigatorio: true });
  const feedback = texto(corpo.feedback, "Feedback", { max: 5000 }) ?? null;

  const r = await sql`
    UPDATE entregas SET nota = ${nota}, feedback = ${feedback},
      corrigida_em = now(), corrigida_por = ${uid}
    WHERE id = ${id}
      AND atividade_id IN (
        SELECT a.id FROM atividades a JOIN turmas t ON t.id = a.turma_id
        WHERE t.professor_uid = ${uid})
    RETURNING id, nota, feedback, corrigida_em`;
  if (!r.length) throw naoEncontrado("Entrega");
  return { dados: { entrega: r[0] } };
};

/* =============== ALUNO =============== */

const entrarNaTurma = async ({ uid, corpo }) => {
  const codigo = texto(corpo.codigo, "Código", { min: 4, max: 12, obrigatorio: true }).toUpperCase();

  const t = await sql`
    SELECT id, nome, disciplina FROM turmas WHERE codigo = ${codigo} AND NOT arquivada LIMIT 1`;
  // Mesma resposta para "não existe" e "arquivada": não revela nada.
  if (!t.length) throw naoEncontrado("Turma com este código");

  await sql`
    INSERT INTO matriculas (turma_id, aluno_uid) VALUES (${t[0].id}, ${uid})
    ON CONFLICT (turma_id, aluno_uid) DO NOTHING`;
  return { status: 201, dados: { turma: t[0] } };
};

const sairDaTurma = async ({ uid, params }) => {
  const r = await sql`
    DELETE FROM matriculas WHERE turma_id = ${uuid(params.id)} AND aluno_uid = ${uid} RETURNING turma_id`;
  if (!r.length) throw naoEncontrado("Matrícula");
  return { dados: { saiu: true } };
};

const listarTurmasAluno = async ({ uid }) => {
  const linhas = await sql`
    SELECT t.id, t.nome, t.disciplina, t.ano_letivo, m.entrou_em, u.display_name AS professor_nome
    FROM matriculas m JOIN turmas t ON t.id = m.turma_id AND NOT t.arquivada
    LEFT JOIN users u ON u.firebase_uid = t.professor_uid
    WHERE m.aluno_uid = ${uid} ORDER BY t.disciplina, t.nome`;
  return {
    dados: {
      turmas: linhas.map(({ professor_nome, ...t }) => ({ ...t, professor: nomeSeguro(professor_nome) })),
    },
  };
};

const enriquecerAtividadeAluno = (l) => ({
  id: l.id,
  titulo: l.titulo,
  tipo: l.tipo,
  prazo: l.prazo,
  pontos: Number(l.pontos),
  turmaId: l.turma_id,
  turma: l.turma_nome,
  disciplina: l.disciplina,
  enviadaEm: l.enviada_em,
  nota: l.nota === null || l.nota === undefined ? null : Number(l.nota),
  corrigidaEm: l.corrigida_em,
  status: statusDaEntrega(l),
});

const listarAtividadesAluno = async ({ uid }) => {
  const linhas = await sql`
    SELECT a.id, a.titulo, a.tipo, a.prazo, a.pontos,
           t.id AS turma_id, t.nome AS turma_nome, t.disciplina,
           e.id AS entrega_id, e.enviada_em, e.nota, e.corrigida_em
    FROM matriculas m
    JOIN turmas t ON t.id = m.turma_id AND NOT t.arquivada
    JOIN atividades a ON a.turma_id = t.id AND a.publicada
    LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_uid = ${uid}
    WHERE m.aluno_uid = ${uid}
    ORDER BY a.prazo NULLS LAST, a.criado_em DESC`;
  return { dados: { atividades: linhas.map(enriquecerAtividadeAluno) } };
};

const obterAtividadeAluno = async ({ uid, params }) => {
  const id = uuid(params.id);
  const r = await sql`
    SELECT a.id, a.titulo, a.instrucoes, a.tipo, a.prazo, a.pontos,
           t.id AS turma_id, t.nome AS turma_nome, t.disciplina,
           e.id AS entrega_id, e.resposta, e.enviada_em, e.nota, e.feedback, e.corrigida_em
    FROM atividades a
    JOIN turmas t ON t.id = a.turma_id AND NOT t.arquivada
    JOIN matriculas m ON m.turma_id = t.id AND m.aluno_uid = ${uid}
    LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_uid = ${uid}
    WHERE a.id = ${id} AND a.publicada LIMIT 1`;
  if (!r.length) throw naoEncontrado("Atividade");

  const l = r[0];
  return {
    dados: {
      atividade: {
        ...enriquecerAtividadeAluno(l),
        instrucoes: l.instrucoes,
        resposta: l.resposta ?? null,
        feedback: l.feedback ?? null,
      },
    },
  };
};

const enviarEntrega = async ({ uid, params, corpo }) => {
  const id = uuid(params.id);
  const resposta = texto(corpo.resposta, "Resposta", { min: 1, max: 20000, obrigatorio: true });

  const a = await sql`
    SELECT a.id, a.prazo FROM atividades a
    JOIN turmas t ON t.id = a.turma_id AND NOT t.arquivada
    JOIN matriculas m ON m.turma_id = t.id AND m.aluno_uid = ${uid}
    WHERE a.id = ${id} AND a.publicada LIMIT 1`;
  if (!a.length) throw naoEncontrado("Atividade");

  if (a[0].prazo && new Date(a[0].prazo) < new Date()) {
    throw new ErroApi(409, "DEADLINE_PASSED", "O prazo desta atividade já encerrou.");
  }

  // Reenvio permitido enquanto não houver correção.
  const r = await sql`
    INSERT INTO entregas (atividade_id, aluno_uid, resposta)
    VALUES (${id}, ${uid}, ${resposta})
    ON CONFLICT (atividade_id, aluno_uid)
    DO UPDATE SET resposta = EXCLUDED.resposta, atualizada_em = now()
    WHERE entregas.corrigida_em IS NULL
    RETURNING id, enviada_em, atualizada_em`;

  if (!r.length) {
    throw new ErroApi(409, "ALREADY_GRADED", "Esta entrega já foi corrigida e não pode ser alterada.");
  }
  return { status: 201, dados: { entrega: r[0] } };
};

const progressoAluno = async ({ uid }) => {
  const linhas = await sql`
    SELECT t.id AS turma_id, t.nome AS turma, t.disciplina,
      COUNT(a.id)::int AS total,
      COUNT(e.id)::int AS entregues,
      COUNT(e.corrigida_em)::int AS corrigidas,
      AVG(CASE WHEN e.corrigida_em IS NOT NULL THEN e.nota / a.pontos * 100 END) AS media_percentual
    FROM matriculas m
    JOIN turmas t ON t.id = m.turma_id AND NOT t.arquivada
    LEFT JOIN atividades a ON a.turma_id = t.id AND a.publicada
    LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_uid = ${uid}
    WHERE m.aluno_uid = ${uid}
    GROUP BY t.id, t.nome, t.disciplina ORDER BY t.disciplina`;

  const disciplinas = linhas.map((l) => ({
    turmaId: l.turma_id,
    turma: l.turma,
    disciplina: l.disciplina,
    total: l.total,
    entregues: l.entregues,
    corrigidas: l.corrigidas,
    mediaPercentual: l.media_percentual === null ? null : Math.round(Number(l.media_percentual)),
  }));

  const soma = (k) => disciplinas.reduce((n, d) => n + d[k], 0);
  const comMedia = disciplinas.filter((d) => d.mediaPercentual !== null && d.corrigidas > 0);
  const pesoTotal = comMedia.reduce((n, d) => n + d.corrigidas, 0);

  return {
    dados: {
      progresso: {
        total: soma("total"),
        entregues: soma("entregues"),
        corrigidas: soma("corrigidas"),
        // Sem nota corrigida não existe média: devolve null, nunca um número inventado.
        mediaPercentual: pesoTotal
          ? Math.round(comMedia.reduce((n, d) => n + d.mediaPercentual * d.corrigidas, 0) / pesoTotal)
          : null,
        disciplinas,
      },
    },
  };
};

/* =============== TABELA DE ROTAS =============== */

const P = ["professor"];
const A = ["aluno"];

export const ROTAS = [
  { metodo: "GET", caminho: "professor/resumo", papeis: P, handler: resumoProfessor },
  {
    metodo: "GET",
    caminho: "turmas",
    papeis: ["professor", "aluno"],
    handler: (c) => (c.papel === "professor" ? listarTurmasProfessor(c) : listarTurmasAluno(c)),
  },
  { metodo: "POST", caminho: "turmas", papeis: P, handler: criarTurma },
  { metodo: "GET", caminho: "turmas/:id", papeis: P, handler: obterTurmaProfessor },
  { metodo: "PATCH", caminho: "turmas/:id", papeis: P, handler: atualizarTurma },
  { metodo: "DELETE", caminho: "turmas/:id", papeis: P, handler: excluirTurma },
  { metodo: "GET", caminho: "turmas/:id/alunos", papeis: P, handler: alunosDaTurma },
  { metodo: "DELETE", caminho: "turmas/:id/alunos/:alunoUid", papeis: P, handler: removerAluno },
  { metodo: "GET", caminho: "turmas/:id/atividades", papeis: P, handler: listarAtividadesDaTurma },
  { metodo: "POST", caminho: "turmas/:id/atividades", papeis: P, handler: criarAtividade },
  { metodo: "PATCH", caminho: "atividades/:id", papeis: P, handler: atualizarAtividade },
  { metodo: "DELETE", caminho: "atividades/:id", papeis: P, handler: excluirAtividade },
  { metodo: "GET", caminho: "atividades/:id/entregas", papeis: P, handler: entregasDaAtividade },
  { metodo: "PUT", caminho: "entregas/:id/correcao", papeis: P, handler: corrigirEntrega },
  { metodo: "POST", caminho: "matriculas", papeis: A, handler: entrarNaTurma },
  { metodo: "DELETE", caminho: "matriculas/:id", papeis: A, handler: sairDaTurma },
  { metodo: "GET", caminho: "atividades", papeis: A, handler: listarAtividadesAluno },
  { metodo: "GET", caminho: "atividades/:id", papeis: A, handler: obterAtividadeAluno },
  { metodo: "PUT", caminho: "atividades/:id/entrega", papeis: A, handler: enviarEntrega },
  { metodo: "GET", caminho: "progresso", papeis: A, handler: progressoAluno },
];
