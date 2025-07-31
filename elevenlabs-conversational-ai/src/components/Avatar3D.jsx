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
    const sedihIndex = wolf3DHead.morphTargetDictionary?.["sedih"];
    const kecewaIndex = wolf3DHead.morphTargetDictionary?.["kecewa"];
    const takutIndex = wolf3DHead.morphTargetDictionary?.["takut"];
    const bingungIndex = wolf3DHead.morphTargetDictionary?.["bingung"];
    const diamIndex = wolf3DHead.morphTargetDictionary?.["diam"];
    const tertawaIndex = wolf3DHead.morphTargetDictionary?.["tertawa"];

    // Reset all morph targets
    if (mouthSmileIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthSmileIndex] = 0;
    if (mouthAngryIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthAngryIndex] = 0;
    if (sedihIndex !== undefined) wolf3DHead.morphTargetInfluences[sedihIndex] = 0;
    if (kecewaIndex !== undefined) wolf3DHead.morphTargetInfluences[kecewaIndex] = 0;
    if (takutIndex !== undefined) wolf3DHead.morphTargetInfluences[takutIndex] = 0;
    if (bingungIndex !== undefined) wolf3DHead.morphTargetInfluences[bingungIndex] = 0;
    if (diamIndex !== undefined) wolf3DHead.morphTargetInfluences[diamIndex] = 0;
    if (tertawaIndex !== undefined) wolf3DHead.morphTargetInfluences[tertawaIndex] = 0;

    // Apply emotion-specific blend shapes
    if (emotion === "marah") {
      if (mouthAngryIndex !== undefined && mouthAngryIndex < wolf3DHead.morphTargetInfluences.length) {
        wolf3DHead.morphTargetInfluences[mouthAngryIndex] = 1.0 * intensity;
        console.log("Applied mouthAngry for anger:", 1.0 * intensity);
      }
      if (browDownIndex !== undefined) {
        wolf3DHead.morphTargetInfluences[browDownIndex] = 0.8 * intensity;
      }
    } else if (emotion === "senang") {
      if (mouthSmileIndex !== undefined && mouthSmileIndex < wolf3DHead.morphTargetInfluences.length) {
        wolf3DHead.morphTargetInfluences[mouthSmileIndex] = 1.0 * intensity;
        console.log("Applied mouthSmile for happiness:", 1.0 * intensity);
      }
    } else if (emotion === "sedih") {
      if (sedihIndex !== undefined) {
        wolf3DHead.morphTargetInfluences[sedihIndex] = 1.0 * intensity;
        console.log("Applied sedih blendshape:", 1.0 * intensity);
      }
    } else if (emotion === "kecewa") {
      if (kecewaIndex !== undefined) {
        wolf3DHead.morphTargetInfluences[kecewaIndex] = 1.0 * intensity;
        console.log("Applied kecewa blendshape:", 1.0 * intensity);
      }
    } else if (emotion === "takut") {
      if (takutIndex !== undefined) {
        wolf3DHead.morphTargetInfluences[takutIndex] = 1.0 * intensity;
        console.log("Applied takut blendshape:", 1.0 * intensity);
      }
    } else if (emotion === "bingung") {
      if (bingungIndex !== undefined) {
        wolf3DHead.morphTargetInfluences[bingungIndex] = 1.0 * intensity;
        console.log("Applied bingung blendshape:", 1.0 * intensity);
      }
    } else if (emotion === "diam") {
      if (diamIndex !== undefined) {
        wolf3DHead.morphTargetInfluences[diamIndex] = 1.0 * intensity;
        console.log("Applied diam blendshape:", 1.0 * intensity);
      }
    } else if (emotion === "tertawa") {
      if (tertawaIndex !== undefined) {
        wolf3DHead.morphTargetInfluences[tertawaIndex] = 1.0 * intensity;
        console.log("Applied tertawa blendshape:", 1.0 * intensity);
      }
    } else { // For neutral or other emotions, ensure they are 0
      // All morph targets are already reset above
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
        const sedihIndex = wolf3DHead.morphTargetDictionary?.["sedih"];
        const kecewaIndex = wolf3DHead.morphTargetDictionary?.["kecewa"];
        const takutIndex = wolf3DHead.morphTargetDictionary?.["takut"];
        const bingungIndex = wolf3DHead.morphTargetDictionary?.["bingung"];
        const diamIndex = wolf3DHead.morphTargetDictionary?.["diam"];
        const tertawaIndex = wolf3DHead.morphTargetDictionary?.["tertawa"];
        
        if (mouthSmileIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthSmileIndex] = 0;
        if (mouthAngryIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthAngryIndex] = 0;
        if (sedihIndex !== undefined) wolf3DHead.morphTargetInfluences[sedihIndex] = 0;
        if (kecewaIndex !== undefined) wolf3DHead.morphTargetInfluences[kecewaIndex] = 0;
        if (takutIndex !== undefined) wolf3DHead.morphTargetInfluences[takutIndex] = 0;
        if (bingungIndex !== undefined) wolf3DHead.morphTargetInfluences[bingungIndex] = 0;
        if (diamIndex !== undefined) wolf3DHead.morphTargetInfluences[diamIndex] = 0;
        if (tertawaIndex !== undefined) wolf3DHead.morphTargetInfluences[tertawaIndex] = 0;
      }
    }
  }, [currentEmotion, wolf3DHead]);

  // Animation loop - ONLY blend shapes, NO body/head movement
  useFrame((state, delta) => {
    // NO mixer updates - we don't want any body animations
    // NO head movement - character stays completely still
    
    // Audio-driven mouth animation using real-time volume data
    if (wolf3DHead && wolf3DHead.morphTargetDictionary && wolf3DHead.morphTargetInfluences) {
      const mouthOpenIndex = wolf3DHead.morphTargetDictionary['mouthOpen'];
      
      if (mouthOpenIndex !== undefined && mouthOpenIndex < wolf3DHead.morphTargetInfluences.length) {
        // Use audio data if available and speaking
         if (audioData && audioData.volume !== undefined && isSpeaking) {
           // Use real-time volume data (already normalized 0-1)
           let mouthOpenValue = audioData.volume;
           
           // Apply aggressive scaling for more visible mouth movement from small volumes
           mouthOpenValue = Math.pow(mouthOpenValue, 0.1); // Cube root for even more responsive low volumes
           mouthOpenValue = Math.min(mouthOpenValue * 2.5, 1.0); // Strong amplification for visibility
           
           // Add minimum threshold to ensure some movement is always visible
           if (mouthOpenValue > 0.05) {
             mouthOpenValue = Math.max(mouthOpenValue, 0.15); // Minimum visible opening
           }
          
          wolf3DHead.morphTargetInfluences[mouthOpenIndex] = mouthOpenValue;
          
          // Log occasionally for debugging
          if (Math.floor(Date.now() / 100) % 10 === 0) {
            console.log('Audio-driven mouthOpen value:', mouthOpenValue.toFixed(3), 'from volume:', audioData.volume.toFixed(3));
          }
        } else if (isSpeaking) {
          // Fallback to sine wave animation if no audio data
          speakingTimeRef.current += delta;
          const frequency = 4;
          const mouthOpenValue = (Math.sin(speakingTimeRef.current * frequency * Math.PI) + 1) / 2;
          wolf3DHead.morphTargetInfluences[mouthOpenIndex] = mouthOpenValue;
        } else {
          // Reset mouthOpen when not speaking
          wolf3DHead.morphTargetInfluences[mouthOpenIndex] = 0;
          speakingTimeRef.current = 0;
        }
      } else {
        console.warn('mouthOpen morph target not found in Wolf3D_Head');
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

