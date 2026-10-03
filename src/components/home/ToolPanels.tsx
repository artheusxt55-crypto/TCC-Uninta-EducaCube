import { useId, useState } from "react";
import type { ReactNode } from "react";

import type { ModuleId } from "./content";










type Resultados = {
    diagnostico?: string;
    bncc?: string;
    planejamento?: string;
    intervencao?: string;
};

type ToolPanelsProps = {
    activeModule: ModuleId | null;
    onClose: () => void;
};

const SERIES = Array.from({ length: 9 }, (_, index) => index + 1);

function SerieOptions() {
    return (
        <>
            {SERIES.map((serie) => (
                <option key={serie}>{serie}º Ano</option>
            ))}
        </>
    );
}

function Panel({
    active,
    eyebrow,
    title,
    subtitle,
    onClose,
    children,
}: {
    active: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    onClose: () => void;
    children: ReactNode;
}) {
    return (
        <div className={`tool-panel ${active ? "active" : ""}`}>
            <div className="tool-header">
                <div>
                    <p className="module-eyebrow">{eyebrow}</p>

                    <h3>{title}</h3>

                    <p>{subtitle}</p>
                </div>

                <button
                    type="button"
                    className="close-tool"
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    ×
                </button>
            </div>

            {children}
        </div>
    );
}

