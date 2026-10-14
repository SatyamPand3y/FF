import "dotenv/config";
import type { AIProvider } from "./types.js";
import { OpenAIProvider } from "./openai.js";
import { GeminiProvider } from "./gemini.js";
import { OpenAICompatibleProvider } from "./openaiCompatible.js";

export function createAIProvider(providerOverride?: string, modelOverride?: string): AIProvider {
  const provider = (providerOverride || process.env.AI_PROVIDER || "").toLowerCase();
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is required");
    return new OpenAIProvider(modelOverride || process.env.OPENAI_MODEL || "gpt-4o-mini", key);
  }
  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is required");
    return new GeminiProvider(modelOverride || process.env.GEMINI_MODEL || "gemini-3.8-flash", key);
  }
  if (provider === "groq") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is required");
    return new OpenAICompatibleProvider(
      modelOverride || process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      key,
      "https://api.groq.com/openai/v1"
    );
  }
  if (provider === "openrouter") {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is required");
    return new OpenAICompatibleProvider(
      modelOverride || process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free",
      key,
      "https://openrouter.ai/api/v1",
      {
        ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
        ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {})
      }
    );
  }
  throw new Error("Set AI_PROVIDER to openai, gemini, groq, or openrouter");
}
