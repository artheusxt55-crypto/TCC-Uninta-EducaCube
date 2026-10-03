import BlockTextReveal from "../BlockTextReveal";
import { AUDIENCE, STAGES } from "./content";


export default function Platform() {
    return (
        <section
            className="section platform"
            id="plataforma"
            aria-labelledby="platform-title"
        >
            <div className="wrap">
                <div className="platform__intro">
                    <div
                        id="platform-title"
                        className="h-section"
                        role="heading"
                        aria-level={2}
                    >
                        <BlockTextReveal
                            text="O que é o EducaCube?"
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

                    <div
                        className="platform__text"
                        data-reveal
                    >
                        <p className="lead-serif">
                            O EducaCube é uma plataforma educacional
                            que organiza, em um só ambiente, as etapas
                            do trabalho pedagógico: observar a
                            aprendizagem, planejar, buscar fundamento,
                            intervir e acompanhar.
                        </p>

                        <p className="body-muted">
                            Não é uma coleção de ferramentas soltas.
                            Cada módulo continua o trabalho do
                            anterior, e todos partem da mesma base
                            curricular
                        
                        </p>
                    </div>
                </div>

                <div
                    className="audience"
                    data-reveal
                >
                    <h3 className="h-sub audience__title">
                        Para quem foi criado
                    </h3>

                    <ul className="audience__list">
                        {AUDIENCE.map((item) => (
                            <li
                                key={item.title}
                                className="audience__item"
                            >
                                <strong>{item.title}</strong>

                                <span>{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div
                    className="cycle"
                    data-reveal
                >
                    <h3 className="h-sub cycle__title">
                        O trabalho pedagógico, em um só percurso
                    </h3>

                    <ol className="cycle__track">
                        {STAGES.map((stage) => (
                            <li
                                key={stage.id}
                                className="cycle__item"
                            >
                                <span className="cycle__noun">
                                    {stage.noun}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
