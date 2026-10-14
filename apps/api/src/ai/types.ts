export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIProvider {
  generateText(messages: ChatMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<string>;
}

export type PersonaProfile = {
  displayName: string;
  language: string;
  tone: string[];
  messageLength: string;
  emojiUse: string;
  commonExpressions: string[];
  conversationHabits: string[];
  exampleMessages: string[];
  relationshipContext: string;
  uncertaintyNotes: string[];
};
