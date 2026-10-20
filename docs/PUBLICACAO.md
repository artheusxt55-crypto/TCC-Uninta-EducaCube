# EducaCube — o que fazer antes de publicar

Esta entrega muda segurança, banco e os dois painéis. Siga a ordem.

## 1. Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Para quê | Observação |
|---|---|---|
| `DADOS_CHAVE_CRIPTO` | Chave AES-256 dos dados pessoais no Neon | **Nova.** 32 bytes em base64. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Guarde uma cópia **fora** do sistema (gerenciador de senhas): sem ela os dados cifrados não são recuperáveis. Nunca troque depois de haver usuários sem planejar a migração. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Verifica tokens e define o papel (claims) | JSON da conta de serviço, em uma linha. |
| `DATABASE_URL` | Neon | Já existe. |
| `ALLOWED_ORIGINS` | Sites autorizados a chamar a API | Opcional. Só é preciso se o site também responde em outro domínio (ex.: `www`). Separe por vírgula. |

Nada disso entra no repositório.

## 2. Banco (Neon) — rodar **em ordem**, uma vez

1. `db/001_papel_usuario.sql` — coluna `role` e trava que impede trocar o papel.
2. `db/002_dados_protegidos.sql` — colunas cifradas e índice do e-mail.
3. `db/003_plataforma.sql` — turmas, matrículas, atividades e entregas.

Os três foram executados e conferidos num branch de teste do Neon (`teste-plataforma-sql`), com o fluxo
completo: papel imutável, e-mail único, matrícula, entrega, reenvio, correção, bloqueio depois de corrigida,
acesso a turma alheia (nenhuma linha) e exclusão em cascata. O banco principal **ainda não** recebeu os scripts.

## 3. Firebase

- Publique `firestore.rules` (nega tudo ao navegador). Antes, confira se algum trecho do site lê o Firestore
  direto; a API usa o Admin SDK e não é afetada.
- Em Authentication, mantenha o envio de e-mail de verificação ativo.

## 4. O que muda para as pessoas

- Entrar exige **e-mail verificado**. Contas antigas sem verificação ficam bloqueadas até confirmar.
- O papel (aluno ou professor) é definido uma vez e **não muda**; o mesmo e-mail não vira o outro papel.
- Quem já tinha conta sem papel fica com o primeiro que escolher.
- Cadastro de professor é aberto (decisão do projeto).

## 5. Limitações conhecidas

- Sem limite de tentativas no código de entrada de turma (6 caracteres). Recomenda-se rate-limit (Upstash já
  está nas variáveis) antes de uso em larga escala.
- `api/registrar-acesso.js` ainda grava dados de acesso em texto puro no Firestore.
- Notificações, anexos e agenda compartilhada não existem no backend; o painel não finge ter esses recursos.
- O build completo (`npm run build`) não pôde ser executado onde isto foi desenvolvido (sem acesso ao registro npm).
  Rode `npm install && npm run build && npm run test:api && npm run test:ui` na sua máquina ou na Vercel.

## 6. Testes

- `npm run test:api` — 85 testes (papel, criptografia, origem, token, rotas, posse dos dados).
- `npm run test:ui` — 21 testes da lógica dos painéis.
