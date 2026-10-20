/* Casa "MÉTODO + caminho" com uma rota declarada. Puro (sem banco). */

export function casar(rotas, metodo, caminho) {
  const partes = String(caminho || "").split("/").filter(Boolean);

  for (const rota of rotas) {
    if (rota.metodo !== metodo) continue;

    const molde = rota.caminho.split("/");
    if (molde.length !== partes.length) continue;

    const params = {};
    let ok = true;

    for (let i = 0; i < molde.length; i++) {
      if (molde[i].startsWith(":")) {
        let valor;
        try {
          valor = decodeURIComponent(partes[i]);
        } catch {
          ok = false;
          break;
        }
        // Segmentos de navegação ou com barra nunca são um id válido.
        if (valor === "." || valor === ".." || valor.includes("/") || valor.includes("\\")) {
          ok = false;
          break;
        }
        params[molde[i].slice(1)] = valor;
      } else if (molde[i] !== partes[i]) {
        ok = false;
        break;
      }
    }

    if (ok) return { rota, params };
  }
  return null;
}

/** O caminho existe com outro método? (responde 405 em vez de 404) */
export function existeComOutroMetodo(rotas, metodo, caminho) {
  return rotas.some((r) => r.metodo !== metodo && casar([r], r.metodo, caminho));
}
