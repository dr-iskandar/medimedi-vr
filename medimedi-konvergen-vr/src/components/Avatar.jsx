import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { LoopRepeat } from 'three';

export function Avatar({ currentEmotion = 'netral', isSpeaking = false }) {
  const { scene, animations } = useGLTF("/kevin_kecil_v4.glb");
  const avatarRef = useRef();
  const { actions } = useAnimations(animations, avatarRef);
  const [wolf3DHead, setWolf3DHead] = useState(null);
  
  // State for smooth blendshape transitions
  const [targetEmotionValues, setTargetEmotionValues] = useState({
    mouthSmile: 0,
    mouthAngry: 0,
    mouthSad: 0,
    browDown: 0,
    browUp: 0
  });
  
  const [currentEmotionValues, setCurrentEmotionValues] = useState({
    mouthSmile: 0,
    mouthAngry: 0,
    mouthSad: 0,
    browDown: 0,
    browUp: 0
  });

  useEffect(() => {
    if (animations && animations.length > 0) {
      animations.forEach((animation, index) => {
        console.log(`🎭 VR Animation ${index}: ${animation.name}`);
      });
    }
  }, [animations]);

  useEffect(() => {
    if (actions && actions.Idle) {
      console.log('🎭 VR Starting Idle animation');
      // Configure smooth looping for Idle animation
      actions.Idle.reset();
      actions.Idle.setLoop(LoopRepeat, Infinity); // LoopRepeat with infinite repetitions
      actions.Idle.clampWhenFinished = false;
      actions.Idle.fadeIn(0.5); // Smooth fade in
      actions.Idle.play();
    }
  }, [actions]);

  useEffect(() => {
    if (avatarRef.current) {
      // Position the avatar with feet at ground zero and in front of user
      avatarRef.current.position.set(0, 0, -1); // Feet at ground zero, in front of user
      avatarRef.current.scale.set(1.2, 1.2, 1.2); // Slightly larger
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
      const browDownIndex = wolf3DHead.morphTargetDictionary["browDown"];
      const browUpIndex = wolf3DHead.morphTargetDictionary["browUp"];
      
      if (mouthSmileIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthSmileIndex] = currentEmotionValues.mouthSmile;
      if (mouthAngryIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthAngryIndex] = currentEmotionValues.mouthAngry;
      if (mouthSadIndex !== undefined) wolf3DHead.morphTargetInfluences[mouthSadIndex] = currentEmotionValues.mouthSad;
      if (browDownIndex !== undefined) wolf3DHead.morphTargetInfluences[browDownIndex] = currentEmotionValues.browDown;
      if (browUpIndex !== undefined) wolf3DHead.morphTargetInfluences[browUpIndex] = currentEmotionValues.browUp;
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
      browDown: 0,
      browUp: 0
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
        
      default:
        // Neutral expression - all values remain 0
        console.log('🎭 VR Target: neutral expression');
        break;
    }
    
    setTargetEmotionValues(newTargetValues);
  }, [currentEmotion]);

  // Handle mouth animation for speaking (separate useEffect for better control)
  useEffect(() => {
    if (!wolf3DHead || !wolf3DHead.morphTargetDictionary) {
      console.log('🎤 VR Mouth animation: wolf3DHead or morphTargetDictionary not available');
      return;
    }

    console.log('🎤 VR Available morph targets:', Object.keys(wolf3DHead.morphTargetDictionary));
    
    // Try multiple possible names for mouth open morph target
    const possibleMouthNames = ["mouthOpen", "mouth_open", "MouthOpen", "Mouth_Open", "viseme_aa", "viseme_E", "jawOpen", "jaw_open"];
    let mouthOpenIndex = undefined;
    let foundMouthName = null;
    
    for (const name of possibleMouthNames) {
      if (wolf3DHead.morphTargetDictionary[name] !== undefined) {
        mouthOpenIndex = wolf3DHead.morphTargetDictionary[name];
        foundMouthName = name;
        console.log(`🎤 VR Found mouth morph target: ${name} at index ${mouthOpenIndex}`);
        break;
      }
    }

    if (mouthOpenIndex !== undefined) {
      console.log(`🎤 VR Setting up mouth animation with ${foundMouthName}, isSpeaking:`, isSpeaking);
      let animationFrameId;
      const animateMouth = () => {
        if (isSpeaking) {
          const time = Date.now() * 0.008; // Slightly faster animation
          const mouthValue = Math.abs(Math.sin(time)) * 0.7; // Oscillate between 0 and 0.7
          wolf3DHead.morphTargetInfluences[mouthOpenIndex] = mouthValue;
          console.log(`🎤 VR Mouth animation value: ${mouthValue.toFixed(3)}`);
        } else {
          wolf3DHead.morphTargetInfluences[mouthOpenIndex] = 0.0; // Closed when not speaking
        }
        animationFrameId = requestAnimationFrame(animateMouth);
      };

      animateMouth();

      return () => {
        cancelAnimationFrame(animationFrameId);
        if (wolf3DHead.morphTargetInfluences && mouthOpenIndex < wolf3DHead.morphTargetInfluences.length) {
          wolf3DHead.morphTargetInfluences[mouthOpenIndex] = 0.0;
        }
      };
    } else {
      console.warn("⚠️ VR No mouth morph target found. Available targets:", Object.keys(wolf3DHead.morphTargetDictionary));
      console.warn("⚠️ VR Tried these names:", possibleMouthNames);
    }
  }, [isSpeaking, wolf3DHead]);

  // Reset to neutral expression when conversation stops
  useEffect(() => {
    if (!isSpeaking) {
      console.log('🎭 VR Conversation stopped - resetting to neutral');
      
      // Set all emotion targets to neutral (0)
      const neutralValues = {
        mouthSmile: 0,
        mouthAngry: 0,
        mouthSad: 0,
        browDown: 0,
        browUp: 0
      };
      
      setTargetEmotionValues(neutralValues);
    }
  }, [isSpeaking]);

  return <primitive object={scene} ref={avatarRef} />;
}

