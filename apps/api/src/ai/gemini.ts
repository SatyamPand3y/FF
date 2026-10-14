import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, ChatMessage } from "./types.js";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  constructor(private model: string, apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(messages: ChatMessage[], options: { temperature?: number; maxTokens?: number } = {}) {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 700
      }
    });
    const prompt = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join("\n\n");
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }
}
