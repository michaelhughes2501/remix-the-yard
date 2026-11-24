// Gemini calls go through this app's server (/api/ai/*), so no API key
// is ever bundled into the browser.

// Only these same-origin routes are ever called; the type keeps any other URL out.
type AiRoute = '/api/ai/docket-search' | '/api/ai/estimate-sentence' | '/api/ai/self-help';

async function post<T>(path: AiRoute, body: unknown, fallbackError: string): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || fallbackError);
  return data as T;
}

export const geminiService = {
  async searchCourtDocket(state: string, query: string) {
    return post<{ text: string; candidates: any[] }>('/api/ai/docket-search', { state, query }, 'Court docket search failed.');
  },

  async estimateSentence(crimeDetails: string) {
    const data = await post<{ text: string }>('/api/ai/estimate-sentence', { crimeDetails }, 'Sentence estimation failed.');
    return data.text || '';
  },

  async getSelfHelpMaterial(topic: string) {
    const data = await post<{ text: string }>('/api/ai/self-help', { topic }, 'Self-help guide generation failed.');
    return data.text || '';
  },
};
