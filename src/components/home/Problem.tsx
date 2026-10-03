import { PROBLEMS } from "./content";


export default function Problem() {
    return (
        <section
            className="section section--surface problem"
            id="problema"
            aria-labelledby="problem-title"
        >
            <div className="wrap problem__grid">
                <div
                    className="problem__head"
                    data-reveal
                >
                    <h2
                        id="problem-title"
                        className="h-section"
                    >
                        Por que uma plataforma como o EducaCube
                        existe?
                    </h2>

                    <p className="body-muted">
                        O trabalho pedagógico acontece em muitas
                        frentes ao mesmo tempo. Quando as informações
                        ficam espalhadas, o professor gasta energia
                        procurando em vez de decidir.
                    </p>
                </div>

                <dl
                    className="problem__list"
                    data-reveal
                >
                    {PROBLEMS.map((item) => (
                        <div
                            key={item.problem}
                            className="problem__row"
                        >
                            <dt>{item.problem}</dt>

                            <dd>{item.answer}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
