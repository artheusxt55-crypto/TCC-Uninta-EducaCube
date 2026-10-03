import type { CSSProperties } from "react";

import ActionLink from "./ActionLink";
import { IconCube } from "./icons";
import { ECO_NODES } from "./content";
import type { ModuleId } from "./content";

type EcosystemProps = {
    onOpenModule: (id: ModuleId) => void;
};








const RADIUS = 37;

const POINTS = ECO_NODES.map((_, index) => {
    const angle =
        (-90 + (index * 360) / ECO_NODES.length) * (Math.PI / 180);

    return {
        x: Number((50 + RADIUS * Math.cos(angle)).toFixed(2)),
        y: Number((50 + RADIUS * Math.sin(angle)).toFixed(2)),
    };
});

const RING_PATH = POINTS.map(
    (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x} ${point.y}`
).join(" ") + " Z";


export default function Ecosystem({ onOpenModule }: EcosystemProps) {
    return (
        <section
            className="section section--surface ecosystem"
            id="ecossistema"
            aria-labelledby="ecosystem-title"
        >
            <div className="wrap">
                <div
                    className="section-head section-head--center"
                    data-reveal
                >
                    <h2
                        id="ecosystem-title"
                        className="h-section"
                    >
                        Um ecossistema, não uma lista de ferramentas.
                    </h2>

                    <p className="body-muted">
                        Diagnóstico, planejamento, base curricular,
                        biblioteca, AURA, intervenção e aprendizagem
                        giram em torno do mesmo centro e se alimentam
                        umas das outras.
                    </p>
                </div>

                <div
                    className="eco-map"
                    data-reveal
                >
                    <svg
                        className="eco-map__lines"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r={RADIUS}
                            className="eco-map__ring"
                        />

                        {POINTS.map((point, index) => (
                            <line
                                key={ECO_NODES[index].nome}
                                x1="50"
                                y1="50"
                                x2={point.x}
                                y2={point.y}
                                className="eco-map__spoke"
                            />
                        ))}

                        <path
                            d={RING_PATH}
                            className="eco-map__cycle"
                        />
                    </svg>

                    <div className="eco-core">
                        <IconCube className="eco-core__glyph" />

                        <span className="eco-core__name">
                            Educa
                            <span className="brand-name__cube">
                                Cube
                            </span>
                        </span>

                        <span className="eco-core__role">
                            Plataforma educacional
                        </span>
                    </div>

                    <ul className="eco-nodes">
                        {ECO_NODES.map((node, index) => {
                            const style = {
                                "--x": `${POINTS[index].x}%`,
                                "--y": `${POINTS[index].y}%`,
                            } as CSSProperties;

                            return (
                                <li
                                    key={node.nome}
                                    className="eco-node"
                                    style={style}
                                >
                                    <ActionLink
                                        action={node.action}
                                        onOpenModule={onOpenModule}
                                        className="eco-node__link"
                                    >
                                        <node.Icone className="eco-node__icon" />

                                        <span className="eco-node__text">
                                            <span className="eco-node__name">
                                                {node.nome}
                                            </span>

                                            <span className="eco-node__role">
                                                {node.papel}
                                            </span>
                                        </span>
                                    </ActionLink>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}
