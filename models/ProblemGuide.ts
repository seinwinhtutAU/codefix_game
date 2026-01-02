import mongoose, { Schema, Document, Model } from "mongoose";

export interface GuideBlock {
  type: string;
  content: string;
  language?: string;
}

export interface IProblemGuide extends Document {
  problemId: string;
  level: "easy" | "medium" | "hard";
  guideContent: GuideBlock[];
}

const GuideBlockSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    language: {
      type: String,
    },
  },
  { _id: false }
);

const ProblemGuideSchema = new Schema(
  {
    problemId: {
      type: String,
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    guideContent: {
      type: [GuideBlockSchema],
      required: true,
    },
  },
  { timestamps: true }
);

const ProblemGuide: Model<IProblemGuide> =
  mongoose.models.ProblemGuide ||
  mongoose.model<IProblemGuide>("ProblemGuide", ProblemGuideSchema);

export default ProblemGuide;
