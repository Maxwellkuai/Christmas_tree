import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

// Custom Shader for Emerald Glow Foliage
const foliageVertexShader = `
  attribute vec3 chaosPos;
  attribute vec3 targetPos;
  attribute float size;
  attribute vec3 color;
  
  uniform float uTime;
  uniform float uLerp; // 0 = Chaos, 1 = Formed
  
  varying vec3 vColor;
  varying float vAlpha;

  // Cubic ease out function for smoother transition
  float easeOutCubic(float x) {
    return 1.0 - pow(1.0 - x, 3.0);
  }

  void main() {
    vColor = color;
    
    // Non-linear interpolation
    float t = easeOutCubic(uLerp);
    
    // Add some noise/turbulence during transition
    vec3 currentPos = mix(chaosPos, targetPos, t);
    
    // Gentle wind sway when formed
    if (uLerp > 0.9) {
      float wind = sin(uTime * 2.0 + currentPos.y * 0.5) * 0.1 * (currentPos.y / 10.0);
      currentPos.x += wind;
    }

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    
    // Size attenuation
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Fade in/out logic if needed, or keep fully opaque
    vAlpha = 1.0; 
  }
`;

const foliageFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Circular particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    if(length(coord) > 0.5) discard;
    
    // Inner glow
    float strength = 1.0 - (length(coord) * 2.0);
    strength = pow(strength, 1.5);
    
    gl_FragColor = vec4(vColor * strength * 1.5, 1.0); // Boost brightness for bloom
  }
`;

interface FoliageProps {
  count: number;
  treeState: TreeState;
}

export const Foliage: React.FC<FoliageProps> = ({ count, treeState }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate Geometry Data
  const { positions, chaosPos, targetPos, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const chaosPos = new Float32Array(count * 3);
    const targetPos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const baseColor = new THREE.Color("#023020"); // Deep Emerald
    const highlightColor = new THREE.Color("#004225"); // Lighter Emerald
    const goldColor = new THREE.Color("#D4AF37"); // Gold dust

    for (let i = 0; i < count; i++) {
      // 1. Chaos Position: Sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 25 + Math.random() * 20; // Wide scattering
      
      chaosPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaosPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      chaosPos[i * 3 + 2] = r * Math.cos(phi);

      // 2. Target Position: Cone (Tree) distribution
      // Height from 0 to 15
      const h = Math.random() * 15;
      // Radius decreases as height increases. Base radius 5.
      const maxR = 5 * (1 - h / 15);
      const rTree = Math.random() * maxR;
      const thetaTree = Math.random() * Math.PI * 2;

      targetPos[i * 3] = rTree * Math.cos(thetaTree);
      targetPos[i * 3 + 1] = h - 2; // Offset Y to center visually
      targetPos[i * 3 + 2] = rTree * Math.sin(thetaTree);

      // Initialize render position at chaos
      positions[i * 3] = chaosPos[i * 3];
      positions[i * 3 + 1] = chaosPos[i * 3 + 1];
      positions[i * 3 + 2] = chaosPos[i * 3 + 2];

      // 3. Colors
      const isGold = Math.random() > 0.95; // 5% gold specks
      const c = isGold ? goldColor : baseColor.clone().lerp(highlightColor, Math.random());
      
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      // 4. Sizes
      sizes[i] = Math.random() * 0.5 + 0.2;
    }

    return { positions, chaosPos, targetPos, colors, sizes };
  }, [count]);

  // Animation Loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Lerp logic
      const targetLerp = treeState === TreeState.FORMED ? 1.0 : 0.0;
      // Smooth interpolation for the uniform
      materialRef.current.uniforms.uLerp.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uLerp.value,
        targetLerp,
        0.05 // Speed of transition
      );
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-chaosPos"
          count={chaosPos.length / 3}
          array={chaosPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-targetPos"
          count={targetPos.length / 3}
          array={targetPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uLerp: { value: 0 }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
