import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, Sparkles, X } from "lucide-react";

import type { PassoAssistente } from "../lib/aura-assistente";

import "../styles/aura-assistente.css";

/* Tela cheia, animada, que faz as perguntas da AURA uma por vez antes de criar a prova,
   o plano ou o material. No fim, mostra um resumo e entrega as respostas para o chat. */

interface Props {
  titulo: string;
  subtitulo?: string;
  passos: PassoAssistente[];
  /** Respostas já deduzidas do pedido: esses passos são pulados (aparecem no resumo). */
  previas?: Record<string, string>;
  rotuloFinal: string;
  onConcluir: (respostas: Record<string, string>) => void;
  onFechar: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

/** Efeito de digitação da pergunta (desligado com "reduzir movimento"). */
function useDigitacao(texto: string, ativo: boolean): string {
  const [mostrado, setMostrado] = useState(ativo ? "" : texto);

  useEffect(() => {
    if (!ativo) {
      setMostrado(texto);
      return;
    }

    setMostrado("");

    let i = 0;

    const timer = window.setInterval(() => {
      i += 1;
      setMostrado(texto.slice(0, i));

      if (i >= texto.length) window.clearInterval(timer);
    }, 16);

    return () => window.clearInterval(timer);
  }, [texto, ativo]);

  return mostrado;
}

export function AssistenteCriacaoAura({
  titulo,
  subtitulo,
  passos,
  previas = {},
  rotuloFinal,
  onConcluir,
  onFechar,
}: Props) {
  const reduzir = !!useReducedMotion();

  const [respostas, setRespostas] = useState<Record<string, string>>(() => ({ ...previas }));
  const [etapa, setEtapa] = useState<number | "resumo">(() => {
    const primeiro = passos.findIndex((p) => !previas[p.id]);
    return primeiro === -1 ? "resumo" : primeiro;
  });
  const [direcao, setDirecao] = useState<1 | -1>(1);
  const [voltarAoResumo, setVoltarAoResumo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const campoRef = useRef<HTMLInputElement | null>(null);
  const avancarTimer = useRef<number | null>(null);

  const indices = useMemo(
    () => passos.map((_, i) => i).filter((i) => !previas[passos[i].id]),
    [passos, previas]
  );

  const posicao = etapa === "resumo" ? indices.length : Math.max(0, indices.indexOf(etapa));
  const total = indices.length + 1;

  const passo = etapa === "resumo" ? null : passos[etapa];
  const valor = passo ? respostas[passo.id] || "" : "";

  const digitada = useDigitacao(passo?.pergunta || "", !reduzir && !!passo);

  const limparTimer = () => {
    if (avancarTimer.current !== null) {
      window.clearTimeout(avancarTimer.current);
      avancarTimer.current = null;
    }
  };

  useEffect(() => limparTimer, []);

  useEffect(() => {
    // trava a rolagem da página atrás da tela
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  const irPara = useCallback((destino: number | "resumo", sentido: 1 | -1) => {
    limparTimer();
    setDirecao(sentido);
    setEtapa(destino);
  }, []);

  const avancar = useCallback(() => {
    if (etapa === "resumo") return;

    limparTimer();

    if (voltarAoResumo) {
      setVoltarAoResumo(false);
      irPara("resumo", 1);
      return;
    }

    const seguinte = indices.find((i) => i > etapa);

    irPara(seguinte === undefined ? "resumo" : seguinte, 1);
  }, [etapa, indices, irPara, voltarAoResumo]);

  const voltar = useCallback(() => {
    if (etapa === "resumo") {
      const ultimo = indices[indices.length - 1];
      if (ultimo !== undefined) irPara(ultimo, -1);
      return;
    }

    if (voltarAoResumo) {
      setVoltarAoResumo(false);
      irPara("resumo", -1);
      return;
    }

    const anteriores = indices.filter((i) => i < etapa);
    const anterior = anteriores[anteriores.length - 1];

    if (anterior !== undefined) irPara(anterior, -1);
  }, [etapa, indices, irPara, voltarAoResumo]);

  const podeAvancar = !!passo && (!passo.obrigatoria || valor.trim().length > 0);

  function escolher(opcao: string) {
    if (!passo) return;

    limparTimer();

    setRespostas((r) => ({ ...r, [passo.id]: r[passo.id] === opcao ? "" : opcao }));

    // Escolher uma opção avança sozinho (dá para voltar), como um assistente de verdade.
    if (respostas[passo.id] !== opcao) {
      avancarTimer.current = window.setTimeout(avancar, reduzir ? 0 : 380);
    }
  }

  function digitar(texto: string) {
    if (!passo) return;

    limparTimer();
    setRespostas((r) => ({ ...r, [passo.id]: texto }));
  }

  function concluir() {
    if (enviando) return;

    setEnviando(true);
    window.setTimeout(() => onConcluir(respostas), reduzir ? 0 : 650);
  }

  // Teclado: Esc fecha, Enter avança, 1-9 escolhem opção, setas navegam.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (enviando) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onFechar();
        return;
      }

      const emCampo = e.target instanceof HTMLElement && e.target.tagName === "INPUT";

      if (e.key === "Enter") {
        e.preventDefault();

        if (etapa === "resumo") concluir();
        else if (podeAvancar) avancar();

        return;
      }

      if (emCampo) return;

      if (/^[1-9]$/.test(e.key) && passo) {
        const opcao = passo.opcoes[Number(e.key) - 1];
        if (opcao) escolher(opcao);
      }

      if (e.key === "ArrowLeft") voltar();
      if (e.key === "ArrowRight" && podeAvancar) avancar();
    }

    window.addEventListener("keydown", aoTeclar);

    return () => window.removeEventListener("keydown", aoTeclar);
  });

