import mongoose from "mongoose";
import { IFileDocument } from "./IFileDocument";

export interface ISolutionFile extends IFileDocument {
  problemId: mongoose.Types.ObjectId;
  content?: string;
}

const solutionFileSchema = new mongoose.Schema<ISolutionFile>({
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

export default mongoose.models.SolutionFile ||
  mongoose.model<ISolutionFile>("SolutionFile", solutionFileSchema);
