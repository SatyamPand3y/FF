# Model testing matrix

These are candidate IDs to validate against each provider's live model list before use. Provider catalogs and free-tier access can change.

| Provider | Suggested model ID | Suggested test |
|---|---|---|
| Gemini | `gemini-3.8-flash` | Persona extraction, long context |
| Groq | `openai/gpt-oss-120b` | Main conversation quality |
| Groq | `openai/gpt-oss-20b` | Latency and lower-cost replies |
| OpenRouter | `google/gemma-4-26b-a4b-it:free` | Multilingual dialogue; verify exact endpoint |
| OpenRouter | `qwen/qwen3.8-27b:free` | Hinglish style and consistency; verify current availability |

Set the chosen provider in `apps/api/.env`, e.g.:

```dotenv
AI_PROVIDER=groq
GROQ_API_KEY=your_key
GROQ_MODEL=openai/gpt-oss-120b
```

Or:

```dotenv
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=qwen/qwen3.8-27b:free
```

The current starter selects one provider at process startup. It does not yet implement automatic cross-provider failover or a per-request provider/model selector.

## Fair evaluation
Use the same anonymized test prompts and the same extracted persona profile for every candidate. Score each reply from 1–5 for:
- Hinglish fluency and naturalness
- Similarity to the observed writing style
- Emotional appropriateness and non-generic replies
- Continuity with conversation history
- Groundedness (does not invent memories or facts)
- Latency and cost

Run at least 20 representative prompts per model and compare average scores, error rates, latency, and actual token costs. Don't rank models based on a single sample.
