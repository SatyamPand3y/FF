import mongoose, { Schema } from "mongoose";

const PersonaSchema = new Schema({
  ownerId: { type: String, required: true, index: true },
  displayName: { type: String, required: true },
  profile: { type: Schema.Types.Mixed, required: true },
  memorySummary: { type: String, default: "" },
  consentConfirmed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Persona = mongoose.model("Persona", PersonaSchema);
