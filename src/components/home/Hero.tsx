import { lazy, Suspense } from "react";

import { IconCube } from "./icons";
import { ROUTES } from "./content";

const OwlShowcase = lazy(() => import("../OwlShowcase"));

type HeroProps = {
    
    isFull: boolean;
};

type PhraseWord = {
    text: string;
    
    accent?: boolean;
};


const REVEAL_PHRASE: PhraseWord[] = [
    { text: "que" },
    { text: "se" },
    { text: "transforma" },
    { text: "em" },
    { text: "prática", accent: true },
];





function renderRevealPhrase(words: PhraseWord[]) {
    let letterIndex = 0;

    return words.map((word, wordIndex) => (
        <span className="hero-title__word" key={`${word.text}-${wordIndex}`}>
            {wordIndex > 0 ? "\u00A0" : ""}
            {word.text.split("").map((letter) => {
                const i = letterIndex++;

                return (
                    <span
                        key={i}
                        className={
                            word.accent
                                ? "hero-title__letter hero-title__letter--accent"
                                : "hero-title__letter"
                        }
                        style={{ "--i": i } as React.CSSProperties}
                    >
                        {letter}
                    </span>
                );
            })}
        </span>
    ));
}

export default function Hero({ isFull }: HeroProps) {
    return (
        <section
            className="hero"
            id="inicio"
            aria-labelledby="hero-title"
        >
            <div className="wrap hero-grid">
                <div className="hero-content">
                    <p className="hero-identity">
                        <IconCube className="hero-identity__glyph" />

                        <span className="hero-identity__name">
                            Educa
                            <span className="brand-name__cube">
                                Cube
                            </span>
                        </span>
                    </p>

                    <p className="hero-descriptor">
                        Plataforma educacional tecnológica para
                        aprendizagem, planejamento pedagógico e apoio
                        ao professor.
                    </p>

                    <h1 id="hero-title" className="hero-title-reveal">
                        <span className="hero-title__static">Conhecimento</span>{" "}
                        <span
                            className="hero-title__reveal"
                            aria-label="que se transforma em prática"
                        >
                            {renderRevealPhrase(REVEAL_PHRASE)}
                        </span>
                        .
                    </h1>

                    <p className="hero-lede">
                        O EducaCube reúne recursos para diagnóstico,
                        planejamento, fundamentação e intervenção
                        pedagógica em um único ambiente.
                    </p>

                    <div className="hero-actions">
                        <a
                            href="#plataforma"
                            className="btn-solid"
                        >
                            Explorar a plataforma
                        </a>

                        <a
                            href={ROUTES.login}
                            className="btn-ghost btn-ghost--lg"
                        >
                            Entrar na plataforma
                        </a>
                    </div>

                    <div className="hero-links">
                        <a
                            href={ROUTES.biblioteca}
                            className="chalk-link"
                        >
                            Biblioteca digital
                        </a>

                        <a
                            href={ROUTES.atlas}
                            className="chalk-link"
                        >
                            Explorar o mapa da aprendizagem
                        </a>
                    </div>
                </div>

                <figure
                    id="brain-viewport"
                    aria-label="Coruja do EducaCube"
                >
                    <div className="brain-frame">
                        <span className="brain-corner brain-corner--tl" />
                        <span className="brain-corner brain-corner--tr" />
                        <span className="brain-corner brain-corner--bl" />
                        <span className="brain-corner brain-corner--br" />

                        {isFull ? (
                            <Suspense
                                fallback={
                                    <div className="owl-loading" />
                                }
                            >
                                <OwlShowcase />
                            </Suspense>
                        ) : (
                            <img
                                src="/educacubelogo.webp"
                                alt="Coruja do EducaCube"
                                className="owl-mobile-image"
                            />
                        )}
                    </div>

                    <figcaption className="brain-label">
                        <span>Guardiã do laboratório</span>

                        <strong>A coruja do EducaCube</strong>
                    </figcaption>
                </figure>
            </div>
        </section>
    );
}
