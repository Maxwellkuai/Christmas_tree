import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { HandGestureState } from '../types';

interface HandContextType {
  gestureState: HandGestureState;
  isReady: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const HandContext = createContext<HandContextType | null>(null);

export const useHandControl = () => {
  const context = useContext(HandContext);
  if (!context) throw new Error("useHandControl must be used within HandManager");
  return context;
};

export const HandManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [gestureState, setGestureState] = useState<HandGestureState>({
    gesture: 'NONE',
    rotation: { x: 0, y: 0 },
    pinchDistance: 0
  });

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const initMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      startWebcam();
    };

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    initMediaPipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;
    
    // Only detect if video is playing
    if(videoRef.current.currentTime > 0 && !videoRef.current.paused && !videoRef.current.ended) {
        const startTimeMs = performance.now();
        const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
    
        if (results.landmarks && results.landmarks.length > 0) {
          setIsReady(true);
          const landmarks = results.landmarks[0];
          
          // 1. Calculate Gesture (Heuristics)
          // Thumb tip: 4, Index tip: 8, Middle tip: 12, Ring tip: 16, Pinky tip: 20
          // Wrist: 0
          
          const wrist = landmarks[0];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];
    
          // Distance between thumb and index for pinch
          const pinchDist = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + 
            Math.pow(thumbTip.y - indexTip.y, 2)
          );
    
          // Check if fingers are extended (simplified: tip is higher than pip joint relative to wrist)
          // Actually, let's use bounding box or average distance from palm center.
          // Easier: Distance from wrist. If all tips are far, it's open. If close, closed.
          const avgDist = (
            dist(wrist, indexTip) + dist(wrist, middleTip) + dist(wrist, ringTip) + dist(wrist, pinkyTip)
          ) / 4;
          
          let currentGesture: 'OPEN' | 'CLOSED' | 'PINCH' | 'NONE' = 'NONE';
          
          if (pinchDist < 0.05) {
            currentGesture = 'PINCH';
          } else if (avgDist < 0.3) { // Threshold tuned for typical webcam distance
            currentGesture = 'CLOSED';
          } else {
            currentGesture = 'OPEN';
          }
    
          // 2. Calculate Rotation (Hand position in frame)
          // Center of palm roughly index MCP (5) or Middle MCP (9)
          const palmX = landmarks[9].x; // 0 to 1
          const palmY = landmarks[9].y; // 0 to 1
          
          // Map to -1 to 1 range
          const rotX = (palmX - 0.5) * 2;
          const rotY = (palmY - 0.5) * 2;
    
          setGestureState({
            gesture: currentGesture,
            rotation: { x: rotX, y: rotY },
            pinchDistance: pinchDist
          });
        } else {
            // No hand detected
            setGestureState(prev => ({ ...prev, gesture: 'NONE' }));
        }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const dist = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
  };

  return (
    <HandContext.Provider value={{ gestureState, isReady, videoRef }}>
      {children}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="fixed bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-[#D4AF37] shadow-[0_0_15px_#D4AF37] opacity-80 z-50 transform scale-x-[-1]" 
      />
    </HandContext.Provider>
  );
};