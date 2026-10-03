import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

import {
  useRive,
  useViewModelInstanceBoolean,
  useViewModelInstanceTrigger,
  Layout,
  Fit,
  Alignment,
} from "@rive-app/react-canvas";

export type AuraState =
  | "idle"
  | "listening"
  | "sending"
  | "thinking"
  | "generating"
  | "complete"
  | "speaking"
  | "error"
  | "offline";

interface NeuralOrbProps {
  state: AuraState;
  size?: number;
  audioLevel?: number;
}

export default function NeuralOrb({
  state,
  size = 48,
  audioLevel = 0,
}: NeuralOrbProps) {
  const reducedMotion = useReducedMotion();

  const previousStateRef = useRef<AuraState>(state);

  const { rive, RiveComponent } = useRive({
    src: "/ai-orb-mascot.riv",
    autoplay: !reducedMotion,
    autoBind: true,

    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
  });

  const vmInstance = rive?.viewModelInstance;

    
                                                                 
                      
                                                                 
     

  const { setValue: setLoading } =
    useViewModelInstanceBoolean(
      "loadingBoolean",
      vmInstance
    );

  const { setValue: setTyping } =
    useViewModelInstanceBoolean(
      "typingBoolean",
      vmInstance
    );

  const { trigger: fireCorrect } =
    useViewModelInstanceTrigger(
      "correct",
      vmInstance
    );

  const { trigger: fireWrong } =
    useViewModelInstanceTrigger(
      "wrong",
      vmInstance
    );

  const { trigger: fireJump } =
    useViewModelInstanceTrigger(
      "jump",
      vmInstance
    );

    
                                                                 
                
    
                                                   
                                                                 
     

  useEffect(() => {
    if (!setLoading || !setTyping) return;

    switch (state) {
        
                                                    
         
      case "sending":
      case "thinking":
      case "generating":
        setLoading(true);
        setTyping(false);
        break;

        
                                      
         
      case "speaking":
        setLoading(false);
        setTyping(true);
        break;

        
                         
         
      case "idle":
      case "complete":
      case "offline":
      case "error":
      case "listening":
      default:
        setLoading(false);
        setTyping(false);
        break;
    }
  }, [
    state,
    setLoading,
    setTyping,
  ]);

    
                                                                 
                     
                                                                 
     

  useEffect(() => {
    const previousState =
      previousStateRef.current;

      
                         
       
    if (
      previousState !== "complete" &&
      state === "complete"
    ) {
      fireCorrect?.();
    }

      
           
       
    if (
      previousState !== "error" &&
      state === "error"
    ) {
      fireWrong?.();
    }

      
                              
       
    if (
      previousState !== "listening" &&
      state === "listening"
    ) {
      fireJump?.();
    }

    previousStateRef.current = state;
  }, [
    state,
    fireCorrect,
    fireWrong,
    fireJump,
  ]);

    
                                                                 
              
                                                                 
     

  useEffect(() => {
    if (!rive) return;

    if (reducedMotion) {
      rive.pause();
    } else {
      rive.play();
    }
  }, [
    rive,
    reducedMotion,
  ]);

    
                                                                 
                
    
                                           
                                                
                                     
                                                                 
     

  useEffect(() => {
    void audioLevel;
  }, [audioLevel]);

    
                                                                 
           
                                                                 
     

  return (
    <div
      className={`aura-orb aura-orb-${state}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        position: "relative",
        display: "block",
        flex: "0 0 auto",
        overflow: "visible",
        lineHeight: 0,
      }}
      aria-hidden="true"
    >
      <RiveComponent
        style={{
          width: "100%",
          height: "100%",
          minWidth: "100%",
          minHeight: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
