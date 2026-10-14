import OpenAI from "openai";
import type { AIProvider, ChatMessage } from "./types.js";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  constructor(private model: string, apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(messages: ChatMessage[], options: { temperature?: number; maxTokens?: number } = {}) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 700
    });
    return response.choices[0]?.message?.content?.trim() || "";
  }
}
