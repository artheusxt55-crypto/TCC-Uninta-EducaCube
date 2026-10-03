import { lazy, Suspense } from "react";

const TransformDesktop = lazy(
    () => import("../TransformDesktop")
);





export default function KnowledgeMotion() {
    return (
        <section
            className="transform-section"
            aria-label="Conhecimento em movimento"
        >
            <div className="wrap">
                <div
                    className="transform-header"
                    data-reveal
                >
                    <strong>Conhecimento em movimento</strong>

                    <span>
                        Educa
                        <span className="brand-name__cube">Cube</span>
                    </span>
                </div>

                <div
                    className="transform-particles-wrapper"
                    data-reveal
                >
                    <Suspense fallback={null}>
                        <TransformDesktop />
                    </Suspense>
                </div>
            </div>
        </section>
    );
}
