import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { playSoundEffect } from "@/lib/sounds";

interface SpinWheelProps {
  isSpinning: boolean;
  spinResult: number | null;
  selectedNumber: number | null;
}

export default function SpinWheel({ isSpinning, spinResult, selectedNumber }: SpinWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Define the wheel segments
  const segments = [2, 3, 4, 5, 6, 7, 8];
  const segmentAngle = 360 / segments.length;
  
  // Calculate the rotation angle based on the result
  useEffect(() => {
    if (!wheelRef.current || !isSpinning || spinResult === null) return;
    
    // Play spinning sound
    playSoundEffect('spinning');
    
    // Calculate rotations (5-10 full rotations for effect)
    const rotations = 5 + Math.floor(Math.random() * 5);
    const fullRotation = rotations * 360;
    
    // Calculate the result index and angle
    const resultIndex = segments.indexOf(spinResult);
    const resultAngle = resultIndex * segmentAngle;
    
    // Total rotation is full rotations plus the angle needed to land on the result
    const totalRotation = fullRotation + (360 - resultAngle);
    
    // Apply rotation
    wheelRef.current.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.3, 0.9)';
    wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
    
    // When the wheel stops spinning, play the appropriate sound
    setTimeout(() => {
      if (spinResult === selectedNumber) {
        playSoundEffect('win');
      } else {
        playSoundEffect('lose');
      }
    }, 5000); // Same as the transition duration
  }, [isSpinning, spinResult, selectedNumber, segments, segmentAngle]);
  
  return (
    <div className="relative my-4 mx-auto">
      <div className="w-64 h-64 md:w-72 md:h-72 relative mx-auto">
        {/* Wheel */}
        <div 
          ref={wheelRef}
          className="w-full h-full rounded-full bg-[#002B5B] border-4 border-gray-700 relative overflow-hidden"
          style={{ transformOrigin: 'center center' }}
        >
          {/* Segments */}
          {segments.map((number, index) => {
            const rotation = index * segmentAngle;
            const isSelected = number === selectedNumber;
            
            return (
              <div
                key={number}
                className={`absolute top-0 left-0 w-full h-full flex items-center justify-center ${
                  isSelected ? 'text-[#FFD700]' : 'text-white'
                }`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <div 
                  className={`absolute top-0 left-1/2 h-1/2 w-px bg-gray-600`}
                  style={{ transformOrigin: 'bottom center' }}
                ></div>
                <span 
                  className={`absolute top-5 left-1/2 transform -translate-x-1/2 text-2xl font-bold ${
                    isSelected ? 'text-[#FFD700]' : 'text-white'
                  }`}
                >
                  {number}
                </span>
              </div>
            );
          })}
          
          {/* Center point */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black border-2 border-gray-700 z-10"></div>
        </div>
        
        {/* Arrow (indicator) */}
        <div 
          ref={arrowRef}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-red-600 z-20"
          style={{ transformOrigin: 'bottom center' }}
        ></div>
        
        {/* Arrow triangle */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-600 z-20"></div>
      </div>
    </div>
  );
}
