import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface TransformParticlesProps {
    words?: string[];
    color?: string;
    particleCount?: number;
    cursorStrength?: number;
    cursorReach?: number;
    cursorDamping?: number;
}

const DEFAULT_WORDS = [
    "EducaCube",
    "Conhecimento",
    "Em Todas",
    "Dimensões",
];

type PointTarget = Float32Array;

function createTextPoints(
    text: string,
    count: number,
    fontSize = 190,
): PointTarget {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return new Float32Array(count * 3);
    }

    canvas.width = 1600;
    canvas.height = 500;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${fontSize}px "Inter", "Arial", sans-serif`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = image.data;

    const candidates: Array<[number, number]> = [];

                                                                          
                                                             
    const stride = 5;

    for (let y = 0; y < canvas.height; y += stride) {
        for (let x = 0; x < canvas.width; x += stride) {
            const alpha = pixels[(y * canvas.width + x) * 4 + 3];

            if (alpha > 120) {
                candidates.push([x, y]);
            }
        }
    }

    const result = new Float32Array(count * 3);

    if (candidates.length === 0) {
        return result;
    }

                                                                            
                   
    for (let i = 0; i < count; i++) {
        const index = Math.floor(
            (i / count) * candidates.length
        );
        const [x, y] = candidates[index];

        result[i * 3] = (x - canvas.width / 2) * 0.0065;
        result[i * 3 + 1] = -(y - canvas.height / 2) * 0.0065;
        result[i * 3 + 2] = 0;
    }

    return result;
}

export default function TransformParticles({
    words = DEFAULT_WORDS,
    color = "#B56CFF",
    particleCount = 900,
    cursorStrength = 0.08,
    cursorReach = 2.8,
    cursorDamping = 0.08,
}: TransformParticlesProps) {
    const mountRef = useRef<HTMLDivElement | null>(null);

    const wordsRef = useRef(words);
    const colorRef = useRef(color);

    useEffect(() => {
        wordsRef.current = words?.length ? words : DEFAULT_WORDS;
        colorRef.current = color;
    }, [words, color]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        let disposed = false;
        let animationFrame = 0;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            35,
            Math.max(mount.clientWidth, 1) /
                Math.max(mount.clientHeight, 1),
            0.1,
            100
        );
        camera.position.set(0, 0, 11);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        });

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 2)
        );
        const getSize = () => ({
            width: Math.max(mount.clientWidth || 0, 320),
            height: Math.max(mount.clientHeight || 0, 420),
        });

        const initialSize = getSize();

        renderer.setSize(
            initialSize.width,
            initialSize.height,
            false
        );
        renderer.setClearColor(0x000000, 0);

        mount.appendChild(renderer.domElement);

        const count = Math.max(100, particleCount);

        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        const geometry = new THREE.BufferGeometry();

        const positionAttribute = new THREE.BufferAttribute(
            positions,
            3
        );
        geometry.setAttribute("position", positionAttribute);

        const material = new THREE.PointsMaterial({
            color: colorRef.current,
            size: 0.052,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const buildTargets = () => {
            const activeWords =
                wordsRef.current?.length > 0
                    ? wordsRef.current
                    : DEFAULT_WORDS;

            return activeWords.map((word) =>
                createTextPoints(word, count)
            );
        };

        let targets = buildTargets();

                                                                     
        positions.set(targets[0]);

                           
        let currentIndex = 0;
        let nextIndex = 1 % targets.length;

        const holdDuration = 1500;
        const transitionDuration = 1250;

        let phaseStart = performance.now();
        let phase: "hold" | "transition" = "hold";

        const mouse = new THREE.Vector2();
        const mouseWorld = new THREE.Vector3();
        const smoothMouse = new THREE.Vector3();

        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(
            new THREE.Vector3(0, 0, 1),
            0
        );

        const onPointerMove = (event: PointerEvent) => {
            const rect = mount.getBoundingClientRect();

            const nx =
                ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const ny =
                -((event.clientY - rect.top) / rect.height) * 2 + 1;

            mouse.set(nx, ny);

            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, mouseWorld);
        };

        mount.addEventListener("pointermove", onPointerMove);

        const onResize = () => {
            const { width, height } = getSize();

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height, false);
            renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, 2)
            );
        };

        window.addEventListener("resize", onResize);

        const easeInOut = (value: number) => {
            const t = Math.max(0, Math.min(1, value));
            return t * t * (3 - 2 * t);
        };

        const easeIn = (value: number) => {
            const t = Math.max(0, Math.min(1, value));
            return t * t * t;
        };

        const easeOut = (value: number) => {
            const t = Math.max(0, Math.min(1, value));
            return 1 - Math.pow(1 - t, 3);
        };

        const startTransition = (now: number) => {
            phase = "transition";
            phaseStart = now;
            nextIndex =
                (currentIndex + 1) % targets.length;
        };

        const finishTransition = (now: number) => {
            currentIndex = nextIndex;
            nextIndex =
                (currentIndex + 1) % targets.length;

                                                                        
                                                              
            positions.set(targets[currentIndex]);
            positionAttribute.needsUpdate = true;

            phase = "hold";
            phaseStart = now;
        };

        const rebuildTargetsIfNeeded = () => {
            const nextWords =
                wordsRef.current?.length > 0
                    ? wordsRef.current
                    : DEFAULT_WORDS;

            if (nextWords.length !== targets.length) {
                targets = buildTargets();

                currentIndex = 0;
                nextIndex =
                    targets.length > 1 ? 1 : 0;

                positions.set(targets[0]);
                positionAttribute.needsUpdate = true;

                phase = "hold";
                phaseStart = performance.now();
            }
        };

        const animate = (now: number) => {
            if (disposed) return;

            animationFrame = requestAnimationFrame(animate);

            rebuildTargetsIfNeeded();

            if (targets.length === 0) return;

            if (
                phase === "hold" &&
                now - phaseStart >= holdDuration
            ) {
                startTransition(now);
            }

            if (
                phase === "transition" &&
                now - phaseStart >= transitionDuration
            ) {
                finishTransition(now);
            }

            if (phase === "transition") {
                const raw =
                    (now - phaseStart) /
                    transitionDuration;

                const t = Math.max(0, Math.min(1, raw));

                                       
                const outgoing = easeIn(t);
                const incoming = easeOut(t);

                const oldTarget = targets[currentIndex];
                const newTarget = targets[nextIndex];

                const fallDistance = 1.65;
                const enterDistance = 1.65;

                                                                           
                                                                            
                                               
                const rotation =
                    Math.sin(t * Math.PI) * 0.12;

                const cosR = Math.cos(rotation);
                const sinR = Math.sin(rotation);

                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;

                    const ox = oldTarget[i3];
                    const oy = oldTarget[i3 + 1];
                    const oz = oldTarget[i3 + 2];

                    const nx = newTarget[i3];
                    const ny = newTarget[i3 + 1];
                    const nz = newTarget[i3 + 2];

                                                            
                    const oldX = ox;
                    const oldY = oy - fallDistance * outgoing;
                    const oldZ = oz;

                                                               
                    const newX = nx;
                    const newY =
                        ny + enterDistance * (1 - incoming);
                    const newZ = nz;

                                                                
                    const blend = easeInOut(t);

                    const baseX =
                        oldX * (1 - blend) + newX * blend;
                    const baseY =
                        oldY * (1 - blend) + newY * blend;
                    const baseZ =
                        oldZ * (1 - blend) + newZ * blend;

                    positions[i3] =
                        baseX * cosR - baseZ * sinR;

                    positions[i3 + 1] = baseY;

                    positions[i3 + 2] =
                        baseX * sinR + baseZ * cosR;
                }
            } else {
                const target = targets[currentIndex];

                                                                              
                const breathe =
                    Math.sin(now * 0.0015) * 0.018;

                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;

                    positions[i3] = target[i3];
                    positions[i3 + 1] =
                        target[i3 + 1] + breathe;
                    positions[i3 + 2] =
                        target[i3 + 2];
                }
            }

                                                                             
            smoothMouse.lerp(
                mouseWorld,
                Math.max(
                    0.01,
                    Math.min(0.35, cursorDamping)
                )
            );

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;

                const dx =
                    smoothMouse.x - positions[i3];
                const dy =
                    smoothMouse.y - positions[i3 + 1];

                const distance = Math.sqrt(
                    dx * dx + dy * dy
                );

                if (distance < cursorReach) {
                    const influence =
                        (1 - distance / cursorReach) *
                        cursorStrength;

                    velocities[i3] +=
                        dx * influence;
                    velocities[i3 + 1] +=
                        dy * influence;
                }

                velocities[i3] *= 0.88;
                velocities[i3 + 1] *= 0.88;

                positions[i3] += velocities[i3];
                positions[i3 + 1] += velocities[i3 + 1];
            }

            positionAttribute.needsUpdate = true;

                                               
            points.rotation.y =
                Math.sin(now * 0.00035) * 0.035;

            renderer.render(scene, camera);
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            disposed = true;

            cancelAnimationFrame(animationFrame);

            mount.removeEventListener(
                "pointermove",
                onPointerMove
            );
            window.removeEventListener(
                "resize",
                onResize
            );

            geometry.dispose();
            material.dispose();
            renderer.dispose();

            if (renderer.domElement.parentNode === mount) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, [
        particleCount,
        cursorStrength,
        cursorReach,
        cursorDamping,
    ]);

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minHeight: "420px",
                position: "relative",
                overflow: "hidden",
                background: "transparent",
                border: "none",
                boxShadow: "none",
            }}
            aria-label="Animação de partículas formando palavras"
        />
    );
}
