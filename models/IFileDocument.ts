import mongoose from "mongoose";

// Shared interface for all file/folder documents
export interface IFileDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: "file" | "folder";
  parentId?: mongoose.Types.ObjectId | null;
  order?: number;
}
