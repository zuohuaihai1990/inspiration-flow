import { Idea, IdeaCategory } from "../types";
import { v4 as uuidv4 } from 'uuid';

// Fallback data in case API fails
const FALLBACK_TOPICS = [
  { text: "AI Ethics Paradox", cat: IdeaCategory.PHILOSOPHY, ans: "Logic cannot encode morality perfectly.", tags: ["Ethics", "Logic"] },
  { text: "Neural Networks Art", cat: IdeaCategory.ART, ans: "Beauty in the weights and biases.", tags: ["Art", "Neural"] },
  { text: "Quantum Computing AI", cat: IdeaCategory.TECH, ans: "Speed beyond linear time.", tags: ["Quantum", "Future"] },
  { text: "Robotic Companionship", cat: IdeaCategory.LIFE, ans: "Warmth from cold metal.", tags: ["Robotics", "Love"] },
  { text: "Algorithmic Governance", cat: IdeaCategory.SCIENCE, ans: "Efficiency vs Empathy.", tags: ["Politics", "Algo"] },
];

function randomSpherePoint(radius: number): [number, number, number] {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return [x, y, z];
}

export const processRawIdeas = (
  rawIdeas: Array<{content: string, answer: string, category: IdeaCategory, tags?: string[]}>
): Idea[] => {
  const ideas: Idea[] = [];
  
  // If API returned empty or failed, use fallback and multiply
  let sourceData = rawIdeas;
  if (sourceData.length === 0) {
      // Generate 100 fake ones
      for(let i=0; i<100; i++) {
          const t = FALLBACK_TOPICS[i % FALLBACK_TOPICS.length];
          sourceData.push({ 
              content: `${t.text} #${i+1}`, 
              category: t.cat, 
              answer: t.ans,
              tags: t.tags
          });
      }
  } else if (sourceData.length < 100) {
      // Duplicate to fill universe if we got less than 100 to save tokens
      const originalLen = sourceData.length;
      while(sourceData.length < 100) {
          const original = sourceData[sourceData.length % originalLen];
          sourceData.push({ ...original });
      }
  }

  // Cap at 100 to keep performance good
  const processedData = sourceData.slice(0, 100);

  processedData.forEach((item, index) => {
    // Cluster topics roughly by category
    let baseX = 0, baseY = 0, baseZ = 0;
    
    switch(item.category) {
        case IdeaCategory.TECH: baseX = 20; break;
        case IdeaCategory.ART: baseX = -20; break;
        case IdeaCategory.SCIENCE: baseY = 20; break;
        case IdeaCategory.LIFE: baseY = -20; break;
        case IdeaCategory.PHILOSOPHY: baseZ = 20; break;
        default: baseZ = -20; break;
    }

    // Add randomness around the cluster center
    const [rx, ry, rz] = randomSpherePoint(15); 
    
    const x = baseX + rx + (Math.random() * 10 - 5);
    const y = baseY + ry + (Math.random() * 10 - 5);
    const z = baseZ + rz + (Math.random() * 10 - 5);

    ideas.push({
      id: uuidv4(),
      content: item.content,
      shortLabel: item.content.length > 15 ? item.content.substring(0, 15) + "..." : item.content,
      position: [x, y, z],
      category: item.category,
      tags: item.tags || ["AI", item.category],
      size: 1 + Math.random() * 2,
      likes: Math.floor(Math.random() * 500),
      follows: Math.floor(Math.random() * 200),
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      relatedIds: [],
      aiResponse: item.answer
    });
  });

  // Create "Free Connections"
  // Logic: Connect ideas that are either close in space OR share a category, 
  // but limit connections to avoid a messy mesh.
  for (let i = 0; i < ideas.length; i++) {
      let connectionsCount = 0;
      for (let j = i + 1; j < ideas.length; j++) {
          const dist = Math.sqrt(
              Math.pow(ideas[i].position[0] - ideas[j].position[0], 2) +
              Math.pow(ideas[i].position[1] - ideas[j].position[1], 2) +
              Math.pow(ideas[i].position[2] - ideas[j].position[2], 2)
          );
          
          const isSameCategory = ideas[i].category === ideas[j].category;
          
          // Connect if very close OR (close-ish AND same category)
          if ((dist < 8) || (dist < 20 && isSameCategory)) {
             // Random chance to connect to keep it "free" and not fully meshed
             if (Math.random() > 0.85 && connectionsCount < 4) {
                  ideas[i].relatedIds.push(ideas[j].id);
                  ideas[j].relatedIds.push(ideas[i].id);
                  connectionsCount++;
             }
          }
      }
  }

  return ideas;
};