import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Text, TrackballControls } from '@react-three/drei';
import * as THREE from 'three';

interface WordProps {
  children: string;
  fontSize?: number;
  position: [number, number, number];
  isLoading: boolean;
  onLoadComplete: () => void;
}

interface TagItem {
  position: [number, number, number];
  word: string;
  size: number;
}

interface WordData {
  text: string;
  size: number;
}

interface OrganizedTagCloudProps {
  onLoadComplete: () => void;
  words?: WordData[];
}

function Word({ children, fontSize, isLoading, onLoadComplete, ...props }: WordProps) {
  const color = new THREE.Color();
  const fontProps = { 
    fontSize: fontSize || 2.5, 
    letterSpacing: -0.05, 
    lineHeight: 1, 
  };
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
  };
  
  const out = () => setHovered(false);
  
  useEffect(() => {
    if (hovered) document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);
  
  const calculateRotation = (position: [number, number, number]) => {
    const [x, _ , z] = position;
    
    const horizontalAngle = Math.atan2(z, x);
    
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), horizontalAngle + Math.PI / 4);
    
    return quaternion;
  };
  
  useFrame(({ clock }) => {
    if (ref.current) {
      try {
        const material = ref.current.material as THREE.MeshBasicMaterial;
        if (material && material.color) {
          material.color.lerp(color.set(hovered ? '#ffcc00' : 'white'), 0.1);
        }
        
        const time = clock.getElapsedTime();
        const wobble = Math.sin(time + props.position[0] * 0.5) * 0.15;
        ref.current.position.y += wobble * 0.01;
        
        if (isLoading === false) {
          if (ref.current.scale.x > 0.01) {
            ref.current.scale.x *= 0.9;
            ref.current.scale.y *= 0.9;
            ref.current.scale.z *= 0.9;
          } else {
           
            if (ref.current.scale.x > 0.001) {
              onLoadComplete();
              ref.current.scale.set(0, 0, 0);
            }
          }
        }
      } catch (error) {
        console.error("Error in animation frame:", error);
      }
    }
  });
  
  return (
    <Billboard {...props} quaternion={calculateRotation(props.position as [number, number, number])}>
      <Text 
        ref={ref} 
        onPointerOver={over} 
        onPointerOut={out} 
        onClick={() => console.log(`Clicked on: ${children}`)} 
        {...fontProps}
      >
        {children}
      </Text>
    </Billboard>
  );
}

