import React from "react";
import Particles from "react-tsparticles";
import { loadSeaAnemonePreset } from "tsparticles-preset-sea-anemone";

interface AnemoneProps {
  id?: string;
  className?: string;
  backgroundColor?: string;
  fullScreen?: boolean;
  particleSpeed?: number;
}

const Anemone: React.FC<AnemoneProps> = ({ 
  id = "tsparticles", 
  className = "",
  backgroundColor = "#0a4766",
  fullScreen = true,
  particleSpeed = 2
}) => {
  const customInit = React.useCallback(async (tsParticles: any) => {
    await loadSeaAnemonePreset(tsParticles);
  }, []);

  const options = {
    preset: "seaAnemone",
    particles: {
      move: {
        speed: particleSpeed
      }
    },
    background: {
      color: backgroundColor
    },
    fullScreen: {
      enable: fullScreen,
      zIndex: fullScreen ? -1 : 0
    }
  };

  return (
    <Particles 
      id={id}
      className={className}
      options={options} 
      init={customInit} 
    />
  );
};

export default Anemone;