  useEffect(() => {
    if (passo && passo.opcoes.length === 0) {
      const t = window.setTimeout(() => campoRef.current?.focus(), reduzir ? 0 : 350);
      return () => window.clearTimeout(t);
    }
  }, [passo, reduzir]);

  const slide = {
    variants: {
      entrar: (d: number) => ({
        opacity: 0,
        x: reduzir ? 0 : d * 56,
        filter: reduzir ? "none" : "blur(6px)",
      }),
      ficar: { opacity: 1, x: 0, filter: "blur(0px)" },
      sair: (d: number) => ({
        opacity: 0,
        x: reduzir ? 0 : d * -56,
        filter: reduzir ? "none" : "blur(6px)",
      }),
    },
    initial: "entrar",
    animate: "ficar",
    exit: "sair",
    custom: direcao,
  };

  return (
    <motion.div
      className="aw-fundo"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduzir ? 0 : 0.35 }}
    >
      {!reduzir && (
        <>
          <span className="aw-orbe aw-orbe-1" aria-hidden="true" />
          <span className="aw-orbe aw-orbe-2" aria-hidden="true" />
        </>
      )}

      <button type="button" className="aw-fechar" aria-label="Fechar" onClick={onFechar}>
        <X size={18} />
      </button>

      <motion.div
        className="aw-painel"
        initial={{ opacity: 0, y: reduzir ? 0 : 28, scale: reduzir ? 1 : 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduzir ? 0 : 0.55, ease }}
      >
        <header className="aw-topo">
          <motion.span
            className="aw-selo"
            animate={reduzir ? undefined : { rotate: [0, 10, -8, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <Sparkles size={16} />
          </motion.span>

          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
        </header>

        <div
          className="aw-progresso"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={posicao + 1}
          aria-label="Progresso das perguntas"
        >
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className="aw-segmento">
              <motion.span
                className="aw-segmento-preenchido"
                initial={false}
                animate={{ scaleX: i <= posicao ? 1 : 0 }}
                transition={{ duration: reduzir ? 0 : 0.5, ease }}
              />
            </span>
          ))}
        </div>

        <div className="aw-corpo">
          <AnimatePresence mode="wait" custom={direcao}>
            {etapa === "resumo" ? (
              <motion.section
                key="resumo"
                className="aw-etapa"
                {...slide}
                transition={{ duration: reduzir ? 0 : 0.38, ease }}
              >
                <p className="aw-contador">Tudo certo?</p>
                <h3 className="aw-pergunta">Confira o que a AURA vai criar</h3>

                <ul className="aw-resumo">
                  {passos.map((p, i) => {
                    const v = (respostas[p.id] || "").trim();

                    if (!v && !p.obrigatoria) return null;

                    return (
                      <motion.li
                        key={p.id}
                        initial={reduzir ? false : { opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: reduzir ? 0 : 0.05 * i, duration: 0.35, ease }}
                      >
                        <span className="aw-resumo-pergunta">{p.pergunta}</span>
                        <span className="aw-resumo-resposta">{v || "Você decide"}</span>

                        <button
                          type="button"
                          className="aw-editar"
                          aria-label={`Editar: ${p.pergunta}`}
                          onClick={() => {
                            setVoltarAoResumo(true);
                            irPara(i, -1);
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.section>
            ) : (
              passo && (
                <motion.section
                  key={passo.id}
                  className="aw-etapa"
                  {...slide}
                  transition={{ duration: reduzir ? 0 : 0.38, ease }}
                >
                  <p className="aw-contador">
                    Pergunta {posicao + 1} de {indices.length}
                  </p>

                  <h3 className="aw-pergunta" aria-label={passo.pergunta}>
                    {digitada}
                    {!reduzir && digitada.length < passo.pergunta.length && (
                      <span className="aw-cursor" aria-hidden="true" />
                    )}
                  </h3>

                  {passo.dica && <p className="aw-dica">{passo.dica}</p>}

                  {passo.opcoes.length > 0 && (
                    <motion.div
                      className="aw-opcoes"
                      initial="oculto"
                      animate="visivel"
                      variants={{ visivel: { transition: { staggerChildren: reduzir ? 0 : 0.07, delayChildren: reduzir ? 0 : 0.25 } } }}
                    >
                      {passo.opcoes.map((o, i) => {
                        const ativa = valor === o;

                        return (
                          <motion.button
                            key={o}
                            type="button"
                            className={`aw-opcao ${ativa ? "ativa" : ""}`}
                            aria-pressed={ativa}
                            variants={{
                              oculto: { opacity: 0, y: reduzir ? 0 : 16 },
                              visivel: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
                            }}
                            whileHover={reduzir ? undefined : { y: -3, scale: 1.015 }}
                            whileTap={reduzir ? undefined : { scale: 0.97 }}
                            onClick={() => escolher(o)}
                          >
                            <span className="aw-tecla">{i + 1}</span>
                            <span className="aw-opcao-texto">{o}</span>

                            <AnimatePresence>
                              {ativa && (
                                <motion.span
                                  className="aw-marca"
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0 }}
                                  transition={{ type: "spring", stiffness: 520, damping: 22 }}
                                >
                                  <Check size={14} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}

                  {passo.livre && (
                    <motion.input
                      ref={campoRef}
                      className="aw-campo"
                      value={passo.opcoes.includes(valor) ? "" : valor}
                      maxLength={200}
                      placeholder={passo.opcoes.length ? "Ou escreva a sua resposta" : "Escreva aqui"}
                      aria-label={passo.pergunta}
                      onChange={(e) => digitar(e.target.value)}
                      initial={reduzir ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduzir ? 0 : 0.45, duration: 0.4, ease }}
                    />
                  )}
                </motion.section>
              )
            )}
          </AnimatePresence>
        </div>

        <footer className="aw-rodape">
          <button
            type="button"
            className="aw-botao"
            onClick={voltar}
            disabled={enviando || (etapa !== "resumo" && !voltarAoResumo && indices.indexOf(etapa) <= 0)}
          >
            <ArrowLeft size={15} /> Voltar
          </button>

          <span className="aw-atalho">Enter continua · Esc fecha</span>

          {etapa === "resumo" ? (
            <motion.button
              type="button"
              className="aw-botao primario brilho"
              onClick={concluir}
              disabled={enviando}
              whileHover={reduzir ? undefined : { scale: 1.04 }}
              whileTap={reduzir ? undefined : { scale: 0.96 }}
            >
              {enviando ? (
                <>
                  <Loader2 size={15} className="aw-gira" /> Enviando para a AURA
                </>
              ) : (
                <>
                  <Sparkles size={15} /> {rotuloFinal}
                </>
              )}
            </motion.button>
          ) : (
            <button type="button" className="aw-botao primario" onClick={avancar} disabled={!podeAvancar}>
              {passo && !passo.obrigatoria && !valor.trim() ? "Pular" : "Continuar"} <ArrowRight size={15} />
            </button>
          )}
        </footer>
      </motion.div>
    </motion.div>
  );
}
