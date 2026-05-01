import React, { useState, useEffect, useCallback } from 'react';
import { Universe } from './components/Scene/Universe';
import { Sidebar } from './components/Sidebar';
import { ChatInput } from './components/ChatInput';
import { Idea } from './types';
import { processRawIdeas } from './utils/dataGenerator';
import { analyzeAndProcessIdea, fetchAIUniverseContent } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Initialize Universe with AI Data
  useEffect(() => {
    const initUniverse = async () => {
      try {
        const rawContent = await fetchAIUniverseContent();
        const processedIdeas = processRawIdeas(rawContent);
        setIdeas(processedIdeas);
      } catch (e) {
        console.error("Initialization failed", e);
        // Fallback handled inside processRawIdeas if array is empty
        setIdeas(processRawIdeas([]));
      } finally {
        setIsInitializing(false);
      }
    };

    initUniverse();
  }, []);

  const handleSelectIdea = useCallback((idea: Idea) => {
    setSelectedIdea(idea);
    setIsSidebarOpen(true);
  }, []);

  const handleLocateIdea = () => {
    setFocusTrigger(prev => prev + 1);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setTimeout(() => setSelectedIdea(null), 500);
  };

  // Allow Sidebar to update an idea (e.g., after generating an answer)
  const handleUpdateIdea = (id: string, updates: Partial<Idea>) => {
    setIdeas(prev => prev.map(idea => {
        if (idea.id === id) {
            const updated = { ...idea, ...updates };
            // If this is the currently selected idea, update it too to reflect changes immediately
            if (selectedIdea && selectedIdea.id === id) {
                setSelectedIdea(updated);
            }
            return updated;
        }
        return idea;
    }));
  };

  const handleNewInspiration = async (text: string) => {
    setIsProcessing(true);
    
    try {
      const result = await analyzeAndProcessIdea(text, ideas);
      
      if (result.isDuplicate && result.existingIdeaId) {
        // --- ABSORB LOGIC ---
        let updatedIdea: Idea | null = null;

        setIdeas(prev => prev.map(idea => {
          if (idea.id === result.existingIdeaId) {
            updatedIdea = {
              ...idea,
              size: idea.size + 1.0, // Increase attention/size
              likes: idea.likes + 1,
              aiResponse: result.answer, // Update with fresh answer
              lastAbsorbedAt: Date.now() // Trigger Absorb Animation
            };
            return updatedIdea;
          }
          return idea;
        }));

        if (updatedIdea) {
          handleSelectIdea(updatedIdea);
          handleLocateIdea();
        }

      } else {
        // --- NEW IDEA LOGIC ---
        
        // Calculate Position based on Category Cluster
        const categoryIdeas = ideas.filter(i => i.category === result.category);
        let targetPos: [number, number, number] = [0,0,0];
        
        if (categoryIdeas.length > 0) {
            // Find center of cluster
            const sum = categoryIdeas.reduce((acc, curr) => [acc[0]+curr.position[0], acc[1]+curr.position[1], acc[2]+curr.position[2]], [0,0,0]);
            targetPos = [
                sum[0]/categoryIdeas.length + (Math.random() * 10 - 5),
                sum[1]/categoryIdeas.length + (Math.random() * 10 - 5),
                sum[2]/categoryIdeas.length + (Math.random() * 10 - 5)
            ];
        } else {
            // If no category match, place randomly but somewhat central
            targetPos = [Math.random()*30-15, Math.random()*30-15, Math.random()*30-15];
        }

        // Connect to related ideas (Semantically close or spatially close)
        const relatedIds: string[] = [];
        categoryIdeas.forEach(ci => {
            const dist = Math.sqrt(
                Math.pow(targetPos[0] - ci.position[0], 2) +
                Math.pow(targetPos[1] - ci.position[1], 2) +
                Math.pow(targetPos[2] - ci.position[2], 2)
            );
            if (dist < 25 && relatedIds.length < 4) {
                relatedIds.push(ci.id);
            }
        });

        const newIdea: Idea = {
          id: uuidv4(),
          content: text,
          shortLabel: text.substring(0, 15) + "...",
          position: targetPos,
          category: result.category,
          tags: result.tags || ["New", result.category],
          size: 2.0, // Start slightly larger than average
          likes: 0,
          follows: 0,
          createdAt: new Date().toISOString(),
          relatedIds: relatedIds,
          aiResponse: result.answer
        };

        setIdeas(prev => [...prev, newIdea]);
        handleSelectIdea(newIdea);
        handleLocateIdea();
      }

    } catch (e) {
      console.error("Error processing inspiration", e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isInitializing) {
      return (
          <div className="w-full h-full bg-[#020205] flex flex-col items-center justify-center text-white">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
                  <Loader2 size={64} className="animate-spin text-blue-500 relative z-10" />
              </div>
              <h2 className="text-3xl font-light tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400">INSPIRATION FLOW</h2>
              <p className="text-gray-500 mt-4 text-sm font-mono">Synthesizing Universe Data...</p>
          </div>
      );
  }

  return (
    <div className="relative w-full h-full bg-[#020205]">
      <Universe 
        ideas={ideas} 
        onSelectIdea={handleSelectIdea} 
        selectedIdeaId={selectedIdea?.id}
        focusTrigger={focusTrigger}
      />

      <div className="absolute top-6 left-6 z-10 pointer-events-none select-none">
        <h1 className="text-5xl font-bold text-white tracking-tighter drop-shadow-lg">
          Inspiration<span className="text-blue-500">.</span>Flow
        </h1>
        <div className="flex items-center gap-3 mt-2">
            <div className="h-px w-10 bg-gray-600"></div>
            <p className="text-gray-400 text-xs font-mono tracking-widest uppercase">
                {ideas.length} Points of Origin
            </p>
        </div>
      </div>

      <Sidebar 
        idea={selectedIdea} 
        allIdeas={ideas}
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar}
        onSelectRelated={handleSelectIdea}
        loadingAI={isProcessing && !selectedIdea?.aiResponse}
        onUpdateIdea={handleUpdateIdea}
        onLocate={handleLocateIdea}
      />

      <ChatInput onSubmit={handleNewInspiration} isProcessing={isProcessing} />
    </div>
  );
};

export default App;