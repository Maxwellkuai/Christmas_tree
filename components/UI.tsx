import React from 'react';
import { useHandControl } from './HandManager';

export const UI: React.FC = () => {
  const { isReady, gestureState } = useHandControl();

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 flex flex-col justify-between p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl text-[#D4AF37] font-serif tracking-widest drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)]">
          THE GRAND TREE
        </h1>
        <p className="text-[#aaffcc] mt-2 font-light tracking-wide text-sm md:text-base opacity-80">
          INTERACTIVE LUXURY EXPERIENCE
        </p>
      </div>

      {/* Loading / Status */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-serif text-xl">Initializing Vision System...</p>
            <p className="text-gray-400 text-sm mt-2">Please allow camera access.</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="flex justify-center gap-8 text-[#D4AF37] font-serif text-sm md:text-lg bg-black/30 backdrop-blur-md p-4 rounded-full border border-[#D4AF37]/30 mx-auto">
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${gestureState.gesture === 'OPEN' ? 'opacity-100 font-bold' : 'opacity-60'}`}>
           <span>✋</span> OPEN TO UNLEASH
        </div>
        <div className="w-px h-6 bg-[#D4AF37]/50"></div>
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${gestureState.gesture === 'CLOSED' ? 'opacity-100 font-bold' : 'opacity-60'}`}>
           <span>✊</span> CLOSE TO FORM
        </div>
        <div className="w-px h-6 bg-[#D4AF37]/50"></div>
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${gestureState.gesture === 'PINCH' ? 'opacity-100 font-bold' : 'opacity-60'}`}>
           <span>👌</span> PINCH TO ZOOM
        </div>
      </div>
    </div>
  );
};
