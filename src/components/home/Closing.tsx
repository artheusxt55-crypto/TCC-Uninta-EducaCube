import BlockTextReveal from "../BlockTextReveal";
import { ROUTES } from "./content";


export default function Closing() {
    return (
        <section
            className="section closing"
            id="encerramento"
            aria-labelledby="closing-title"
        >
            <div className="wrap closing__inner">
                <div
                    id="closing-title"
                    className="closing__statement"
                    role="heading"
                    aria-level={2}
                >
                    <BlockTextReveal
                        text="Uma plataforma para transformar conhecimento em prática pedagógica."
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
                    className="closing__actions"
                    data-reveal
                >
                    <a
                        href={ROUTES.login}
                        className="btn-solid"
                    >
                        Entrar na plataforma
                    </a>

                    <a
                        href="#ferramentas"
                        className="btn-ghost btn-ghost--lg"
                    >
                        Ver os módulos
                    </a>
                </div>
            </div>
        </section>
    );
}
