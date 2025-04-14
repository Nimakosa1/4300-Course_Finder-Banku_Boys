import { useCallback, useMemo } from "react";
import Particles from "react-tsparticles";
import type { Container, Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";
import type { RecursivePartial, IOptions, InteractivityDetect } from "tsparticles-engine";

interface BackgroundMaskParticlesProps {
  className?: string;
  backgroundImage?: string;
}

const FixedBackgroundMaskParticles = ({ 
  className,
  // backgroundImage = "background.jpeg" 
  backgroundImage ="public/bg_afternoon_summer.svg"
}: BackgroundMaskParticlesProps) => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log("Particles container loaded", container);
  }, []);

  // Use useMemo to prevent unnecessary recalculations of the options
  const options = useMemo<RecursivePartial<IOptions>>(() => {
    return {
      fpsLimit: 60,
      particles: {
        number: {
          value: 80,
          density: {
            enable: true,
            value_area: 800
          }
        },
        color: {
          value: "#ffffff",
        },
        shape: {
          type: "circle",
          stroke: {
            width: 0,
            color: "#000000"
          },
          polygon: {
            nb_sides: 5
          },
          image: {
            src: "images/github.svg",
            width: 100,
            height: 100
          }
        },
        opacity: {
          value: 1,
          random: false,
          anim: {
            enable: false,
            speed: 1,
            opacity_min: 0.1,
            sync: false
          }
        },
        size: {
          value: 30,
          random: true,
          anim: {
            enable: false,
            speed: 40,
            size_min: 0.1,
            sync: false
          }
        },
        lineLinks: { 
          enable: true,
          distance: 150,
          color: "#ffffff",
          opacity: 1,
          width: 1
        },
        move: {
          enable: true,
          speed: 2,
          direction: "none",
          random: false,
          straight: false,
          outMode: "out", 
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200
          }
        }
      },
      interactivity: {
        detectOn: "canvas" as InteractivityDetect, 
        events: {
          onHover: {
            enable: true,
            mode: "bubble",
            parallax: {
              enable: false,
              force: 60,
              smooth: 10
            }
          },
          onClick: {
            enable: true,
            mode: "push"
          },
          resize: true
        },
        modes: {
          grab: {
            distance: 400,
            links: { 
              opacity: 1
            }
          },
          bubble: {
            distance: 400,
            size: 100,
            duration: 2,
            opacity: 1,
            speed: 3
          },
          repulse: {
            distance: 200
          },
          push: {
            quantity: 4 
          },
          remove: {
            quantity: 2 
          }
        }
      },
      backgroundMask: {
        enable: true,
        cover: {
            color: {
              value: {
                r: 255,
                g: 255,
                b: 255
              }
            },
            opacity: 1 
          }
      },
      detectRetina: true, 
      background: {
        image: `url('${backgroundImage}')`,
        position: "50% 50%",
        repeat: "no-repeat",
        size: "cover"
      },
      fullScreen: {
        enable: false,
        zIndex: 0
      }
    };
  }, [backgroundImage]); 

  const containerStyle = useMemo(() => {
    return {
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundColor: "#323031",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover"
    } as React.CSSProperties;
  }, []);

  return (
    <Particles
      id="tsparticles"
      className={className}
      init={particlesInit}
      loaded={particlesLoaded}
      options={options}
      style={containerStyle}
    />
  );
};

export default FixedBackgroundMaskParticles;