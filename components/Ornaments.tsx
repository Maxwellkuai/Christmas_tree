import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { Image } from '@react-three/drei';

interface OrnamentsProps {
  count: number;
  treeState: TreeState;
  type: 'ball' | 'gift';
}

const tempObject = new THREE.Object3D();
const tempPos = new THREE.Vector3();

export const Ornaments: React.FC<OrnamentsProps> = ({ count, treeState, type }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Generate Data
  const { chaosData, targetData, colors } = useMemo(() => {
    const chaosData = [];
    const targetData = [];
    const colors = [];
    
    const palette = [
      new THREE.Color("#D4AF37"), // Gold
      new THREE.Color("#C41E3A"), // Cardinal Red
      new THREE.Color("#FFFFFF"), // Silver/White
    ];

    for (let i = 0; i < count; i++) {
      // Chaos: Random sphere
      const r = 20 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      chaosData.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));

      // Target: Tree surface
      const h = Math.random() * 14;
      const maxR = 4.8 * (1 - h / 15);
      const rTree = maxR + 0.2; // Slightly outside foliage
      const thetaTree = Math.random() * Math.PI * 2;
      
      targetData.push(new THREE.Vector3(
        rTree * Math.cos(thetaTree),
        h - 2,
        rTree * Math.sin(thetaTree)
      ));

      colors.push(palette[Math.floor(Math.random() * palette.length)]);
    }
    return { chaosData, targetData, colors };
  }, [count]);

  // Initial Color/Matrix Setup
  useFrame((state) => {
    if (!meshRef.current) return;

    const lerpFactor = treeState === TreeState.FORMED ? 0.05 : 0.02; // Form faster, scatter slower
    const isForming = treeState === TreeState.FORMED;

    for (let i = 0; i < count; i++) {
      // Get current position (simulated via stored data in UserData or reconstructed)
      // Since we can't easily read back from matrix every frame efficiently without drift,
      // we interpolate a virtual "t" value for each particle or just lerp positions directly.
      
      // To simulate "physics" weight:
      // Gifts (heavy) move slower. Balls (light) move faster.
      const weight = type === 'gift' ? 0.8 : 1.2;
      const speed = lerpFactor * weight;

      // We maintain a "currentPos" in the JS side for interpolation
      // Initialization hack:
      if (!meshRef.current.userData.currentPositions) {
         meshRef.current.userData.currentPositions = chaosData.map(v => v.clone());
      }
      
      const currentPos = meshRef.current.userData.currentPositions[i];
      const target = isForming ? targetData[i] : chaosData[i];
      
      currentPos.lerp(target, speed);
      
      tempObject.position.copy(currentPos);
      
      // Add rotation
      tempObject.rotation.x += 0.01 * (i % 2 === 0 ? 1 : -1);
      tempObject.rotation.y += 0.01;
      
      // Scale pop effect
      const scale = type === 'gift' ? 0.4 : 0.25;
      tempObject.scale.setScalar(scale);

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  useEffect(() => {
     if(meshRef.current) {
         colors.forEach((col, i) => meshRef.current!.setColorAt(i, col));
         meshRef.current.instanceColor!.needsUpdate = true;
     }
  }, [colors]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {type === 'ball' ? (
        <sphereGeometry args={[1, 32, 32]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial 
        metalness={0.9} 
        roughness={0.1} 
        envMapIntensity={2} 
      />
    </instancedMesh>
  );
};

// Separate component for Polaroids to handle textures easier
export const PolaroidGallery: React.FC<{ treeState: TreeState }> = ({ treeState }) => {
  const count = 12;
  // Use picsum for placeholders
  const photos = useMemo(() => Array.from({length: count}).map((_, i) => ({
    id: i,
    url: `https://picsum.photos/seed/${i + 100}/300/300`,
    targetPos: new THREE.Vector3(
      Math.sin(i / count * Math.PI * 2) * 3,
      (i / count) * 10,
      Math.cos(i / count * Math.PI * 2) * 3
    ),
    chaosPos: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
    )
  })), []);

  return (
    <group>
      {photos.map((photo, i) => (
        <PolaroidItem key={i} data={photo} treeState={treeState} index={i} />
      ))}
    </group>
  );
};

const PolaroidItem = ({ data, treeState, index }: any) => {
    const ref = useRef<THREE.Group>(null);
    
    useFrame((state, delta) => {
        if(!ref.current) return;
        const target = treeState === TreeState.FORMED ? data.targetPos : data.chaosPos;
        ref.current.position.lerp(target, delta * 2);
        
        // Look at center when formed, random when chaos
        if (treeState === TreeState.FORMED) {
             ref.current.lookAt(0, data.targetPos.y, 0);
        } else {
            ref.current.rotation.x += delta * 0.1;
            ref.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group ref={ref}>
            {/* Paper backing */}
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[1.2, 1.5]} />
                <meshStandardMaterial color="#fffff0" roughness={0.9} />
            </mesh>
            {/* Photo */}
            <Image 
                url={data.url} 
                scale={[1, 1]} 
                position={[0, 0.15, 0]}
                transparent
            />
        </group>
    );
}
