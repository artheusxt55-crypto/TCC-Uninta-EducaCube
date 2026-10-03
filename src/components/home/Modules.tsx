import ActionLink from "./ActionLink";
import { IconArrow } from "./icons";
import { MODULES, SUPPORT_RESOURCES } from "./content";
import type { ModuleId } from "./content";

type ModulesProps = {
    onOpenModule: (id: ModuleId) => void;
};


export default function Modules({ onOpenModule }: ModulesProps) {
    return (
        <section
            className="section modules"
            id="ferramentas"
            aria-labelledby="modules-title"
        >
            <div className="wrap modules__grid">
                <div
                    className="modules__head"
                    data-reveal
                >
                    <h2
                        id="modules-title"
                        className="h-section"
                    >
                        Explore o ecossistema EducaCube
                    </h2>

                    <p className="body-muted">
                        Cada módulo é uma peça do mesmo sistema. Ele
                        recebe o que a etapa anterior produziu e
                        entrega o que a próxima precisa.
                    </p>
                </div>

                <div className="modules__lists">
                    <ol
                        className="module-index"
                        aria-label="Módulos de trabalho pedagógico"
                    >
                        {MODULES.map(
                            ({
                                id,
                                numero,
                                nome,
                                etapa,
                                descricao,
                                funcao,
                                Icone,
                            }) => (
                                <li
                                    key={id}
                                    className="module-row"
                                    data-reveal
                                >
                                    <ActionLink
                                        action={{
                                            kind: "module",
                                            id,
                                            label: `Abrir ${nome}`,
                                        }}
                                        onOpenModule={onOpenModule}
                                        className="module-row__link"
                                    >
                                        <span className="module-row__index meta">
                                            {numero}
                                        </span>

                                        <span className="module-row__icon">
                                            <Icone />
                                        </span>

                                        <span className="module-row__main">
                                            <span className="module-row__stage label">
                                                {etapa}
                                            </span>

                                            <span className="module-row__name">
                                                {nome}
                                            </span>

                                            <span className="module-row__desc">
                                                {descricao}
                                            </span>

                                            <span className="module-row__role">
                                                {funcao}
                                            </span>
                                        </span>

                                        <span className="module-row__cta">
                                            Abrir módulo
                                            <IconArrow />
                                        </span>
                                    </ActionLink>
                                </li>
                            )
                        )}
                    </ol>

                    <h3
                        className="h-sub modules__support-title"
                        data-reveal
                    >
                        Recursos de apoio
                    </h3>

                    <ul className="module-index module-index--support">
                        {SUPPORT_RESOURCES.map(
                            ({
                                nome,
                                etapa,
                                descricao,
                                funcao,
                                href,
                                cta,
                                Icone,
                            }) => (
                                <li
                                    key={nome}
                                    className="module-row"
                                    data-reveal
                                >
                                    <a
                                        href={href}
                                        className="module-row__link"
                                    >
                                        <span
                                            className="module-row__index"
                                            aria-hidden="true"
                                        />

                                        <span className="module-row__icon">
                                            <Icone />
                                        </span>

                                        <span className="module-row__main">
                                            <span className="module-row__stage label">
                                                {etapa}
                                            </span>

                                            <span className="module-row__name">
                                                {nome}
                                            </span>

                                            <span className="module-row__desc">
                                                {descricao}
                                            </span>

                                            <span className="module-row__role">
                                                {funcao}
                                            </span>
                                        </span>

                                        <span className="module-row__cta">
                                            {cta}
                                            <IconArrow />
                                        </span>
                                    </a>
                                </li>
                            )
                        )}
                    </ul>
                </div>
            </div>
        </section>
    );
}
