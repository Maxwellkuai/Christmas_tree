import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Foliage } from './Foliage';
import { Ornaments, PolaroidGallery } from './Ornaments';
import { useHandControl } from './HandManager';
import { TreeState } from '../types';
import * as THREE from 'three';

interface SceneProps {
  photos: string[];
}

export const Scene: React.FC<SceneProps> = ({ photos }) => {
  const { gestureState } = useHandControl();
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);
  
  // Logic linking gestures to state
  useEffect(() => {
    if (gestureState.gesture === 'OPEN') {
      setTreeState(TreeState.CHAOS);
    } else if (gestureState.gesture === 'CLOSED') {
      setTreeState(TreeState.FORMED);
    }
    // PINCH handled via zoom in useFrame
  }, [gestureState.gesture]);

  const { camera } = useThree();

  useFrame((state, delta) => {
    // 1. Camera Rotation based on Hand Position
    if (gestureState.gesture !== 'NONE') {
      const targetX = gestureState.rotation.x * 5; // Multiplier for sensitivity
      const targetY = 4 + (gestureState.rotation.y * 5);
      
      // Smooth camera orbit
      const r = 20; // Radius
      const angle = state.clock.elapsedTime * 0.1 + targetX; 
      
      const targetCamPos = new THREE.Vector3(
        Math.sin(angle) * r,
        targetY,
        Math.cos(angle) * r
      );
      
      // Handle Zoom (Pinch)
      if (gestureState.gesture === 'PINCH') {
          // Pinch dist is small when pinching.
          // We map pinch distance to radius.
          const zoomRadius = 5 + (gestureState.pinchDistance * 100); // Heuristic
          targetCamPos.setLength(Math.max(5, Math.min(zoomRadius, 25)));
      }

      camera.position.lerp(targetCamPos, 0.05);
      camera.lookAt(0, 5, 0);
    } else {
        // Auto rotate slowly if no hand interaction
        const r = 22;
        const angle = state.clock.elapsedTime * 0.2;
        camera.position.lerp(new THREE.Vector3(
            Math.sin(angle) * r,
            4,
            Math.cos(angle) * r
        ), 0.02);
        camera.lookAt(0, 5, 0);
    }
  });

  return (
    <>
      <color attach="background" args={['#001a0f']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Lighting: Trump Luxury style - Warm, Gold, Bright */}
      <ambientLight intensity={0.5} color="#004225" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
      <pointLight position={[-10, 10, -10]} intensity={1} color="#ffffff" />
      <spotLight position={[0, 20, 0]} angle={0.5} penumbra={1} intensity={2} color="#D4AF37" castShadow />

      <Environment preset="lobby" />

      <group>
        <Foliage count={12000} treeState={treeState} />
        <Ornaments count={200} treeState={treeState} type="ball" />
        <Ornaments count={50} treeState={treeState} type="gift" />
        <PolaroidGallery treeState={treeState} photos={photos} />
        
        {/* Floor Reflection */}
        <ContactShadows opacity={0.5} scale={30} blur={2} far={10} resolution={256} color="#000000" />
      </group>

      <EffectComposer enableNormalPass={false}>
        <Bloom 
            luminanceThreshold={0.2} // Bloom on darker golds too
            mipmapBlur 
            intensity={1.2} 
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};