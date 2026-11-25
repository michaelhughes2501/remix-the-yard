// Gemini calls go through this app's server (/api/ai/*), so no API key
// is ever bundled into the browser. The routes need the member's session token.
// Each call names its route as a literal, so no caller-supplied URL reaches fetch.

function jsonPost(token: string | null, body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  };
}

async function readJson<T>(request: Promise<Response>, fallbackError: string): Promise<T> {
  const res = await request;
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
    return readJson<{ text: string; candidates: any[] }>(
      fetch('/api/ai/docket-search', jsonPost(token, { state, query })),
      'Court docket search failed.',
    );
  },

  async estimateSentence(token: string | null, crimeDetails: string) {
    const data = await readJson<{ text: string }>(
      fetch('/api/ai/estimate-sentence', jsonPost(token, { crimeDetails })),
      'Sentence estimation failed.',
    );
    return data.text || '';
  },

  async getSelfHelpMaterial(token: string | null, topic: string) {
    const data = await readJson<{ text: string }>(
      fetch('/api/ai/self-help', jsonPost(token, { topic })),
      'Self-help guide generation failed.',
    );
    return data.text || '';
  },
};
