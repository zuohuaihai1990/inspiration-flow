import React, { useState } from 'react';
import { Idea } from '../types';
import { X, Heart, UserPlus, Clock, Sparkles, Tag, ArrowRight, MessageSquarePlus, Loader2, MapPin } from 'lucide-react';
import { generateSpecificAnswer } from '../services/geminiService';

interface SidebarProps {
  idea: Idea | null;
  allIdeas: Idea[];
  isOpen: boolean;
  onClose: () => void;
  onSelectRelated: (idea: Idea) => void;
  loadingAI: boolean;
  onUpdateIdea: (id: string, updates: Partial<Idea>) => void;
  onLocate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ idea, allIdeas, isOpen, onClose, onSelectRelated, loadingAI, onUpdateIdea, onLocate }) => {
  const [aiText, setAiText] = React.useState<string | undefined>(idea?.aiResponse);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);

  React.useEffect(() => {
    setAiText(idea?.aiResponse);
  }, [idea]);

  const handleGenerateAnswer = async () => {
      if (!idea) return;
      setIsGeneratingAnswer(true);
      try {
          const answer = await generateSpecificAnswer(idea.content);
          setAiText(answer);
          onUpdateIdea(idea.id, { aiResponse: answer });
      } catch (error) {
          console.error(error);
      } finally {
          setIsGeneratingAnswer(false);
      }
  };

  if (!idea) return null;

  const formattedDate = new Date(idea.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
  });

  // Get related ideas (Top 5)
  const relatedIdeas = allIdeas.filter(i => idea.relatedIds.includes(i.id)).slice(0, 5);

  return (
    <div 
        className={`fixed top-0 right-0 h-full w-96 bg-black/90 backdrop-blur-xl border-l border-white/10 text-white shadow-2xl transform transition-transform duration-500 ease-in-out z-20 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
        <span className="text-xs uppercase tracking-widest text-blue-400 border border-blue-400/30 px-3 py-1 rounded-full">{idea.category}</span>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* 1. Content / Title */}
        <div className="group">
            <h2 
                onClick={onLocate}
                className="text-2xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 cursor-pointer hover:opacity-80 transition-opacity select-none"
                title="Click to locate bubble in universe"
            >
                {idea.content}
            </h2>
            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-400">
                 <MapPin size={10} /> Click title to locate
            </div>
            <div className="flex gap-4 mt-3 text-gray-500 text-xs">
                <div className="flex items-center gap-1"><Heart size={12} /> {idea.likes}</div>
                <div className="flex items-center gap-1"><UserPlus size={12} /> {idea.follows}</div>
                <div className="flex items-center gap-1"><Clock size={12} /> {formattedDate}</div>
            </div>
        </div>

        {/* 2. Tags */}
        <div className="flex flex-wrap gap-2">
            {idea.tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 text-xs font-medium text-emerald-300 bg-emerald-900/20 px-2 py-1 rounded-md border border-emerald-500/20">
                    <Tag size={10} /> {tag}
                </span>
            ))}
        </div>

        {/* 3. AI Answer Section */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden group flex flex-col gap-3">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-center">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-300 uppercase tracking-wider">
                    <Sparkles size={14} />
                    Cosmic Insight
                </h3>
                
                <button 
                    onClick={handleGenerateAnswer}
                    disabled={isGeneratingAnswer || loadingAI}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isGeneratingAnswer ? (
                       <><Loader2 size={10} className="animate-spin" /> Generating...</>
                   ) : (
                       <><MessageSquarePlus size={12} /> Answer</>
                   )}
                </button>
            </div>

            <div className="text-gray-300 leading-relaxed text-sm font-light min-h-[60px]">
                {loadingAI || isGeneratingAnswer ? (
                    <div className="flex flex-col gap-2 animate-pulse py-2">
                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                        <div className="h-2 bg-white/10 rounded w-1/2"></div>
                        <div className="text-xs text-blue-400 mt-2 animate-bounce">Decoding the matrix...</div>
                    </div>
                ) : (
                    <p>{aiText || <span className="italic text-gray-500">Click 'Answer' to reveal the cosmic wisdom...</span>}</p>
                )}
            </div>
        </div>

        {/* 4. Related Ideas */}
        {relatedIdeas.length > 0 && (
            <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Related Sparks</h3>
                <ul className="space-y-2">
                    {relatedIdeas.map(related => (
                        <li key={related.id}>
                            <button 
                                onClick={() => onSelectRelated(related)}
                                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group flex justify-between items-center"
                            >
                                <span className="text-sm text-gray-300 group-hover:text-white truncate pr-2">
                                    {related.content}
                                </span>
                                <ArrowRight size={14} className="text-gray-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}

      </div>
        
      <div className="p-4 border-t border-white/10 text-center text-[10px] text-gray-700">
         ID: {idea.id}
      </div>
    </div>
  );
};