import mongoose from "mongoose";

export interface HintUsage {
  hintId: mongoose.Types.ObjectId;
  hintLevel: "small" | "medium" | "big";
  usedAt: Date;
}

export interface IProblemSolveRecord {
  userId: mongoose.Types.ObjectId;
  problemId: mongoose.Types.ObjectId;
  timeSpent: number;
  pointsEarned: number;
  completedAt: Date;
  hintUsages?: HintUsage[];
  level: string;
  attempt: number;
}

export const hintUsageSchema = new mongoose.Schema<HintUsage>(
  {
    hintId: { type: mongoose.Schema.Types.ObjectId, required: true },
    hintLevel: {
      type: String,
      enum: ["small", "medium", "big"],
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const problemSolveRecordSchema = new mongoose.Schema<IProblemSolveRecord>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  timeSpent: {
    type: Number,
    required: true,
  },
  pointsEarned: {
    type: Number,
    required: true,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  hintUsages: {
    type: [hintUsageSchema],
    default: [],
  },
  level: {
    type: String,
    required: true,
  },
  attempt: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.ProblemSolveRecord ||
  mongoose.model<IProblemSolveRecord>(
    "ProblemSolveRecord",
    problemSolveRecordSchema
  );
