// Gemini calls go through this app's server (/api/ai/*), so no API key
// is ever bundled into the browser. The routes need the member's session token.

// Only these same-origin routes are ever called; the type keeps any other URL out.
type AiRoute = '/api/ai/docket-search' | '/api/ai/estimate-sentence' | '/api/ai/self-help';

async function post<T>(path: AiRoute, token: string | null, body: unknown, fallbackError: string): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => {
    // A successful response that isn't JSON is a failure, not an empty answer.
    if (res.ok) throw new Error(fallbackError);
    return {};
  });
  if (!res.ok) throw new Error((data as { error?: string }).error || fallbackError);
  return data as T;
}

export const geminiService = {
  async searchCourtDocket(token: string | null, state: string, query: string) {
    return post<{ text: string; candidates: any[] }>('/api/ai/docket-search', token, { state, query }, 'Court docket search failed.');
  },

  async estimateSentence(token: string | null, crimeDetails: string) {
    const data = await post<{ text: string }>('/api/ai/estimate-sentence', token, { crimeDetails }, 'Sentence estimation failed.');
    return data.text || '';
  },

  async getSelfHelpMaterial(token: string | null, topic: string) {
    const data = await post<{ text: string }>('/api/ai/self-help', token, { topic }, 'Self-help guide generation failed.');
    return data.text || '';
  },
};
