
import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";
import mongoose from "mongoose";
import { createAIProvider } from "../ai/index.js";
import { Persona } from "../models/Persona.js";
import { Message } from "../models/Message.js";
import { parseWhatsAppTxt } from "../services/whatsappParser.js";
import { extractPersona } from "../services/personaService.js";
import { generateReply } from "../services/chatService.js";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is required");
}

await mongoose.connect(mongoUri);

const bot = new Bot(token);

const extractionAI = createAIProvider(
  process.env.EXTRACTION_AI_PROVIDER || process.env.AI_PROVIDER,
  process.env.EXTRACTION_MODEL
);

const chatAI = createAIProvider(
  process.env.CHAT_AI_PROVIDER || process.env.AI_PROVIDER,
  process.env.CHAT_MODEL
);

const pendingTarget = new Map<
  number,
  {
    speakers: string[];
    messages: ReturnType<typeof parseWhatsAppTxt>;
  }
>();

const activePersona = new Map<number, string>();

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Hi! I simulate a communication style from a chat export. I am not the real person.\n\n" +
      "Send a WhatsApp .txt export, then choose the speaker.\n" +
      "Commands: /personas, /use <personaId>, /forget <personaId>"
  );
});

bot.command("personas", async (ctx) => {
  if (!ctx.from) return;

  const ownerId = `tg:${ctx.from.id}`;

  const items = await Persona.find({ ownerId })
    .select("_id displayName")
    .lean();

  if (!items.length) {
    return ctx.reply(
      "No saved personas yet. Send a WhatsApp .txt export first."
    );
  }

  await ctx.reply(
    items
      .map((p) => `${p.displayName} — ${p._id}`)
      .join("\n") +
      "\n\nUse /use <id> to select one."
  );
});

bot.command("use", async (ctx) => {
  if (!ctx.from) return;

  const id = ctx.match?.trim();

  if (!id) {
    return ctx.reply("Usage: /use <personaId>");
  }

  const ownerId = `tg:${ctx.from.id}`;

  const persona = await Persona.findOne({
    _id: id,
    ownerId,
  }).select("_id displayName");

  if (!persona) {
    return ctx.reply("Persona not found.");
  }

  activePersona.set(ctx.from.id, String(persona._id));

  await ctx.reply(
    `Selected "${persona.displayName}" simulation. Send a message to chat.`
  );
});

bot.command("forget", async (ctx) => {
  if (!ctx.from) return;

  const id = ctx.match?.trim();

  if (!id) {
    return ctx.reply("Usage: /forget <personaId>");
  }

  const ownerId = `tg:${ctx.from.id}`;

  const persona = await Persona.findOneAndDelete({
    _id: id,
    ownerId,
  });

  if (!persona) {
    return ctx.reply("Persona not found.");
  }

  await Message.deleteMany({
    ownerId,
    personaId: persona._id,
  });

  activePersona.delete(ctx.from.id);

  await ctx.reply("Persona and saved messages deleted.");
});

bot.on("message:document", async (ctx) => {
  if (!ctx.from) return;

  const doc = ctx.message.document;

  if (
    !doc.file_name?.toLowerCase().endsWith(".txt") ||
    (doc.file_size && doc.file_size > 2 * 1024 * 1024)
  ) {
    return ctx.reply("Please send a .txt file under 2 MB.");
  }

  const file = await ctx.api.getFile(doc.file_id);

  if (!file.file_path) {
    return ctx.reply("Could not access the file.");
  }

  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const response = await fetch(url);

  if (!response.ok) {
    return ctx.reply("File download failed.");
  }

  const raw = await response.text();
  const messages = parseWhatsAppTxt(raw);
  const speakers = [...new Set(messages.map((m) => m.speaker))];

  if (speakers.length < 2 || messages.length < 3) {
    return ctx.reply("Could not parse enough WhatsApp messages.");
  }

  pendingTarget.set(ctx.from.id, {
    speakers,
    messages,
  });

  const keyboard = new InlineKeyboard();

  speakers.slice(0, 8).forEach((speaker) => {
    keyboard
      .text(
        speaker.slice(0, 50),
        `speaker:${encodeURIComponent(speaker)}`
      )
      .row();
  });

  await ctx.reply(
    "Choose which participant's style to simulate. Confirm you have permission to use this chat.",
    { reply_markup: keyboard }
  );
});

bot.on("callback_query:data", async (ctx) => {
  if (!ctx.from) {
    return ctx.answerCallbackQuery();
  }

  const data = ctx.callbackQuery.data;

  if (!data.startsWith("speaker:")) {
    return ctx.answerCallbackQuery();
  }

  const pending = pendingTarget.get(ctx.from.id);

  if (!pending) {
    return ctx.answerCallbackQuery({
      text: "Upload the file again.",
    });
  }

  let speaker: string;

  try {
    speaker = decodeURIComponent(data.slice("speaker:".length));
  } catch {
    return ctx.answerCallbackQuery({
      text: "Invalid participant selection.",
    });
  }

  if (!pending.speakers.includes(speaker)) {
    return ctx.answerCallbackQuery({
      text: "Unknown participant.",
    });
  }

  try {
    const profile = await extractPersona(
      extractionAI,
      pending.messages,
      speaker
    );

    const persona = await Persona.create({
      ownerId: `tg:${ctx.from.id}`,
      displayName: profile.displayName,
      profile,
      memorySummary: "",
      consentConfirmed: true,
    });

    activePersona.set(ctx.from.id, String(persona._id));
    pendingTarget.delete(ctx.from.id);

    await ctx.answerCallbackQuery();

    await ctx.editMessageText(
      `Saved simulation: ${profile.displayName}\n` +
        "Use /personas to manage personas. Send a message to chat."
    );
  } catch (error) {
    console.error("Telegram persona extraction failed:", error);

    await ctx.answerCallbackQuery({
      text: "Analysis failed. Try a cleaner export.",
    });
  }
});

bot.on("message:text", async (ctx) => {
  if (!ctx.from) return;

  const text = ctx.message.text;

  if (text.startsWith("/")) return;

  const personaId = activePersona.get(ctx.from.id);

  if (!personaId) {
    return ctx.reply(
      "Choose a persona first. Use /personas, or upload a WhatsApp .txt export."
    );
  }

  const ownerId = `tg:${ctx.from.id}`;

  const persona = await Persona.findOne({
    _id: personaId,
    ownerId,
  });

  if (!persona) {
    return ctx.reply("Persona not found. Use /personas.");
  }

  try {
    const recent = await Message.find({
      ownerId,
      personaId: persona._id,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const history = recent.reverse().map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

    const reply = await generateReply(
      chatAI,
      persona.profile,
      persona.memorySummary || "",
      history,
      text
    );

    await Message.create({
      ownerId,
      personaId: persona._id,
      role: "user",
      content: text,
    });

    await Message.create({
      ownerId,
      personaId: persona._id,
      role: "assistant",
      content: reply,
    });

    await ctx.reply(reply);
  } catch (error) {
    console.error("Telegram reply generation failed:", error);

    await ctx.reply(
      "Sorry, I couldn't generate a reply just now. Try again."
    );
  }
});

bot.catch((err) => {
  console.error("Telegram bot error", err.message);
});

bot.start();

console.log("Telegram bot started");
