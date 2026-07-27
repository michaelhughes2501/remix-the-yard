/**
 * V3 AI Service Layer — remix_-the-yard (The Yard)
 * Production Completion Pack Part 1
 *
 * Primary provider: Google Gemini (REST — matches existing @google/genai dep).
 * Mirrors the AIService interface in _shared/lib/ai-service.ts so all apps
 * expose the same contract: chat, moderate, summarize, suggest, quickModerate.
 *
 * Usage in server.ts:
 *   import { AIService } from "./src/lib/ai-service.js";
 *   const reply = await AIService.chat([{ role: "user", content: message }]);
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ModerationResult {
  safe: boolean;
  flags: string[];
  score: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  "You are a warm, supportive assistant for The Yard — a community platform " +
  "for formerly incarcerated individuals. Help with reentry: housing, jobs, " +
  "legal aid, mental health, and peer connection. Be practical and encouraging. " +
  "Keep responses under 3 sentences unless more detail is clearly needed.";

const SAFETY_KEYWORDS = [
  "harm", "hurt", "kill", "suicide", "self-harm", "weapon", "drug deal",
  "illegal", "scam", "fraud", "violence",
];

const GEMINI_MODEL = "gemini-1.5-flash";
const geminiUrl = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;

// ── Service class ──────────────────────────────────────────────────────────────

class _AIService {
  // ── Public API (matches _shared/lib/ai-service.ts interface) ──────────────

  async chat(
    messages: ChatMessage[],
    opts: { systemPrompt?: string; context?: string; maxTokens?: number } = {},
  ): Promise<string> {
    const last = messages[messages.length - 1]?.content ?? "";
    const mod = this.quickModerate(last);
    if (!mod.safe) {
      return (
        "I can't help with that, but I'm here to support your journey. " +
        "Please reach out to a counselor or crisis line if you need immediate help."
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return this._fallback(last);

    const system = opts.systemPrompt
      ? `${SYSTEM_PROMPT}\n\n${opts.systemPrompt}`
      : opts.context
        ? `${SYSTEM_PROMPT}\n\nContext: ${opts.context}`
        : SYSTEM_PROMPT;

    // Gemini REST doesn't have a top-level systemInstruction in v1beta for
    // multi-turn, so inject system guidance as an opening exchange.
    const contents = [
      { parts: [{ text: system }], role: "user" as const },
      { parts: [{ text: "Understood. I will follow these guidelines." }], role: "model" as const },
      ...messages.map((m) => ({
        parts: [{ text: m.content }],
        role: m.role === "user" ? ("user" as const) : ("model" as const),
      })),
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(geminiUrl(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
        signal: controller.signal,
      });
      if (!res.ok) {
        console.error(`[ai] Gemini ${res.status}`);
        return this._fallback(last);
      }
      const data = (await res.json()) as any;
      return (
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm here to help — ask me about housing, jobs, legal resources, or community support."
      );
    } catch (err) {
      console.error("[ai] Gemini request failed", err);
      return this._fallback(last);
    } finally {
      clearTimeout(timeout);
    }
  }

  async moderate(text: string): Promise<ModerationResult> {
    return this.quickModerate(text);
  }

  async summarize(text: string, maxWords = 80): Promise<string> {
    if (text.length < 200) return text;
    return this.chat([
      { role: "user", content: `Summarize in ${maxWords} words or fewer:\n\n${text}` },
    ]);
  }

  async suggest(context: string, type: "resource" | "job" | "support"): Promise<string[]> {
    try {
      const raw = await this.chat([
        {
          role: "user",
          content: `Based on: "${context}"\nSuggest 3 relevant ${type}s. Return as JSON array of strings only.`,
        },
      ]);
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  quickModerate(text: string): ModerationResult {
    const lower = text.toLowerCase();
    const flags = SAFETY_KEYWORDS.filter((kw) => lower.includes(kw));
    return { safe: flags.length === 0, flags, score: flags.length / SAFETY_KEYWORDS.length };
  }

  // ── Local fallback (no API key / network error) ────────────────────────────

  private _fallback(text: string): string {
    const t = text.toLowerCase();
    if (t.includes("job") || t.includes("work") || t.includes("employ")) {
      return "Many employers offer second-chance hiring. Check the Jobs tab or search \"ban the box employers\" in your area.";
    }
    if (t.includes("housing") || t.includes("shelter") || t.includes("home")) {
      return "Transitional housing programs exist for returning citizens. Check the Resources tab for local options.";
    }
    if (t.includes("legal") || t.includes("expunge") || t.includes("record")) {
      return "Legal aid clinics can help with record expungement. Check the Resources tab for free legal services.";
    }
    return "I'm here to help with reentry resources. Check the Resources tab for housing, jobs, and legal aid.";
  }
}

// ── Singleton export ───────────────────────────────────────────────────────────
export const AIService = new _AIService();
export default AIService;
