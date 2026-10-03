import type { ReactNode } from "react";







type IconProps = {
    className?: string;
};

function Svg({
    className,
    strokeWidth = 1.5,
    children,
}: IconProps & {
    strokeWidth?: number;
    children: ReactNode;
}) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export function IconCube({ className }: IconProps) {
    return (
        <Svg className={className} strokeWidth={1.4}>
            <path d="M12 3 L20.5 7.5 V16.5 L12 21 L3.5 16.5 V7.5 Z" />
            <path d="M3.5 7.5 L12 12 L20.5 7.5" />
            <path d="M12 12 V21" />
        </Svg>
    );
}

export function IconDiagnostico({ className }: IconProps) {
    return (
        <Svg className={className}>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 L21 21" />
        </Svg>
    );
}

export function IconBncc({ className }: IconProps) {
    return (
        <Svg className={className}>
            <path d="M4 5.5 C6.5 4.2 9 4.2 12 5.5 C15 4.2 17.5 4.2 20 5.5 V18.5 C17.5 17.2 15 17.2 12 18.5 C9 17.2 6.5 17.2 4 18.5 Z" />
            <path d="M12 5.5 V18.5" />
        </Svg>
    );
}

export function IconPlanejamento({ className }: IconProps) {
    return (
        <Svg className={className}>
            <rect x="4" y="4" width="16" height="16" rx="1" />
            <path d="M8 9 H16 M8 13 H16 M8 17 H12.5" />
        </Svg>
    );
}

export function IconIntervencao({ className }: IconProps) {
    return (
        <Svg className={className}>
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2.5 V5 M12 19 V21.5" />
        </Svg>
    );
}

export function IconBiblioteca({ className }: IconProps) {
    return (
        <Svg className={className}>
            <path d="M5 4 V20 M10 4 V20 M15 6 L19.5 19" />
            <path d="M3.5 20 H20.5" />
        </Svg>
    );
}

export function IconMapa({ className }: IconProps) {
    return (
        <Svg className={className}>
            <circle cx="6" cy="17" r="2" />
            <circle cx="12" cy="7" r="2" />
            <circle cx="18" cy="15" r="2" />
            <path d="M7.2 15.4 L10.8 8.6 M13.8 8.2 L16.6 13.2" />
        </Svg>
    );
}

export function IconAura({ className }: IconProps) {
    return (
        <Svg className={className}>
            <circle cx="12" cy="12" r="2.2" />
            <path d="M7.6 7.6 A6.2 6.2 0 0 0 7.6 16.4" />
            <path d="M16.4 7.6 A6.2 6.2 0 0 1 16.4 16.4" />
            <path d="M4.8 4.8 A10.2 10.2 0 0 0 4.8 19.2" />
            <path d="M19.2 4.8 A10.2 10.2 0 0 1 19.2 19.2" />
        </Svg>
    );
}

export function IconAprendizagem({ className }: IconProps) {
    return (
        <Svg className={className}>
            <path d="M3 9 L12 4.5 L21 9 L12 13.5 Z" />
            <path d="M7 11.5 V16 C9.5 18 14.5 18 17 16 V11.5" />
        </Svg>
    );
}

export function IconArrow({ className }: IconProps) {
    return (
        <Svg className={className} strokeWidth={1.6}>
            <path d="M5 12 H19 M13.5 6.5 L19 12 L13.5 17.5" />
        </Svg>
    );
}

export function IconMenu() {
    return (
        <Svg strokeWidth={1.6}>
            <path d="M4 7 H20 M4 12 H20 M4 17 H20" />
        </Svg>
    );
}

export function IconClose() {
    return (
        <Svg strokeWidth={1.6}>
            <path d="M5 5 L19 19 M19 5 L5 19" />
        </Svg>
    );
}

export function IconCookie() {
    return (
        <Svg>
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="14" cy="9" r="1" fill="currentColor" stroke="none" />
            <circle cx="13" cy="14.5" r="1" fill="currentColor" stroke="none" />
        </Svg>
    );
}
