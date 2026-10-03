import ActionLink from "./ActionLink";
import { STAGES } from "./content";
import type { ModuleId } from "./content";

type JourneyProps = {
    onOpenModule: (id: ModuleId) => void;
};


export default function Journey({ onOpenModule }: JourneyProps) {
    return (
        <section
            className="section journey-section"
            id="como-funciona"
            aria-labelledby="journey-title"
        >
            <div className="wrap">
                <div
                    className="section-head"
                    data-reveal
                >
                    <h2
                        id="journey-title"
                        className="h-section"
                    >
                        Como o EducaCube funciona
                    </h2>

                    <p className="body-muted">
                        Um percurso em cinco etapas. Cada uma continua
                        o que a anterior deixou, e a última devolve
                        material para a primeira.
                    </p>
                </div>

                <ol className="journey">
                    {STAGES.map((stage, index) => {
                        const numero = String(index + 1).padStart(
                            2,
                            "0"
                        );

                        return (
                            <li
                                key={stage.id}
                                className="journey__step"
                                data-reveal
                            >
                                <span
                                    className="journey__node"
                                    aria-hidden="true"
                                />

                                <div className="journey__body">
                                    <span className="meta">
                                        Etapa {numero}
                                    </span>

                                    <h3 className="journey__verb">
                                        {stage.verb}
                                    </h3>

                                    <p className="journey__summary">
                                        {stage.summary}
                                    </p>

                                    <p className="journey__detail">
                                        {stage.detail}
                                    </p>

                                    <div className="journey__actions">
                                        {stage.actions.map(
                                            (action) => (
                                                <ActionLink
                                                    key={action.label}
                                                    action={action}
                                                    onOpenModule={
                                                        onOpenModule
                                                    }
                                                    className="text-link"
                                                />
                                            )
                                        )}
                                    </div>
                                </div>

                                <span
                                    className="journey__numeral"
                                    aria-hidden="true"
                                >
                                    {numero}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