export default function ToolPanels({
    activeModule,
    onClose,
}: ToolPanelsProps) {
    const uid = useId();

    const [diagDescricao, setDiagDescricao] = useState("");
    const [buscaBNCC, setBuscaBNCC] = useState("");
    const [temaPlano, setTemaPlano] = useState("");
    const [objetivoPlano, setObjetivoPlano] = useState("");
    const [necessidadeIntervencao, setNecessidadeIntervencao] =
        useState("");
    const [contextoIntervencao, setContextoIntervencao] =
        useState("");
    const [resultado, setResultado] = useState<Resultados>({});

    



    const executarDiagnostico = () => {
        if (!diagDescricao.trim()) {
            alert("Descreva a necessidade observada.");
            return;
        }

        setResultado((prev) => ({
            ...prev,
            diagnostico:
                "A interface está funcionando. A integração com a IA ainda precisa ser conectada ao backend.",
        }));
    };

    



    const consultarBNCC = () => {
        if (!buscaBNCC.trim()) {
            alert("Digite algo para pesquisar.");
            return;
        }

        setResultado((prev) => ({
            ...prev,
            bncc:
                "A interface de consulta está funcionando. A base BNCC ainda precisa ser conectada.",
        }));
    };

    



    const gerarPlano = () => {
        if (!temaPlano.trim() || !objetivoPlano.trim()) {
            alert("Informe o tema e o objetivo.");
            return;
        }

        setResultado((prev) => ({
            ...prev,
            planejamento:
                "O formulário está funcionando. A geração automática ainda precisa da integração com a IA.",
        }));
    };

    



    const gerarIntervencao = () => {
        if (!necessidadeIntervencao.trim()) {
            alert("Informe a necessidade identificada.");
            return;
        }

        setResultado((prev) => ({
            ...prev,
            intervencao:
                "O módulo está funcionando. A geração da estratégia ainda precisa da integração com a IA.",
        }));
    };

    return (
        <>
            
            <Panel
                active={activeModule === "diagnostico"}
                eyebrow="Módulo 01"
                title="Diagnóstico da Aprendizagem"
                subtitle="Estrutura preparada para leitura pedagógica assistida."
                onClose={onClose}
            >
                <div className="tool-grid">
                    <div className="tool-card tool-card--field">
                        <label
                            className="field-label"
                            htmlFor={`${uid}-diag-serie`}
                        >
                            Ano / série
                        </label>

                        <select id={`${uid}-diag-serie`}>
                            <SerieOptions />
                        </select>
                    </div>

                    <div className="tool-card tool-card--field">
                        <label
                            className="field-label"
                            htmlFor={`${uid}-diag-componente`}
                        >
                            Componente
                        </label>

                        <select id={`${uid}-diag-componente`}>
                            <option>Língua Portuguesa</option>
                            <option>Matemática</option>
                            <option>Ciências</option>
                            <option>História</option>
                            <option>Geografia</option>
                        </select>
                    </div>
                </div>

                <label
                    className="field-label"
                    htmlFor={`${uid}-diag-descricao`}
                >
                    Habilidade / necessidade observada
                </label>

                <textarea
                    id={`${uid}-diag-descricao`}
                    value={diagDescricao}
                    onChange={(event) =>
                        setDiagDescricao(event.target.value)
                    }
                    placeholder="Descreva o que foi observado no processo de aprendizagem..."
                />

                <button
                    type="button"
                    className="btn-ink"
                    onClick={executarDiagnostico}
                >
                    Analisar
                </button>

                {resultado.diagnostico && (
                    <div className="result-box">
                        <strong>Leitura pedagógica</strong>

                        <p>{resultado.diagnostico}</p>
                    </div>
                )}
            </Panel>

            
            <Panel
                active={activeModule === "bncc"}
                eyebrow="Módulo 02"
                title="Consulta Curricular"
                subtitle="Pesquisa de habilidades e organização curricular."
                onClose={onClose}
            >
                <label
                    className="field-label"
                    htmlFor={`${uid}-bncc-busca`}
                >
                    Habilidade ou palavra-chave
                </label>

                <input
                    id={`${uid}-bncc-busca`}
                    type="text"
                    value={buscaBNCC}
                    onChange={(event) =>
                        setBuscaBNCC(event.target.value)
                    }
                    placeholder="Ex.: interpretação de texto, frações..."
                />

                <div className="tool-grid">
                    <div className="tool-card">
                        <h4>Habilidades</h4>

                        <p>
                            Consulta estruturada de habilidades e
                            competências curriculares.
                        </p>
                    </div>

                    <div className="tool-card">
                        <h4>Contexto pedagógico</h4>

                        <p>
                            Use a habilidade selecionada como
                            referência para suas análises.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="btn-ink"
                    onClick={consultarBNCC}
                >
                    Consultar
                </button>

                {resultado.bncc && (
                    <div className="result-box">
                        <strong>Resultado</strong>

                        <p>{resultado.bncc}</p>
                    </div>
                )}
            </Panel>

            
            <Panel
                active={activeModule === "planejamento"}
                eyebrow="Módulo 03"
                title="Planejamento Pedagógico"
                subtitle="Estruture objetivos e estratégias para sua prática."
                onClose={onClose}
            >
                <label
                    className="field-label"
                    htmlFor={`${uid}-plano-tema`}
                >
                    Tema
                </label>

                <input
                    id={`${uid}-plano-tema`}
                    value={temaPlano}
                    onChange={(event) =>
                        setTemaPlano(event.target.value)
                    }
                    placeholder="Ex.: interpretação textual"
                />

                <label
                    className="field-label"
                    htmlFor={`${uid}-plano-serie`}
                >
                    Ano / série
                </label>

                <select id={`${uid}-plano-serie`}>
                    <SerieOptions />
                </select>

                <label
                    className="field-label"
                    htmlFor={`${uid}-plano-objetivo`}
                >
                    Objetivo
                </label>

                <textarea
                    id={`${uid}-plano-objetivo`}
                    value={objetivoPlano}
                    onChange={(event) =>
                        setObjetivoPlano(event.target.value)
                    }
                    placeholder="O que o aluno deverá desenvolver?"
                />

                <button
                    type="button"
                    className="btn-ink"
                    onClick={gerarPlano}
                >
                    Gerar planejamento
                </button>

                {resultado.planejamento && (
                    <div className="result-box">
                        <strong>Planejamento</strong>

                        <p>{resultado.planejamento}</p>
                    </div>
                )}
            </Panel>

            
            <Panel
                active={activeModule === "intervencao"}
                eyebrow="Módulo 04"
                title="Intervenção Pedagógica"
                subtitle="Transforme evidências de aprendizagem em estratégias."
                onClose={onClose}
            >
                <label
                    className="field-label"
                    htmlFor={`${uid}-interv-necessidade`}
                >
                    Necessidade identificada
                </label>

                <textarea
                    id={`${uid}-interv-necessidade`}
                    value={necessidadeIntervencao}
                    onChange={(event) =>
                        setNecessidadeIntervencao(event.target.value)
                    }
                    placeholder="Descreva a dificuldade ou necessidade observada..."
                />

                <label
                    className="field-label"
                    htmlFor={`${uid}-interv-contexto`}
                >
                    Contexto
                </label>

                <textarea
                    id={`${uid}-interv-contexto`}
                    value={contextoIntervencao}
                    onChange={(event) =>
                        setContextoIntervencao(event.target.value)
                    }
                    placeholder="Informe o contexto da turma ou do estudante..."
                />

                <button
                    type="button"
                    className="btn-ink"
                    onClick={gerarIntervencao}
                >
                    Propor intervenção
                </button>

                {resultado.intervencao && (
                    <div className="result-box">
                        <strong>Proposta pedagógica</strong>

                        <p>{resultado.intervencao}</p>
                    </div>
                )}
            </Panel>
        </>
    );
}
