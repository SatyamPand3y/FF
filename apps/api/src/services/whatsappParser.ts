export type ParsedMessage = { timestamp?: string; speaker: string; text: string };

// Supports common WhatsApp TXT exports, including:
// [9/27/26, 2:13:20 PM] Ashutosh: Hello
// 14/10/26, 9:30 pm - Ashutosh: Hello
// [14/10/2026, 21:30:00] Ashutosh: Hello
const patterns = [
  // Bracketed WhatsApp format: [date, time] Sender: Message
  /^\u200e?\[(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\]\s+([^:]+):\s?(.*)$/,
  // Unbracketed export format: date, time - Sender: Message
  /^\u200e?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+-\s+([^:]+):\s?(.*)$/,
  // Bracketed 24-hour format: [date, time] Sender: Message
  /^\u200e?\[(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?)\]\s+([^:]+):\s?(.*)$/
];

export function parseWhatsAppTxt(input: string): ParsedMessage[] {
  const lines = input.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n");
  const messages: ParsedMessage[] = [];
  for (const raw of lines) {
    const line = raw.replace(/^\u200e/, "");
    let match: RegExpMatchArray | null = null;
    for (const pattern of patterns) {
      match = line.match(pattern);
      if (match) break;
    }
    if (match) {
      const [, timestamp, speaker, text] = match;
      messages.push({ timestamp, speaker: speaker.trim(), text: text ?? "" });
    } else if (messages.length && line.trim()) {
      // Continuation lines belong to the previous message, including multiline messages.
      messages[messages.length - 1].text += "\n" + line;
    }
  }
  return messages.filter(m => m.speaker && m.text.trim());
}
