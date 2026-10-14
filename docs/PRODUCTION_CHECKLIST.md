# Production readiness checklist

## Authentication and ownership
- [ ] Replace `demoAuth` with real verified authentication.
- [ ] Enforce ownership on every persona, history, memory and deletion endpoint.
- [ ] For Telegram, bind data to Telegram numeric user ID; never trust a client-supplied owner ID.
- [ ] Add account deletion and export.

## Privacy
- [ ] Explain that chat exports may contain third-party personal data.
- [ ] Obtain user confirmation that they have the right to process the uploaded chat.
- [ ] Publish retention, deletion, subprocessors and AI-provider disclosure.
- [ ] Never log raw chat, prompts, API keys or Telegram file URLs.
- [ ] Set provider retention/training controls where available and review terms.
- [ ] Implement retention expiry and deletion propagation to backups where feasible.

## Security
- [ ] Enforce upload size, request body size, rate limits and spending limits.
- [ ] Add file content validation and prompt-injection handling.
- [ ] Restrict CORS to exact origins.
- [ ] Use HTTPS, secret manager/environment secrets, and least-privilege DB credentials.
- [ ] Add CSRF protection if using cookie sessions.
- [ ] Add schema validation for all inputs and robust error handling.
- [ ] Avoid returning internal provider error messages to end users.
- [ ] Add abuse prevention, moderation and account suspension mechanisms.

## AI quality
- [ ] Test multiple WhatsApp export locales and date formats.
- [ ] Let users review/edit extracted profiles.
- [ ] Add explicit memory reset and persona deletion.
- [ ] Test hallucination resistance and refusal to claim to be the actual person.
- [ ] Keep examples short and only use data the user has permission to process.
- [ ] Add evaluation sets for style similarity and factual grounding.
