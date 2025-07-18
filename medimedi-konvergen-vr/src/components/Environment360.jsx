import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { useRef, useEffect } from 'react';

export function Environment360() {
  const texture = useLoader(TextureLoader, '/environment.jpg');
  const sphereRef = useRef();

  useEffect(() => {
    if (texture && sphereRef.current) {
      // Flip the texture horizontally for proper 360 display
      texture.flipY = false;
      texture.needsUpdate = true;
    }
  }, [texture]);
  
  return (
    <mesh ref={sphereRef} scale={[-1, -1, 1]}>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial map={texture} side={2} />
    </mesh>
  );
}

