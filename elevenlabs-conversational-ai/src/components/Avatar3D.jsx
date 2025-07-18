import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Avatar component yang akan di-render di dalam Canvas
function AvatarModel({ isSpeaking, audioData, currentEmotion }) {
  const meshRef = useRef();
  const mixerRef = useRef();
  const [gltf, setGltf] = useState(null);
  const [animations, setAnimations] = useState([]);
  const [wolf3DHead, setWolf3DHead] = useState(null);
  const speakingTimeRef = useRef(0);

  // Load GLTF model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/kevins-3.glb',
      (loadedGltf) => {
        console.log('GLTF loaded successfully:', loadedGltf);
        setGltf(loadedGltf);
        
        // Setup animation mixer (but we won't use body animations)
        if (loadedGltf.animations && loadedGltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(loadedGltf.scene);
          mixerRef.current = mixer;
          setAnimations(loadedGltf.animations);
          // Note: We intentionally don't play any body animations
        }
        
        // Find Wolf3D_Head mesh specifically
        let foundWolf3DHead = null;
        loadedGltf.scene.traverse((child) => {
          console.log('Traversing child:', child.name, child.type);
          
          if (child.isMesh && child.name === 'Wolf3D_Head') {
            console.log('Found Wolf3D_Head mesh!');
            console.log('Has morph targets:', !!child.morphTargetInfluences);
            console.log('Morph target dictionary:', child.morphTargetDictionary);
            console.log('Number of morph targets:', child.morphTargetInfluences?.length);
            foundWolf3DHead = child;
          }
        });
        
        if (foundWolf3DHead) {
          setWolf3DHead(foundWolf3DHead);
          console.log("Wolf3D_Head set successfully");

          // Set default mouthAngry expression
          const mouthAngryIndex = foundWolf3DHead.morphTargetDictionary?.["mouthAngry"];
          if (mouthAngryIndex !== undefined && mouthAngryIndex < foundWolf3DHead.morphTargetInfluences.length) {
            foundWolf3DHead.morphTargetInfluences[mouthAngryIndex] = 0.28;
            console.log("Default mouthAngry set to 0.28");
          }
        } else {
          console.warn("Wolf3D_Head mesh not found in the model");
        }
      },
      (progress) => {
        console.log("Loading progress:", (progress.loaded / progress.total) * 100 + "%");
      },
      (error) => {
        console.error("Error loading GLTF:", error);
      }
    );
  }, []);

  // Apply facial expression based on emotion
  const applyFacialExpression = (emotion, intensity = 1.0) => {
    if (!wolf3DHead || !wolf3DHead.morphTargetDictionary || !wolf3DHead.morphTargetInfluences) {
      console.log("Wolf3D_Head not available for morph target manipulation");
      return;
    }

    console.log("Applying facial expression:", emotion, "with intensity:", intensity);
    console.log("Available morph targets:", Object.keys(wolf3DHead.morphTargetDictionary));

    // Reset all emotion-related blend shapes to 0
    const mouthSmileIndex = wolf3DHead.morphTargetDictionary?.["mouthSmile"];
    const mouthAngryIndex = wolf3DHead.morphTargetDictionary?.["mouthAngry"];

    if (mouthSmileIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthSmileIndex] = 0;
    if (mouthAngryIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthAngryIndex] = 0;

    // Apply emotion-specific blend shapes
    if (emotion === "marah") {
      if (mouthAngryIndex !== undefined && mouthAngryIndex < wolf3DHead.morphTargetInfluences.length) {
        wolf3DHead.morphTargetInfluences[mouthAngryIndex] = 1.0 * intensity;
        console.log("Applied mouthAngry for anger:", 1.0 * intensity);
      }
    } else if (emotion === "senang") {
      if (mouthSmileIndex !== undefined && mouthSmileIndex < wolf3DHead.morphTargetInfluences.length) {
        wolf3DHead.morphTargetInfluences[mouthSmileIndex] = 1.0 * intensity;
        console.log("Applied mouthSmile for happiness:", 1.0 * intensity);
      }
    } else { // For neutral or other emotions, ensure they are 0
      if (mouthSmileIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthSmileIndex] = 0;
      if (mouthAngryIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthAngryIndex] = 0;
    }
  };

  // Handle emotion changes
  useEffect(() => {
    if (currentEmotion && currentEmotion.emotion) {
      const intensity = currentEmotion.confidence || 1.0;
      console.log("Emotion changed - applying facial expression:", currentEmotion.emotion, "with intensity:", intensity);
      applyFacialExpression(currentEmotion.emotion, intensity);
    } else {
      // Reset facial expression to 0 when no specific emotion is detected
      console.log("No emotion detected - resetting to 0");
      if (wolf3DHead && wolf3DHead.morphTargetInfluences) {
        const mouthSmileIndex = wolf3DHead.morphTargetDictionary?.["mouthSmile"];
        const mouthAngryIndex = wolf3DHead.morphTargetDictionary?.["mouthAngry"];
        if (mouthSmileIndex !== undefined) {
          wolf3DHead.morphTargetInfluences[mouthSmileIndex] = 0;
        }
        if (mouthAngryIndex !== undefined) {
          wolf3DHead.morphTargetInfluences[mouthAngryIndex] = 0;
        }
      }
    }
  }, [currentEmotion, wolf3DHead]);

  // Animation loop - ONLY blend shapes, NO body/head movement
  useFrame((state, delta) => {
    // NO mixer updates - we don't want any body animations
    // NO head movement - character stays completely still
    
    // ONLY mouthOpen animation when speaking (0 to 1 repeatedly)
    if (wolf3DHead && wolf3DHead.morphTargetDictionary && wolf3DHead.morphTargetInfluences && isSpeaking) {
      const mouthOpenIndex = wolf3DHead.morphTargetDictionary['mouthOpen'];
      
      if (mouthOpenIndex !== undefined && mouthOpenIndex < wolf3DHead.morphTargetInfluences.length) {
        // Update speaking time
        speakingTimeRef.current += delta;
        
        // Create oscillating value from 0 to 1 (sine wave)
        const frequency = 4; // How fast the mouth opens/closes (cycles per second)
        const mouthOpenValue = (Math.sin(speakingTimeRef.current * frequency * Math.PI) + 1) / 2; // Normalize to 0-1
        
        wolf3DHead.morphTargetInfluences[mouthOpenIndex] = mouthOpenValue;
        
        // Log occasionally for debugging
        if (Math.floor(speakingTimeRef.current * 10) % 10 === 0) {
          console.log('mouthOpen value:', mouthOpenValue.toFixed(3));
        }
      } else {
        console.warn('mouthOpen morph target not found in Wolf3D_Head');
      }
    } else if (wolf3DHead && wolf3DHead.morphTargetInfluences && !isSpeaking) {
      // Reset mouthOpen when not speaking
      const mouthOpenIndex = wolf3DHead.morphTargetDictionary?.['mouthOpen'];
      if (mouthOpenIndex !== undefined) {
        wolf3DHead.morphTargetInfluences[mouthOpenIndex] = 0;
        speakingTimeRef.current = 0; // Reset speaking time
      }
    }
  });

  if (!gltf) {
    return null;
  }

  return (
    <primitive 
      ref={meshRef}
      object={gltf.scene} 
      scale={[2.0, 2.0, 2.0]}  // Slightly larger for better face visibility
      position={[0, -2.0, 0]}  // Lowered position so camera can focus on face
      rotation={[0, 0, 0]}     // No rotation - face forward
    />
  );
}

