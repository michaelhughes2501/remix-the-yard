import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async searchCourtDocket(state: string, query: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the official court docket or case search website for ${state}. Also search for cases related to: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  },

  async estimateSentence(crimeDetails: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Act as a legal information assistant. Based on the following crime details, provide a rough estimate of potential sentencing ranges based on common state and federal guidelines. Include a strong disclaimer that this is NOT legal advice. Details: ${crimeDetails}`,
    });
    return response.text;
  },

  async getSelfHelpMaterial(topic: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a supportive, motivational, and practical self-help guide for someone recently released from prison focusing on: ${topic}. Include actionable steps and mental health resources.`,
    });
    return response.text;
  }
};
