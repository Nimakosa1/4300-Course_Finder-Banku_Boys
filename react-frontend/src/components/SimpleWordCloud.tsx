import { Canvas } from '@react-three/fiber';
import { Text, TrackballControls } from '@react-three/drei';

function SimpleWordCloud() {
  return (
    <div style={{ 
      width: "100vw", 
      height: "100vh", 
      margin: 0, 
      padding: 0, 
      overflow: "hidden",
      background: "#111111" 
    }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
        <Text
          position={[0, 2, 0]}
          color="white"
          fontSize={1}
        >
          CourseFinder
        </Text>
        <TrackballControls />
      </Canvas>

     
    </div>
  );
}

export default SimpleWordCloud;