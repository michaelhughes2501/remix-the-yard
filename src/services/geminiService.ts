// Client-side wrapper for the server's Gemini proxy routes. The Gemini API key
// stays on the server (server.ts, /api/ai/*) and is never shipped in the bundle.

export interface CourtDocketResult {
  text: string;
  candidates?: { groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[];
}

async function postAi<T>(path: string, body: Record<string, string>): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/ai/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `AI request failed (${res.status})`);
  return data as T;
}

export const geminiService = {
  async searchCourtDocket(state: string, query: string): Promise<CourtDocketResult> {
    return postAi<CourtDocketResult>('court-docket', { state, query });
  },

  async estimateSentence(crimeDetails: string): Promise<string> {
    const { text } = await postAi<{ text: string }>('sentence-estimate', { crimeDetails });
    return text;
  },

  async getSelfHelpMaterial(topic: string): Promise<string> {
    const { text } = await postAi<{ text: string }>('self-help', { topic });
    return text;
  }
};