// Main Avatar3D component
export default function Avatar3D({ isSpeaking = false, audioData = [], currentEmotion = null }) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ 
          position: [0, 1.5, 2.5],  // Higher camera position to focus on face
          fov: 45,                  // Narrower field of view for closer face shot
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting optimized for face visibility */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 2, 2]} intensity={1.2} />
        <directionalLight position={[-2, 2, 2]} intensity={0.8} />
        <pointLight position={[0, 2, 3]} intensity={0.6} />
        
        {/* Environment for better lighting */}
        <Environment preset="studio" />
        
        {/* Avatar Model */}
        <AvatarModel 
          isSpeaking={isSpeaking} 
          audioData={audioData}
          currentEmotion={currentEmotion}
        />
        
        {/* Controls for user interaction - limited to prevent too much movement */}
        <OrbitControls 
          enablePan={false}           // Disable panning
          enableZoom={true}           // Allow zoom for closer inspection
          enableRotate={true}         // Allow rotation to see different angles
          maxPolarAngle={Math.PI / 2} // Limit vertical rotation
          minPolarAngle={Math.PI / 4} // Limit vertical rotation
          maxAzimuthAngle={Math.PI / 4}  // Limit horizontal rotation
          minAzimuthAngle={-Math.PI / 4} // Limit horizontal rotation
          minDistance={1.5}           // Minimum zoom distance
          maxDistance={4}             // Maximum zoom distance
          target={[0, 1.0, 0]}        // Focus target on face area (higher)
        />
      </Canvas>
    </div>
  );
}

