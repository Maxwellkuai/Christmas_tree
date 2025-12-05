import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { Image } from '@react-three/drei';

interface OrnamentsProps {
  count: number;
  treeState: TreeState;
  type: 'ball' | 'gift';
}

const tempObject = new THREE.Object3D();

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

interface PolaroidGalleryProps {
  treeState: TreeState;
  photos: string[];
}

export const PolaroidGallery: React.FC<PolaroidGalleryProps> = ({ treeState, photos }) => {
  const count = 60; // Increased to 60 for "Many photos"
  
  const galleryItems = useMemo(() => {
    return Array.from({length: count}).map((_, i) => {
        // Spiral distribution logic
        const t = i / count;
        // More windings for dense look
        const angle = t * Math.PI * 18; 
        const height = t * 14 - 1.5; 
        const radius = 5.2 * (1 - height / 15) + 0.6; // Slightly further out than ornaments

        return {
            id: i,
            targetPos: new THREE.Vector3(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            ),
            chaosPos: new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            )
        };
    });
  }, [count]);

  return (
    <group>
      {galleryItems.map((item, i) => (
        <PolaroidItem 
            key={i} 
            data={item} 
            treeState={treeState} 
            // Cycle through photos provided via props
            url={photos[i % photos.length]} 
        />
      ))}
    </group>
  );
};

const PolaroidItem = ({ data, treeState, url }: any) => {
    const ref = useRef<THREE.Group>(null);
    const scaleRef = useRef(0);
    const randomOffset = useRef(Math.random());
    
    useFrame((state, delta) => {
        if(!ref.current) return;
        const target = treeState === TreeState.FORMED ? data.targetPos : data.chaosPos;
        
        // Smooth lerp for position
        const speed = 2 + (randomOffset.current * 0.5); // Variation in speed
        ref.current.position.lerp(target, delta * speed);
        
        // Orientation logic
        if (treeState === TreeState.FORMED) {
             // Look slightly up and out
             ref.current.lookAt(0, data.targetPos.y, 0);
             // Gentle sway
             const t = state.clock.elapsedTime + data.id;
             ref.current.position.y += Math.sin(t) * 0.003;
             ref.current.rotation.z = Math.sin(t * 0.5) * 0.1; // Subtle tilt
        } else {
            // Chaos rotation
            ref.current.rotation.x += delta * 0.5;
            ref.current.rotation.y += delta * 0.3;
        }

        // Pop in animation
        const targetScale = treeState === TreeState.FORMED ? 0.8 : 1.0; // Slightly larger in chaos
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.05);
        ref.current.scale.setScalar(scaleRef.current);
    });

    return (
        <group ref={ref}>
            {/* Paper backing */}
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[1.2, 1.5]} />
                <meshStandardMaterial color="#fffff0" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            {/* Photo */}
            <Image 
                url={url} 
                scale={[1, 1]} 
                position={[0, 0.15, 0.01]}
                transparent
            />
        </group>
    );
}