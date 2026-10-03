import { useEffect } from "react";

   
                                                                 
                             
  
                                                                   
                                                                     
                                                             
                                                                     
                                                            
   
export function useReveal(refreshKey?: unknown) {
    useEffect(() => {
        const targets = Array.from(
            document.querySelectorAll<HTMLElement>("[data-reveal]")
        );

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reduceMotion || !("IntersectionObserver" in window)) {
            targets.forEach((element) =>
                element.classList.add("is-visible")
            );
            return;
        }

        const root = document.documentElement;
        root.classList.add("reveal-ready");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.15,
                rootMargin: "0px 0px -6% 0px",
            }
        );

        targets.forEach((element) => {
            if (!element.classList.contains("is-visible")) {
                observer.observe(element);
            }
        });

        return () => {
            observer.disconnect();
            root.classList.remove("reveal-ready");
        };
    }, [refreshKey]);
}
