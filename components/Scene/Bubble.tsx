import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Idea, IdeaCategory } from '../../types';

interface BubbleProps {
  idea: Idea;
  onSelect: (idea: Idea) => void;
  isSelected: boolean;
}

// Vibrant, Dazzling Rainbow Palette
const CATEGORY_COLORS: Record<IdeaCategory, string> = {
  [IdeaCategory.TECH]: '#00f3ff', // Electric Cyan
  [IdeaCategory.ART]: '#ff0055', // Neon Red/Pink
  [IdeaCategory.LIFE]: '#39ff14', // Neon Green
  [IdeaCategory.SCIENCE]: '#bc13fe', // Neon Purple
  [IdeaCategory.PHILOSOPHY]: '#ffd700', // Pure Gold
  [IdeaCategory.OTHER]: '#ffffff', // Bright White
};

export const Bubble: React.FC<BubbleProps> = ({ idea, onSelect, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  
  // Animation States
  const [absorbTrigger, setAbsorbTrigger] = useState(0);

  useEffect(() => {
    if (idea.lastAbsorbedAt) {
      setAbsorbTrigger(1); // Trigger absorb pulse
    }
  }, [idea.lastAbsorbedAt]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;

      // --- Base Calculations ---
      // Base wobbling (floating in space) with slight random offset based on position
      meshRef.current.position.y = idea.position[1] + Math.sin(time + idea.position[0] * 0.5) * 0.5;
      
      // --- Scale Logic ---
      let targetScale = idea.size;

      if (isSelected) {
         targetScale = idea.size * 1.5;
      } else if (hovered) {
         targetScale = idea.size * 1.2;
      }

      // Absorb Effect: If triggered, pulse significantly
      if (absorbTrigger > 0) {
        targetScale *= (1 + absorbTrigger * 0.5); // Pulse up
        // Decay the trigger
        setAbsorbTrigger(prev => Math.max(0, prev - delta * 3));
      }

      // Smoothly interpolate current scale to target scale
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);

      // --- Color/Material Logic ---
      const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
      const baseColor = new THREE.Color(CATEGORY_COLORS[idea.category]);
      
      if (isSelected) {
        // Selected: Intense Glow
        material.emissive.set(baseColor);
        material.emissiveIntensity = 0.8 + Math.sin(time * 3) * 0.3;
        material.opacity = 0.8; // Slightly more opaque when selected
      } else if (absorbTrigger > 0) {
        // Absorbing: Flash bright white/color
        material.emissive.setHex(0xffffff);
        material.emissiveIntensity = absorbTrigger * 2; 
      } else {
        // Normal state: Transparent but glowing
        material.emissive.set(baseColor);
        // Pulse slightly for "living" feel
        material.emissiveIntensity = 0.4 + Math.sin(time * 1 + idea.position[0]) * 0.1;
        material.opacity = 0.5; // 50% Transparency
      }
      
      material.color.set(baseColor);
    }
  });

  const color = CATEGORY_COLORS[idea.category];

  return (
    <group position={new THREE.Vector3(idea.position[0], idea.position[1], idea.position[2])}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(idea);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial 
            color={color} 
            roughness={0.1}  // Low roughness for gloss
            metalness={0.1}  // Low metalness to look like glass/bubble
            transmission={0.6} // Allow light to pass through
            thickness={1.5} // Refraction depth
            clearcoat={1.0} // Shiny outer layer
            clearcoatRoughness={0.1} // Polished
            ior={1.5} // Glass-like refraction
            iridescence={1.0} // Enable Gradient Rainbow Effect
            iridescenceIOR={1.3} // Range of colors
            iridescenceThicknessRange={[100, 400]} // Thickness variation for color shift
            transparent={true}
            opacity={0.5} // 50% Transparency as requested
            side={THREE.DoubleSide} // Render back of bubble for depth
            depthWrite={false} // Fixes sorting issues with transparency
            emissive={color}
        />
      </mesh>

      {/* Billboard ensures text always faces the camera */}
      <Billboard>
        <Text
          position={[0, 0, 0]} // Center text
          renderOrder={1} // Render on top
          fontSize={0.4 * (idea.size > 2 ? 1.2 : 1)} // Scale text slightly with bubble popularity
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
          outlineBlur={0.1}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          {idea.shortLabel}
        </Text>
      </Billboard>
    </group>
  );
};