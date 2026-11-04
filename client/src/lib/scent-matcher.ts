export type ScentAnswers = {
  mood?: string;
  moment?: string;
  intensity?: string;
};

export type ScentCandidate = {
  id: string;
  family: string;
  notes: string;
  vibe?: string;
  type?: string;
};

const keywords: Record<string, string[]> = {
  Fresh: ["fresh", "citrus", "green", "bright", "bergamot", "grapefruit", "neroli", "aquatic", "clean"],
  Soft: ["soft", "clean", "musk", "musky", "linen", "skin", "powder", "vanilla", "floral"],
  Magnetic: ["magnetic", "amber", "spicy", "oud", "rose", "vanilla", "warm", "smoky", "bold"],
  Grounded: ["grounded", "woody", "wood", "cedar", "sandalwood", "vetiver", "earthy", "moss", "patchouli"],
  Everyday: ["fresh", "clean", "musk", "musky", "citrus", "soft", "edt"],
  "After dark": ["amber", "spicy", "oud", "woody", "smoky", "parfum", "bold", "vanilla"],
  "Slow mornings": ["soft", "clean", "musk", "musky", "fresh", "linen", "tea", "light"],
  "A special occasion": ["floral", "amber", "rose", "oud", "parfum", "incense", "magnetic"],
  "Skin-close": ["musk", "musky", "clean", "linen", "soft", "light", "skin"],
  "A quiet trail": ["balanced", "woody", "floral", "green", "fresh", "cedar"],
  "Make an entrance": ["amber", "oud", "spicy", "bold", "parfum", "smoky", "intense"],
  "Let it linger": ["amber", "vanilla", "oud", "sandalwood", "woody", "incense", "warm"],
};

function scoreAxis(candidateText: string, answer: string | undefined): number {
  if (!answer) return 0;
  const terms = keywords[answer] ?? [answer.toLowerCase()];
  return terms.reduce((score, term) => score + (candidateText.includes(term.toLowerCase()) ? 1 : 0), 0);
}

export function recommendScent<T extends ScentCandidate>(products: T[], answers: ScentAnswers): T | undefined {
  if (products.length === 0) return undefined;
  const axisWeights = { mood: 5, moment: 3, intensity: 3 };
  return products.reduce((best, product) => {
    const text = `${product.family} ${product.notes} ${product.vibe ?? ""} ${product.type ?? ""}`.toLowerCase();
    const score =
      scoreAxis(text, answers.mood) * axisWeights.mood +
      scoreAxis(text, answers.moment) * axisWeights.moment +
      scoreAxis(text, answers.intensity) * axisWeights.intensity;
    const bestText = `${best.family} ${best.notes} ${best.vibe ?? ""} ${best.type ?? ""}`.toLowerCase();
    const bestScore =
      scoreAxis(bestText, answers.mood) * axisWeights.mood +
      scoreAxis(bestText, answers.moment) * axisWeights.moment +
      scoreAxis(bestText, answers.intensity) * axisWeights.intensity;
    return score > bestScore ? product : best;
  });
}
