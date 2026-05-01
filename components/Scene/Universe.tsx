import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Idea } from '../../types';
import { Bubble } from './Bubble';

interface UniverseProps {
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
  selectedIdeaId?: string;
  focusTrigger: number;
}

// Controls camera animation to focus on selected ideas
const CameraRig = ({ selectedIdea, focusTrigger }: { selectedIdea: Idea | undefined, focusTrigger: number }) => {
    const { camera, controls } = useThree();
    const targetPos = useRef(new THREE.Vector3());
    const cameraPos = useRef(new THREE.Vector3());
    const isAnimating = useRef(false);

    useEffect(() => {
        if (selectedIdea) {
            // 1. Set target to the idea position
            targetPos.current.set(selectedIdea.position[0], selectedIdea.position[1], selectedIdea.position[2]);
            
            // 2. Calculate camera position
            // Maintain viewing direction but move closer (distance 15)
            const currentPos = camera.position.clone();
            const controlsTarget = (controls as any)?.target || new THREE.Vector3(0,0,0);
            
            let direction = new THREE.Vector3().subVectors(currentPos, controlsTarget).normalize();
            if (direction.lengthSq() < 0.001) direction.set(0, 0, 1);

            cameraPos.current.copy(targetPos.current).add(direction.multiplyScalar(15));
            
            isAnimating.current = true;
        }
    }, [selectedIdea, focusTrigger, camera, controls]);

    useFrame((state, delta) => {
        if (!isAnimating.current || !controls) return;
        
        const orb = controls as any;
        const step = delta * 3; // Animation speed
        
        // Interpolate
        orb.target.lerp(targetPos.current, step);
        state.camera.position.lerp(cameraPos.current, step);
        
        orb.update();

        // Stop when close enough
        if (state.camera.position.distanceTo(cameraPos.current) < 0.5 && orb.target.distanceTo(targetPos.current) < 0.5) {
            isAnimating.current = false;
        }
    });

    return null;
};

const Connections: React.FC<{ ideas: Idea[] }> = ({ ideas }) => {
  const lines = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points: number[] = [];
    const processedPairs = new Set<string>();

    ideas.forEach(idea => {
      idea.relatedIds.forEach(relId => {
        const target = ideas.find(i => i.id === relId);
        if (target) {
          // Unique key to prevent double drawing
          const pairKey = [idea.id, target.id].sort().join('-');
          if (!processedPairs.has(pairKey)) {
            points.push(...idea.position);
            points.push(...target.position);
            processedPairs.add(pairKey);
          }
        }
      });
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [ideas]);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial 
        color="#a5f3fc" // Very Bright Cyan
        transparent 
        opacity={0.3} 
        linewidth={1} 
        blending={THREE.AdditiveBlending} // Additive blending makes them glow against dark background
        depthWrite={false} // Helps with transparency sorting
      />
    </lineSegments>
  );
};

export const Universe: React.FC<UniverseProps> = ({ ideas, onSelectIdea, selectedIdeaId, focusTrigger }) => {
  const selectedIdea = ideas.find(i => i.id === selectedIdeaId);

  return (
    <div className="w-full h-full absolute top-0 left-0 z-0 bg-[#020205]">
      <Canvas camera={{ position: [0, 0, 80], fov: 50 }}>
        <fog attach="fog" args={['#020205', 40, 200]} />
        
        {/* Lighting for depth and bubble aesthetics */}
        <ambientLight intensity={0.5} />
        <pointLight position={[50, 50, 50]} intensity={1} color="#ffffff" />
        <pointLight position={[-50, -50, -50]} intensity={0.8} color="#4f46e5" />
        <pointLight position={[0, 0, 0]} intensity={0.3} color="#f472b6" distance={50} />

        {/* Background Elements to emphasize travel */}
        <Stars radius={200} depth={50} count={7000} factor={4} saturation={0.5} fade speed={0.5} />
        {/* Floating particles to feel the zoom/travel */}
        <Sparkles count={500} scale={120} size={2} speed={0.2} opacity={0.5} color="#ffffff" />
        
        <Environment preset="city" />

        <group>
            {ideas.map((idea) => (
                <Bubble 
                    key={idea.id} 
                    idea={idea} 
                    onSelect={onSelectIdea} 
                    isSelected={selectedIdeaId === idea.id} 
                />
            ))}
            <Connections ideas={ideas} />
        </group>

        <CameraRig selectedIdea={selectedIdea} focusTrigger={focusTrigger} />

        <OrbitControls 
            makeDefault // Important for usage in CameraRig
            enablePan={false} // Disable pan to keep universe centered
            enableZoom={true} 
            zoomSpeed={1.2} // Responsive zoom
            enableRotate={true}
            rotateSpeed={0.5} // Smooth rotation
            autoRotate={true} 
            autoRotateSpeed={0.3} // Gentle drift
            minDistance={5} // Allow getting closer
            maxDistance={150} // Stay within fog
            enableDamping={true}
            dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
};