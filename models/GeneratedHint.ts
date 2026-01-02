import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGeneratedHint extends Document {
  userId: string; // associate hint with a user
  level: "small" | "medium" | "big";
  hint: string;
  createdAt: Date;
}

const GeneratedHintSchema: Schema<IGeneratedHint> = new Schema(
  {
    userId: { type: String, required: true, index: true },
    level: { type: String, enum: ["small", "medium", "big"], required: true },
    hint: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // only createdAt
);

// Avoid model overwrite in Next.js hot reload
const GeneratedHint: Model<IGeneratedHint> =
  mongoose.models.GeneratedHint ||
  mongoose.model<IGeneratedHint>("GeneratedHint", GeneratedHintSchema);

export default GeneratedHint;
