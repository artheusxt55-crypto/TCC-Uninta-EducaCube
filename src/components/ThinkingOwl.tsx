import { useEffect } from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";

interface ThinkingOwlProps {
  awake: boolean;                                     
  size?: number;
}

export default function ThinkingOwl({ awake, size = 64 }: ThinkingOwlProps) {
  const { rive, RiveComponent } = useRive({
    src: "/aura-owl.riv",
    artboard: "Main",
    stateMachines: "State Machine 1",
    autoplay: true,
  });

  const awakeInput = useStateMachineInput(
    rive,
    "State Machine 1",
    "awake"
  );

  useEffect(() => {
    if (awakeInput) {
      awakeInput.value = awake;
    }
  }, [awake, awakeInput]);

  return (
    <div
      className="aura-owl-wrap"
      style={{ width: size, height: size }}
    >
      <RiveComponent />
    </div>
  );
}
