import React, { useRef, useState, useEffect } from 'react';
import { useHandControl } from './HandManager';

interface UIProps {
  playlist: string[];
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMusicUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UI: React.FC<UIProps> = ({ playlist, onPhotoUpload, onMusicUpload }) => {
  const { isReady, gestureState } = useHandControl();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Handle Playlist Changes
  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      // If playlist changed entirely, reset to 0, otherwise keep index
      if (currentTrackIndex >= playlist.length) {
          setCurrentTrackIndex(0);
      }
      audioRef.current.src = playlist[currentTrackIndex];
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Autoplay blocked", e));
      }
    }
  }, [playlist, currentTrackIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrackEnded = () => {
    // Play next track or loop to start
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    // The useEffect will trigger the src change and play
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 flex flex-col justify-between p-8">
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={handleTrackEnded}
      />

      {/* Header */}
      <div className="text-center relative pointer-events-auto">
        <h1 className="text-4xl md:text-6xl text-[#D4AF37] font-serif tracking-widest drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)] cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setShowControls(!showControls)}>
          THE GRAND TREE
        </h1>
        <p className="text-[#aaffcc] mt-2 font-light tracking-wide text-sm md:text-base opacity-80">
          INTERACTIVE LUXURY EXPERIENCE
        </p>

        {/* Media Controls Dropdown */}
        <div className={`mt-4 transition-all duration-500 overflow-hidden ${showControls ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center bg-black/40 backdrop-blur-md p-6 rounded-xl border border-[#D4AF37]/30 max-w-2xl mx-auto">
            
            {/* Music Control */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length)}
                    className="text-[#D4AF37] hover:text-white"
                  >
                    ⏮
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#001a0f] transition-all text-xl"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button 
                    onClick={() => setCurrentTrackIndex((prev) => (prev + 1) % playlist.length)}
                    className="text-[#D4AF37] hover:text-white"
                  >
                    ⏭
                  </button>
              </div>
              <label className="cursor-pointer text-xs text-[#D4AF37] underline hover:text-white mt-1">
                Select Music Folder (Files)
                <input type="file" multiple accept="audio/*" className="hidden" onChange={onMusicUpload} />
              </label>
              <span className="text-[10px] text-[#aaffcc]/60">
                 Track {currentTrackIndex + 1} / {playlist.length}
              </span>
            </div>

            <div className="w-px h-16 bg-[#D4AF37]/30 hidden md:block"></div>

            {/* Photo Control */}
            <div className="flex flex-col items-center gap-2">
              <label className="cursor-pointer px-6 py-3 border border-[#D4AF37] text-[#D4AF37] font-serif text-sm rounded hover:bg-[#D4AF37] hover:text-[#001a0f] transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                <span>📷</span> Upload Photos Folder
                <input type="file" multiple accept="image/*" className="hidden" onChange={onPhotoUpload} />
              </label>
              <span className="text-[10px] text-[#D4AF37]/70 uppercase tracking-widest">Select multiple images</span>
            </div>

          </div>
        </div>
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
      <div className="flex justify-center gap-8 text-[#D4AF37] font-serif text-sm md:text-lg bg-black/30 backdrop-blur-md p-4 rounded-full border border-[#D4AF37]/30 mx-auto pointer-events-auto">
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${gestureState.gesture === 'OPEN' ? 'opacity-100 font-bold' : 'opacity-60'}`}>
           <span>✋</span> UNLEASH
        </div>
        <div className="w-px h-6 bg-[#D4AF37]/50"></div>
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${gestureState.gesture === 'CLOSED' ? 'opacity-100 font-bold' : 'opacity-60'}`}>
           <span>✊</span> FORM
        </div>
        <div className="w-px h-6 bg-[#D4AF37]/50"></div>
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${gestureState.gesture === 'PINCH' ? 'opacity-100 font-bold' : 'opacity-60'}`}>
           <span>👌</span> ZOOM
        </div>
        <div className="w-px h-6 bg-[#D4AF37]/50"></div>
        <button onClick={() => setShowControls(!showControls)} className="hover:text-white transition-colors animate-pulse">
            <span>⚙️</span> MEDIA
        </button>
      </div>
    </div>
  );
};