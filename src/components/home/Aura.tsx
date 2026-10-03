import BlockTextReveal from "../BlockTextReveal";
import {
    AURA_HELPS,
    ROUTES,
    STAGES,
    TEACHER_DECIDES,
} from "./content";


export default function Aura() {
    return (
        <section
            className="section section--aura aura"
            id="aura"
            aria-labelledby="aura-title"
        >
            <div className="wrap">
                <div className="aura__grid">
                    <div
                        className="aura__head"
                        data-reveal
                    >
                        <p className="label">AURA AI</p>

                        <div
                            id="aura-title"
                            className="h-section"
                            role="heading"
                            aria-level={2}
                        >
                            <BlockTextReveal
                                text="Inteligência aplicada ao trabalho pedagógico."
                                align="left"
                                textColor="inherit"
                                blockColor="#8b5cf6"
                                revealType="lines"
                                direction="left"
                                rounded={0}
                                speed={50}
                                highlight={[]}
                                font={{
                                    fontFamily: "inherit",
                                    fontWeight: "inherit",
                                    fontSize: "inherit",
                                    lineHeight: "inherit",
                                    letterSpacing: "inherit",
                                }}
                                style={{
                                    minHeight: "auto",
                                    height: "auto",
                                    alignItems: "flex-start",
                                    justifyContent: "flex-start",
                                }}
                            />
                        </div>

                        <p className="body-muted">
                            A AURA é uma ferramenta pedagógica
                            integrada ao EducaCube. Ela acompanha o
                            professor ao longo do percurso, sem tomar
                            o lugar de quem conhece a turma.
                        </p>

                        <a
                            href={ROUTES.aura}
                            className="btn-solid"
                        >
                            Conhecer a AURA AI
                        </a>
                    </div>

                    <div
                        className="aura__roles"
                        data-reveal
                    >
                        <section aria-labelledby="aura-helps">
                            <h3
                                id="aura-helps"
                                className="h-sub"
                            >
                                A AURA ajuda a
                            </h3>

                            <ul className="role-list">
                                {AURA_HELPS.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </section>

                        <section aria-labelledby="aura-teacher">
                            <h3
                                id="aura-teacher"
                                className="h-sub"
                            >
                                O professor continua
                            </h3>

                            <ul className="role-list role-list--teacher">
                                {TEACHER_DECIDES.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>

                <div
                    className="aura-span"
                    data-reveal
                >
                    <ol className="aura-span__stages">
                        {STAGES.map((stage) => (
                            <li key={stage.id}>{stage.noun}</li>
                        ))}
                    </ol>

                    <div
                        className="aura-span__bracket"
                        aria-hidden="true"
                    >
                        <span>
                            A AURA está presente em todo o percurso
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
