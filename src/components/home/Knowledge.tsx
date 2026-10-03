import ActionLink from "./ActionLink";
import { EQUATION_TERMS, ROUTES } from "./content";
import type { ModuleId } from "./content";

type KnowledgeProps = {
    onOpenModule: (id: ModuleId) => void;
};


export default function Knowledge({ onOpenModule }: KnowledgeProps) {
    return (
        <section
            className="section knowledge"
            id="conhecimento"
            aria-labelledby="knowledge-title"
        >
            <div className="wrap">
                <div
                    className="section-head section-head--wide"
                    data-reveal
                >
                    <h2
                        id="knowledge-title"
                        className="h-section"
                    >
                        Onde o planejamento encontra o fundamento.
                    </h2>

                    <p className="body-muted">
                        O EducaCube não é apenas uma interface de
                        ferramentas. Por trás de cada etapa há uma
                        base curricular, um acervo de referências e
                        um conhecimento pedagógico organizado.
                    </p>
                </div>

                <ol
                    className="equation"
                    data-reveal
                >
                    {EQUATION_TERMS.map((item) => (
                        <li
                            key={item.term}
                            className="equation__term"
                        >
                            <span className="equation__name">
                                {item.term}
                            </span>

                            <span className="equation__text">
                                {item.text}
                            </span>
                        </li>
                    ))}

                    <li className="equation__result">
                        <span className="equation__name">
                            Prática
                        </span>

                        <span className="equation__text">
                            O que acontece na sala de aula, agora com
                            base e intenção.
                        </span>
                    </li>
                </ol>

                <div
                    className="knowledge__actions"
                    data-reveal
                >
                    <ActionLink
                        action={{
                            kind: "module",
                            id: "bncc",
                            label: "Consultar a BNCC",
                        }}
                        onOpenModule={onOpenModule}
                        className="btn-ghost btn-ghost--lg"
                    />

                    <a
                        href={ROUTES.biblioteca}
                        className="btn-ghost btn-ghost--lg"
                    >
                        Abrir a biblioteca digital
                    </a>
                </div>
            </div>
        </section>
    );
}
