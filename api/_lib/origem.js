/* Recusa chamadas do navegador vindas de OUTROS sites. Não impede curl/scripts:
   contra isso valem o token do Firebase e o e-mail verificado. */

const ORIGENS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

export function origemAutorizada(req) {
  const origem = req.headers.origin;
  if (!origem) return true;

  const limpa = String(origem).replace(/\/$/, "");
  if (ORIGENS.includes(limpa)) return true;

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!host) return false;

  if (limpa === `https://${host}`) return true;
  return /^localhost(:\d+)?$/.test(host) && limpa === `http://${host}`;
}

/** Nunca usa "*": só ecoa a origem se ela for autorizada. */
export function configurarCors(req, res) {
  const origem = req.headers.origin ? String(req.headers.origin).replace(/\/$/, "") : "";

  if (origem && origemAutorizada(req)) {
    res.setHeader("Access-Control-Allow-Origin", origem);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
