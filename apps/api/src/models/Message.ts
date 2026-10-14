import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema({
  ownerId: { type: String, required: true, index: true },
  personaId: { type: Schema.Types.ObjectId, required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true, maxlength: 12000 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

MessageSchema.index({ personaId: 1, createdAt: -1 });
export const Message = mongoose.model("Message", MessageSchema);
