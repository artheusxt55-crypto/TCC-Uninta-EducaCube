import type { ReactNode } from "react";

import type { Action, ModuleId } from "./content";

type ActionLinkProps = {
    action: Action;
    onOpenModule: (id: ModuleId) => void;
    className?: string;
    children?: ReactNode;
};







export default function ActionLink({
    action,
    onOpenModule,
    className,
    children,
}: ActionLinkProps) {
    if (action.kind === "module") {
        return (
            <button
                type="button"
                className={className}
                onClick={() => onOpenModule(action.id)}
            >
                {children ?? action.label}
            </button>
        );
    }

    return (
        <a
            href={action.href}
            className={className}
        >
            {children ?? action.label}
        </a>
    );
}
