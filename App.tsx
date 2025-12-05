import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { HandManager } from './components/HandManager';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { Loader } from '@react-three/drei';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-[#001a0f]">
      <HandManager>
        <UI />
        <Canvas
          shadows
          camera={{ position: [0, 4, 20], fov: 45 }}
          gl={{ antialias: false, toneMappingExposure: 1.5 }}
          dpr={[1, 2]} // Performance optimization
        >
          <Suspense fallback={null}>
             <Scene />
          </Suspense>
        </Canvas>
      </HandManager>
      <Loader 
        containerStyles={{ background: '#001a0f' }}
        barStyles={{ background: '#D4AF37', height: '5px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'serif' }}
      />
    </div>
  );
};

export default App;
