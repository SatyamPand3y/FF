import OpenAI from "openai";
import type { AIProvider, ChatMessage } from "./types.js";

export class OpenAICompatibleProvider implements AIProvider {
  private client: OpenAI;
  constructor(
    private model: string,
    apiKey: string,
    baseURL: string,
    private extraHeaders: Record<string, string> = {}
  ) {
    this.client = new OpenAI({ apiKey, baseURL, defaultHeaders: extraHeaders });
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
