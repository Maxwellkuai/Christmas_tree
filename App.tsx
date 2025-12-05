import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { HandManager } from './components/HandManager';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { Loader } from '@react-three/drei';

// Default "Luxury" assets
const DEFAULT_MUSIC = ["https://upload.wikimedia.org/wikipedia/commons/8/89/Jingle_Bells_%28Kevin_MacLeod%29_%28ISRC_USUAN1100187%29.oga"];

const DEFAULT_PHOTOS = [
  "https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=400&q=80", // Gold ornament
  "https://images.unsplash.com/photo-1511268559489-34b624fbfcf5?auto=format&fit=crop&w=400&q=80", // Winter woods
  "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=400&q=80", // Snowy leaves
  "https://images.unsplash.com/photo-1482638188065-48bbb500180f?auto=format&fit=crop&w=400&q=80", // Sparkler
  "https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?auto=format&fit=crop&w=400&q=80", // Gold luxury
  "https://images.unsplash.com/photo-1543094721-a461e69b009e?auto=format&fit=crop&w=400&q=80", // Champagne
  "https://images.unsplash.com/photo-1605218427306-253c69c69998?auto=format&fit=crop&w=400&q=80", // Family (Generic)
  "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?auto=format&fit=crop&w=400&q=80", // Tree close up
];

const App: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>(DEFAULT_PHOTOS);
  const [playlist, setPlaylist] = useState<string[]>(DEFAULT_MUSIC);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: string[] = [];
      Array.from(e.target.files).forEach(file => {
        newPhotos.push(URL.createObjectURL(file));
      });
      // Replace default photos with user photos
      setPhotos(newPhotos);
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newTracks: string[] = [];
      Array.from(e.target.files).forEach(file => {
        newTracks.push(URL.createObjectURL(file));
      });
      setPlaylist(newTracks);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#001a0f]">
      <HandManager>
        <UI 
          playlist={playlist} 
          onPhotoUpload={handlePhotoUpload} 
          onMusicUpload={handleMusicUpload} 
        />
        <Canvas
          shadows
          camera={{ position: [0, 4, 20], fov: 45 }}
          gl={{ antialias: false, toneMappingExposure: 1.5 }}
          dpr={[1, 2]} // Performance optimization
        >
          <Suspense fallback={null}>
             <Scene photos={photos} />
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