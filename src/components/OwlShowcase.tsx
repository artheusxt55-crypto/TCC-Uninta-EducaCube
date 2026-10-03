import { useEffect, useRef } from "react";


export default function EducaCubeOwl() {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }
        const reducedMotionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        const applyMotionPreference = () => {
            if (reducedMotionQuery.matches) {
                video.pause();
                video.currentTime = 0;
            } else {
                video.play().catch(() => {
                                                                      
                                                                          
                });
            }
        };

        applyMotionPreference();

        reducedMotionQuery.addEventListener(
            "change",
            applyMotionPreference
        );

        return () => {
            reducedMotionQuery.removeEventListener(
                "change",
                applyMotionPreference
            );
        };
    }, []);

    return (
        <video
            ref={videoRef}
            className="owl-mobile-image edu-cube-owl"
            src="/owl-educacube.webm"
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            aria-hidden="true"
        />
    );
}
