import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { LoopRepeat } from 'three';

export function Avatar({ currentEmotion = 'netral', isSpeaking = false, audioData = null }) {
  const { scene, animations } = useGLTF("/rizky.glb");
  const avatarRef = useRef();
  const { actions } = useAnimations(animations, avatarRef);
  const [wolf3DHead, setWolf3DHead] = useState(null);
  
  // State for smooth blendshape transitions
  const [targetEmotionValues, setTargetEmotionValues] = useState({
    mouthSmile: 0,
    mouthAngry: 0,
    mouthSad: 0,
    mouthFrown: 0,
    mouthOpen: 0,
    browDown: 0,
    browUp: 0,
    eyeWide: 0,
    eyeSquint: 0,
    cheekPuff: 0
  });
  
  const [currentEmotionValues, setCurrentEmotionValues] = useState({
    mouthSmile: 0,
    mouthAngry: 0,
    mouthSad: 0,
    mouthFrown: 0,
    mouthOpen: 0,
    browDown: 0,
    browUp: 0,
    eyeWide: 0,
    eyeSquint: 0,
    cheekPuff: 0
  });

  useEffect(() => {
    if (animations && animations.length > 0) {
      animations.forEach((animation, index) => {
        console.log(`🎭 VR Animation ${index}: ${animation.name}`);
      });
    }
  }, [animations]);

  useEffect(() => {
    if (actions && actions["Idle V2"]) {
      console.log('🎭 VR Starting Idle V2 animation');
      // Configure smooth looping for Idle V2 animation
      actions["Idle V2"].reset();
      actions["Idle V2"].setLoop(LoopRepeat, Infinity); // LoopRepeat with infinite repetitions
      actions["Idle V2"].clampWhenFinished = false;
      actions["Idle V2"].fadeIn(0.5); // Smooth fade in
      actions["Idle V2"].play();
    }
  }, [actions]);

  useEffect(() => {
    if (avatarRef.current) {
      // Position the avatar with feet at ground zero and in front of user
      avatarRef.current.position.set(0, 0, -1); // Feet at ground zero, in front of user
      avatarRef.current.scale.set(0.9, 0.9, 0.9); // Slightly larger
      avatarRef.current.rotation.y = 0; // Face the camera
      
      // Find Wolf3D_Head mesh for blend shapes
      avatarRef.current.traverse((child) => {
        if (child.isMesh && child.name === 'Wolf3D_Head') {
          console.log('🎭 VR Wolf3D_Head found:', child);
          console.log('🎭 VR Morph targets:', child.morphTargetDictionary);
          setWolf3DHead(child);
        }
      });
    }
  }, []);

  // Realistic eye blink animation and smooth emotion transitions
  useFrame((state, delta) => {
    if (wolf3DHead && wolf3DHead.morphTargetDictionary) {
      const eyeBlinkIndex = wolf3DHead.morphTargetDictionary["eyeBlink"];
      
      // Eye blink animation
      if (eyeBlinkIndex !== undefined) {
        // Create realistic blink pattern
        const time = state.clock.elapsedTime;
        const blinkCycle = time % 3; // Blink every 3 seconds
        
        let blinkValue = 0;
        
        // Blink happens in the first 0.3 seconds of each cycle
        if (blinkCycle < 0.15) {
          // Closing phase (0 to 1)
          blinkValue = Math.sin((blinkCycle / 0.15) * Math.PI * 0.5);
        } else if (blinkCycle < 0.3) {
          // Opening phase (1 to 0)
          blinkValue = Math.cos(((blinkCycle - 0.15) / 0.15) * Math.PI * 0.5);
        }
        
        // Apply smooth easing for more realistic blink
        blinkValue = blinkValue * blinkValue * (3 - 2 * blinkValue); // Smoothstep
        
        wolf3DHead.morphTargetInfluences[eyeBlinkIndex] = blinkValue;
      }
      
      // Smooth emotion transitions
      const transitionSpeed = 3.0; // Adjust speed of emotion transitions
      const newEmotionValues = { ...currentEmotionValues };
      let hasChanged = false;
      
      // Interpolate each emotion value towards target
      Object.keys(targetEmotionValues).forEach(key => {
        const target = targetEmotionValues[key];
        const current = currentEmotionValues[key];
        const difference = target - current;
        
        if (Math.abs(difference) > 0.001) {
          const step = difference * transitionSpeed * delta;
          newEmotionValues[key] = current + step;
          hasChanged = true;
        } else {
          newEmotionValues[key] = target;
        }
      });
      
      // Update current values if changed
      if (hasChanged) {
        setCurrentEmotionValues(newEmotionValues);
      }
      
      // Apply current emotion values to morph targets
      const mouthSmileIndex = wolf3DHead.morphTargetDictionary["mouthSmile"];
      const mouthAngryIndex = wolf3DHead.morphTargetDictionary["mouthAngry"];
      const mouthSadIndex = wolf3DHead.morphTargetDictionary["mouthSad"];
      const mouthFrownIndex = wolf3DHead.morphTargetDictionary["mouthFrown"];
      const browDownIndex = wolf3DHead.morphTargetDictionary["browDown"];
      const browUpIndex = wolf3DHead.morphTargetDictionary["browUp"];
      const eyeWideIndex = wolf3DHead.morphTargetDictionary["eyeWide"];
      const eyeSquintIndex = wolf3DHead.morphTargetDictionary["eyeSquint"];
      const cheekPuffIndex = wolf3DHead.morphTargetDictionary["cheekPuff"];
      
      if (mouthSmileIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthSmileIndex] = currentEmotionValues.mouthSmile;
      if (mouthAngryIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthAngryIndex] = currentEmotionValues.mouthAngry;
      if (mouthSadIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthSadIndex] = currentEmotionValues.mouthSad;
      if (mouthFrownIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthFrownIndex] = currentEmotionValues.mouthFrown;
      if (browDownIndex !== undefined) wolf3DHead.morphTargetInfluences[browDownIndex] = currentEmotionValues.browDown;
      if (browUpIndex !== undefined) wolf3DHead.morphTargetInfluences[browUpIndex] = currentEmotionValues.browUp;
      if (eyeWideIndex !== undefined) wolf3DHead.morphTargetInfluences[eyeWideIndex] = currentEmotionValues.eyeWide;
      if (eyeSquintIndex !== undefined) wolf3DHead.morphTargetInfluences[eyeSquintIndex] = currentEmotionValues.eyeSquint;
      if (cheekPuffIndex !== undefined) wolf3DHead.morphTargetInfluences[cheekPuffIndex] = currentEmotionValues.cheekPuff;
    }
  });

  // Handle emotion changes for facial expressions with smooth transitions
  useEffect(() => {
    console.log('🎭 VR Setting target emotion:', currentEmotion);

    // Set target values for smooth transitions
    const newTargetValues = {
      mouthSmile: 0,
      mouthAngry: 0,
      mouthSad: 0,
      mouthFrown: 0,
      mouthOpen: 0,
      browDown: 0,
      browUp: 0,
      eyeWide: 0,
      eyeSquint: 0,
      cheekPuff: 0
    };

    // Apply emotion-specific target values
    switch (currentEmotion) {
      case 'marah':
      case 'agresif':
      case 'kesal':
        newTargetValues.mouthAngry = 1.0;
        newTargetValues.browDown = 0.8;
        console.log('🎭 VR Target: angry expression');
        break;
        
      case 'senang':
        newTargetValues.mouthSmile = 1.0;
        console.log('🎭 VR Target: happy expression');
        break;
        
      case 'sedih':
      case 'penyesalan':
        newTargetValues.mouthSad = 0.8;
        newTargetValues.browDown = 0.6;
        console.log('🎭 VR Target: sad expression');
        break;
        
      case 'cemas':
      case 'defensif':
        newTargetValues.browUp = 0.7;
        console.log('🎭 VR Target: anxious expression');
        break;
        
      case 'kecewa':
        newTargetValues.mouthFrown = 0.8;
        newTargetValues.browDown = 0.5;
        newTargetValues.mouthSad = 0.4;
        console.log('🎭 VR Target: disappointed expression');
        break;
        
      case 'takut':
        newTargetValues.eyeWide = 0.9;
        newTargetValues.browUp = 0.8;
        newTargetValues.mouthOpen = 0.3;
        console.log('🎭 VR Target: scared expression');
        break;
        
      case 'bingung':
        newTargetValues.browUp = 0.6;
        newTargetValues.browDown = 0.3;
        newTargetValues.eyeSquint = 0.4;
        console.log('🎭 VR Target: confused expression');
        break;
        
      case 'diam':
        newTargetValues.mouthFrown = 0.3;
        newTargetValues.eyeSquint = 0.2;
        console.log('🎭 VR Target: silent expression');
        break;
        
      case 'tertawa':
        newTargetValues.mouthSmile = 1.2;
        newTargetValues.eyeSquint = 0.7;
        newTargetValues.cheekPuff = 0.5;
        console.log('🎭 VR Target: laughing expression');
        break;
        
      default:
        // Neutral expression - all values remain 0
        console.log('🎭 VR Target: neutral expression');
        break;
    }
    
    setTargetEmotionValues(newTargetValues);
  }, [currentEmotion]);

  // Handle audio-driven mouth animation for speaking
  useEffect(() => {
    if (!wolf3DHead || !wolf3DHead.morphTargetDictionary) return;

    const mouthOpenIndex = wolf3DHead.morphTargetDictionary["mouthOpen"];

    if (mouthOpenIndex !== undefined) {
      let animationFrameId;
      const animateMouth = () => {
        if (isSpeaking) {
          // Use audio data if available for real-time mouth animation
          if (audioData && audioData.volume !== undefined) {
            // Use real-time volume data (already normalized 0-1)
            let mouthOpenValue = audioData.volume;
            
            // Dynamic scaling based on emotion
            let emotionMultiplier = 1.0;
            let powerFactor = 0.5; // Default square root
            let minThreshold = 0.08;
            
            // Adjust parameters based on current emotion
            if (currentEmotion === 'marah') {
              emotionMultiplier = 2.2; // More aggressive amplification for anger
              powerFactor = 0.4; // More responsive to low volumes
              minThreshold = 0.12; // Higher minimum for angry expression
            } else if (currentEmotion === 'sedih') {
              emotionMultiplier = 1.2; // Subtle movement for sadness
              powerFactor = 0.6; // Less responsive
              minThreshold = 0.05; // Lower minimum for subdued expression
            } else if (currentEmotion === 'senang') {
              emotionMultiplier = 1.8; // Lively movement for happiness
              powerFactor = 0.45; // Moderately responsive
              minThreshold = 0.1; // Moderate minimum
            }
            
            // Apply emotion-based scaling
            mouthOpenValue = Math.pow(mouthOpenValue, powerFactor);
            mouthOpenValue = Math.min(mouthOpenValue * emotionMultiplier, 1.0);
            
            // Add emotion-based minimum threshold
            if (mouthOpenValue > 0.03) {
              mouthOpenValue = Math.max(mouthOpenValue, minThreshold);
            }
            
            wolf3DHead.morphTargetInfluences[mouthOpenIndex] = mouthOpenValue;
            
            // Log occasionally for debugging
            if (Math.floor(Date.now() / 100) % 20 === 0) {
              console.log('🎤 VR Audio-driven mouthOpen value:', mouthOpenValue.toFixed(3), 'from volume:', audioData.volume.toFixed(3));
            }
          } else {
            // Fallback to sine wave animation if no audio data
            const time = Date.now() * 0.005;
            const mouthValue = (Math.sin(time) + 1) / 2;
            wolf3DHead.morphTargetInfluences[mouthOpenIndex] = mouthValue;
          }
        } else {
          wolf3DHead.morphTargetInfluences[mouthOpenIndex] = 0.0; // Closed when not speaking
        }
        animationFrameId = requestAnimationFrame(animateMouth);
      };

      animateMouth();

      return () => {
        cancelAnimationFrame(animationFrameId);
        wolf3DHead.morphTargetInfluences[mouthOpenIndex] = 0.0;
      };
    } else {
      console.warn("⚠️ VR mouthOpen blend shape not found");
    }
  }, [isSpeaking, wolf3DHead, audioData]);

  // Reset to neutral expression when conversation stops
  useEffect(() => {
    if (!isSpeaking) {
      console.log('🎭 VR Conversation stopped - resetting to neutral');
      
      // Set all emotion targets to neutral (0)
      const neutralValues = {
        mouthSmile: 0,
        mouthAngry: 0,
        mouthSad: 0,
        mouthFrown: 0,
        mouthOpen: 0,
        browDown: 0,
        browUp: 0,
        eyeWide: 0,
        eyeSquint: 0,
        cheekPuff: 0
      };
      
      setTargetEmotionValues(neutralValues);
    }
  }, [isSpeaking]);

  return <primitive object={scene} ref={avatarRef} />;
}

