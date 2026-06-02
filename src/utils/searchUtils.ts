export function calculateRelevanceScore(item: any, query: string, weights: Record<string, number>): number {
  if (!query.trim()) return 1;

  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let score = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const value = item[key];
    if (typeof value !== 'string' && typeof value !== 'number') continue;

    const stringValue = String(value).toLowerCase();
    
    for (const term of searchTerms) {
      // Exact field match (e.g., searching "general" and category is "general")
      if (stringValue === term) {
        score += weight * 4;
      } else {
        // Exact word match inside the field
        // We use a simple boundary check to avoid regex issues with special characters
        const words = stringValue.split(/[^a-z0-9]+/);
        if (words.includes(term)) {
          score += weight * 2;
        } else if (stringValue.includes(term)) {
          // Partial match (e.g., searching "gen" matches "general")
          score += weight;
        }
      }
    }
  }

  return score;
}