function TagCloud({ isLoading, onLoadComplete, words }: { isLoading: boolean, onLoadComplete: () => void, words?: WordData[] }) {
  const defaultWords: WordData[] = [
    { text: "hand", size: 4.0 },
    { text: "history", size: 3.8 },
    { text: "piece", size: 3.8 },
    { text: "habit", size: 3.5 },
    { text: "band", size: 3.5 },
    { text: "dollar", size: 3.5 },
    { text: "bank", size: 3.5 },
    { text: "success", size: 3.2 },
    { text: "fish", size: 3.2 },
    { text: "pure", size: 3.2 },
    { text: "number", size: 3.2 },
    { text: "clay", size: 3.2 },
    { text: "baby", size: 3.0 },
    { text: "watch", size: 3.0 },
    { text: "dawn", size: 3.0 },
    { text: "cloud", size: 3.7 },
    { text: "dream", size: 3.6 },
    { text: "future", size: 3.9 },
    { text: "space", size: 3.4 },
    { text: "journey", size: 3.3 },
    { text: "magic", size: 3.7 },
    { text: "book", size: 3.1 },
    { text: "ocean", size: 3.8 },
    { text: "light", size: 3.6 },
    { text: "music", size: 3.9 },
    { text: "nature", size: 3.5 },
    { text: "science", size: 3.2 },
    { text: "love", size: 4.0 },
    { text: "art", size: 3.7 },
    { text: "mind", size: 3.6 },
    { text: "world", size: 3.8 },
    { text: "idea", size: 3.4 },
    { text: "time", size: 3.6 },
    { text: "life", size: 4.0 },
    { text: "power", size: 3.5 },
    { text: "heart", size: 3.7 },
    { text: "fire", size: 3.3 },
    { text: "water", size: 3.4 },
    { text: "earth", size: 3.3 },
    { text: "wind", size: 3.2 },
    { text: "star", size: 3.5 },
    { text: "moon", size: 3.4 },
    { text: "sun", size: 3.6 },
    { text: "joy", size: 3.2 },
    { text: "peace", size: 3.5 },
    { text: "hope", size: 3.6 },
    { text: "truth", size: 3.7 },
    { text: "faith", size: 3.4 },
    { text: "wisdom", size: 3.8 },
    { text: "beauty", size: 3.7 }
  ];
  
  const wordList = words || defaultWords;
  
  const [completedCount, setCompletedCount] = useState(0);
  const totalWords = wordList.length;
  
  useEffect(() => {
    if (completedCount >= totalWords && !isLoading) {
      onLoadComplete();
    }
  }, [completedCount, totalWords, isLoading, onLoadComplete]);
  
  const handleWordComplete = () => {
    setCompletedCount(prev => prev + 1);
  };
  
  const tagItems = useMemo(() => {
    try {
      const temp: TagItem[] = [];
      const radius = 18;
      const words_count = wordList.length;
      
      const numSpirals = 10; 
      const turnsPerSpiral = 8; 
      
      const poleWords = 1;
      
      if (poleWords > 0 && wordList.length > 0) {
        temp.push({
          position: [0, radius, 0],
          word: wordList[0].text,
          size: wordList[0].size * 0.6
        });
        
        if (wordList.length > 1) {
          temp.push({
            position: [0, -radius, 0], 
            word: wordList[1].text,
            size: wordList[1].size * 0.6
          });
        }
      }
      
 
      for (let i = poleWords * 2; i < wordList.length; i++) {
        const wordIndex = i - (poleWords * 2);
        const spiralIndex = wordIndex % numSpirals;
        const itemInSpiral = Math.floor(wordIndex / numSpirals);
        const itemsPerSpiral = Math.ceil((words_count - (poleWords * 2)) / numSpirals);
        
        const spiralProgress = 0.1 + (itemInSpiral / itemsPerSpiral) * 0.8;
        
        const phase = spiralIndex * 0.2;
        const theta = 2 * Math.PI * turnsPerSpiral * (spiralProgress + phase) + (2 * Math.PI * spiralIndex / numSpirals);
        const phi = Math.PI * spiralProgress; 
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        const sizeFactor = 0.9 + Math.abs(Math.cos(phi)) * 0.2;
        
        temp.push({
          position: [x, y, z],
          word: wordList[i].text,
          size: wordList[i].size * 0.5 * sizeFactor
        });
      }
      
      return temp;
    } catch (error) {
      console.error("Error creating tag items:", error);
      return [];
    }
  }, [wordList]);

  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 1.0; 
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {tagItems.map((tag, i) => (
        <Word 
          key={i} 
          position={tag.position} 
          fontSize={tag.size}
          isLoading={isLoading}
          onLoadComplete={handleWordComplete}
        >
          {tag.word}
        </Word>
      ))}
    </group>
  );
}

export default function OrganizedTagCloud({ onLoadComplete, words }: OrganizedTagCloudProps) {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div style={{ width: "100%", height: "100vh", background: "#111111", position: "relative" }}>
      <Canvas 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, 45], fov: 60 }} 
        style={{ background: '#111111' }}
      >
        <color attach="background" args={['#111111']} />
        <fog attach="fog" args={['#111111', 20, 80]} />
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <TagCloud 
            isLoading={loading} 
            onLoadComplete={onLoadComplete}
            words={words}
          />
        </Suspense>
        <TrackballControls 
          rotateSpeed={2}
          zoomSpeed={0.5}
          panSpeed={0.5}
          enabled={loading}
        />
      </Canvas>
    </div>
  );
}