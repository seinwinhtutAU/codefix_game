import mongoose from "mongoose";
import { IFileDocument } from "./IFileDocument";

export interface IUserCodeFile extends IFileDocument {
  userId: mongoose.Types.ObjectId;
  problemId: mongoose.Types.ObjectId;
  content?: string;
}

const userCodeFileSchema = new mongoose.Schema<IUserCodeFile>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
    index: true,
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
  content: {
    type: String,
    default: "",
  },
  order: {
    type: Number,
    default: 0,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
});

// Unique constraint: one user cannot have duplicate file paths per problem
userCodeFileSchema.index(
  { userId: 1, problemId: 1, name: 1, parentId: 1 },
  { unique: true }
);

export default mongoose.models.UserCodeFile ||
  mongoose.model<IUserCodeFile>("UserCodeFile", userCodeFileSchema);
