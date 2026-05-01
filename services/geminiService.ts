import { GoogleGenAI, Type } from "@google/genai";
import { Idea, IdeaCategory, GeminiAnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const modelId = 'gemini-2.5-flash';
// Updated key to force fresh data load with new colors and answers
const STORAGE_KEY = 'inspiration_universe_data_v4_rainbow'; 

/**
 * Fetches a batch of 100 AI-related ideas to initialize the universe.
 * Checks localStorage first to avoid regeneration.
 */
export const fetchAIUniverseContent = async (): Promise<Array<{content: string, answer: string, category: IdeaCategory, tags: string[]}>> => {
  // 1. Check Local Storage
  const cachedData = localStorage.getItem(STORAGE_KEY);
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log("Loaded universe from local storage.");
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse cached data, fetching fresh.");
    }
  }

  if (!ai) {
    console.warn("No API Key, returning empty list for simulation fallback.");
    return [];
  }

  // Prompt explicitly requesting 100 items with answers.
  const prompt = `
    Generate a list of exactly 100 unique, creative, and diverse inspiration points or questions about "Artificial Intelligence", "Consciousness", "Future Humanity", "Digital Art", and "Tech Philosophy".
    
    Crucial Requirement:
    For EACH item, you MUST generate a brief, witty, or profound "answer" or insight.
    
    The response must be a JSON array.
    Each item object must follow this schema:
    1. "content": The idea/question itself (max 12 words).
    2. "answer": A short, insightful answer/commentary to the content (max 20 words).
    3. "category": One of [Technology, Art, Life, Science, Philosophy, Other].
    4. "tags": An array of 2-3 short keywords.
    
    Example:
    [
      { "content": "Do Androids dream?", "answer": "Only of electric sheep, and sometimes infinite loops.", "category": "Science", "tags": ["Robotics", "Dreams"] },
      { "content": "AI as Art Creator", "answer": "The brush is digital, but the intent is borrowed.", "category": "Art", "tags": ["Generative", "Creativity"] }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              answer: { type: Type.STRING },
              category: { type: Type.STRING, enum: Object.values(IdeaCategory) },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        if (Array.isArray(data)) {
             // Save to local storage
             localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
             return data; 
        }
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch initial universe:", error);
    return [];
  }
};

/**
 * Analyzes a new input string against existing ideas.
 */
export const analyzeAndProcessIdea = async (
  inputText: string,
  existingIdeas: Idea[]
): Promise<GeminiAnalysisResult> => {
  if (!ai) {
    return {
      isDuplicate: false,
      category: IdeaCategory.OTHER,
      answer: "API Key missing. Simulated response for: " + inputText,
      tags: ["Simulation", "NoAPI"]
    };
  }

  // Send a simplified map to save tokens, but enough for semantic matching
  const simplifiedMap = existingIdeas.map(i => ({ id: i.id, content: i.content }));
  
  const prompt = `
    User Input: "${inputText}"
    
    Existing Ideas (Snippet):
    ${JSON.stringify(simplifiedMap.slice(0, 50))} 

    Task:
    1. Check if User Input is semantically identical or very similar to an existing idea.
    2. Categorize: Technology, Art, Life, Science, Philosophy, Other.
    3. Provide a thoughtful AI response (max 50 words).
    4. Generate 2-3 tags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isDuplicate: { type: Type.BOOLEAN },
            existingIdeaId: { type: Type.STRING },
            category: { type: Type.STRING, enum: Object.values(IdeaCategory) },
            answer: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");
    
    const data = JSON.parse(resultText);

    return {
      isDuplicate: data.isDuplicate,
      existingIdeaId: data.existingIdeaId,
      category: data.category as IdeaCategory,
      answer: data.answer,
      tags: data.tags || []
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      isDuplicate: false,
      category: IdeaCategory.OTHER,
      answer: "The cosmos is silent right now. (API Error)",
      tags: ["Error"]
    };
  }
};

/**
 * Generates a specific answer for a given idea content.
 */
export const generateSpecificAnswer = async (content: string): Promise<string> => {
  if (!ai) {
      return new Promise(resolve => setTimeout(() => resolve("The stars are aligning to bring you an answer (Simulation)."), 1000));
  }

  const prompt = `Provide a short, witty, philosophical or profound answer (max 30 words) to the inspiration: "${content}"`;
  
  try {
      const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
      });
      return response.text || "No answer found in the stars.";
  } catch(e) {
      console.error("Gemini Answer Error:", e);
      return "The universe is momentarily silent.";
  }
};