import mongoose from "mongoose";
import { IFileDocument } from "./IFileDocument";

export interface IProblemFile extends IFileDocument {
  mode: "normal" | "game" | "paste";
  problemId: mongoose.Types.ObjectId;
  content?: string;
}

const problemFileSchema = new mongoose.Schema<IProblemFile>({
  mode: {
    type: String,
    enum: ["normal", "game", "paste"],
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["file", "folder"],
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProblemFile",
    default: null,
  },
  content: {
    type: String,
    default: "",
  },
  order: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.ProblemFile ||
  mongoose.model<IProblemFile>("ProblemFile", problemFileSchema);
