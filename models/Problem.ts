import mongoose from "mongoose";
import { Types } from "mongoose";

export interface ITestCase {
  input?: string;
  expectedOutput: string;
}

export interface IProblem {
  _id: Types.ObjectId;
  mode: "learning" | "paste";
  title?: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard" | "boss";
  hints: {
    small: string[];
    medium: string[];
    big: string[];
  };
  order?: number;
  expectedOutput?: string;
  testCases?: ITestCase[];
  solutionFiles: {
    name: string;
    type: "file" | "folder";
    content: string;
    order: number;
  }[];
}

const problemSchema = new mongoose.Schema<IProblem>({
  mode: {
    type: String,
    enum: ["learning", "paste"],
    required: true,
  },

  title: {
    type: String,
  },

  description: {
    type: String,
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard", "boss"],
  },

  hints: {
    small: {
      type: [String],
      default: [],
    },
    medium: {
      type: [String],
      default: [],
    },
    big: {
      type: [String],
      default: [],
    },
  },

  order: {
    type: Number,
  },

  expectedOutput: {
    type: String,
  },

  testCases: [
    {
      input: { type: String },
      expectedOutput: { type: String, required: true },
    },
  ],

  solutionFiles: [
    {
      name: { type: String, required: true },
      type: { type: String, enum: ["file", "folder"], default: "file" },
      content: { type: String, default: "" },
      order: { type: Number, default: 0 },
    },
  ],
});

export default mongoose.models.Problem ||
  mongoose.model<IProblem>("Problem", problemSchema);
