# Persona Chatbot Starter

A starter monorepo for a website + Telegram bot that learns communication style from an uploaded WhatsApp `.txt` export.

## Stack
- `apps/web`: React + Vite + TypeScript
- `apps/api`: Express + TypeScript, MongoDB/Mongoose, provider adapters
- Telegram: grammY, using the same backend personality/chat services
- AI provider interface: OpenAI-compatible and Gemini adapter examples

## Important limitations
This is a starter scaffold, not a production-audited application. Run tests, add monitoring, configure backups, and review privacy/security requirements before launching. It simulates communication style; it does not make the real person present or authenticate as them. Only upload conversations you have the right to use. Keep raw chat content private and provide deletion controls.

## Requirements
- Node.js 20+
- MongoDB Atlas or local MongoDB
- An API key for one supported provider
- Optional Telegram bot token from BotFather

## Quick start
1. Copy `.env.example` to `apps/api/.env` and fill in values.
2. Install dependencies from the repo root:
   ```bash
   npm install
   ```
3. Start the API:
   ```bash
   npm run dev:api
   ```
4. In another terminal, start the website:
   ```bash
   npm run dev:web
   ```
5. Open the Vite URL printed in the terminal.

The API has a guest mode for local prototyping. For a public launch, configure a real session/auth provider, email verification, CSRF protection if using cookies, rate limiting, abuse controls, and proper account deletion. Do not use the demo guest identity as real authentication.

## Project layout
```text
apps/
  api/
    src/
      ai/              provider interface + adapters
      bot/             Telegram bot
      middleware/      auth and rate limits
      models/          MongoDB models
      services/        TXT parser, persona extraction, chat memory
      routes/          API endpoints
  web/
    src/               minimal chat UI
```

## API flow
1. `POST /api/personas/analyze` accepts a `.txt` file and target speaker.
2. The server parses WhatsApp export lines, identifies participants, and creates a style profile using the configured AI provider.
3. `POST /api/chat/:personaId` stores the user message, retrieves recent messages and summary memory, and generates a response.
4. `DELETE /api/personas/:personaId` deletes the persona and associated conversation records.

## WhatsApp TXT format
Supports common exports such as:
`14/10/26, 9:30 pm - Person: Message`
and
`[14/10/2026, 21:30:00] Person: Message`

Multiline messages are joined to the previous message. Export formats vary; validate the participant list and sample messages before analysis.

## Provider selection
Set `AI_PROVIDER=openai`, `gemini`, `groq`, or `openrouter`. The Groq and OpenRouter integrations use OpenAI-compatible chat completions. Keep keys only in the backend environment. Never expose provider keys in Vite variables or browser code.

## Deployment outline
- Web: Vercel, Netlify, or Cloudflare Pages. Set `VITE_API_BASE_URL` to the deployed API.
- API + Telegram bot: Render, Railway, Fly.io, or another Node host. Set environment variables there.
- Database: MongoDB Atlas with network access restricted as much as practical.
- Configure CORS to the exact frontend domain, HTTPS, request limits, log redaction, and a privacy policy.
- Telegram bot can run as a separate worker using `npm run start:bot`, or be hosted alongside the API if the platform supports a persistent process.

## Before production
- Replace demo guest identity with real authentication and per-user ownership checks.
- Add malware scanning if supporting more file types; this starter only accepts text.
- Add CSRF protection if using cookie-based sessions.
- Add per-account and per-IP rate limits and provider-spend caps.
- Encrypt sensitive fields at rest where appropriate; do not log uploaded text or prompts.
- Set a raw-upload retention policy. This scaffold does not persist raw uploads after parsing.
- Add user consent confirmation, deletion tests, backups, and incident response procedures.


### Separate extraction and chat models
Optionally configure `EXTRACTION_AI_PROVIDER` + `EXTRACTION_MODEL` and `CHAT_AI_PROVIDER` + `CHAT_MODEL`. For example, use Gemini for persona extraction and Groq for chat replies. Each provider needs its own backend API key. If role-specific variables are omitted, the configured `AI_PROVIDER` and provider model are used.
