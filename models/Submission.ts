import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ["learning", "paste"],
    required: true,
    default: "learning",
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },

  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Problem",
  },

  // Store each submitted file separately
  files: [
    {
      name: String,
      path: String, // optional for folder structure
      content: String, // submitted code
      type: {
        type: String,
        enum: ["file", "folder"],
        default: "file",
      },
    },
  ],

  result: {
    status: {
      type: String,
      enum: ["pending", "correct", "incorrect", "error"],
      default: "pending",
    },
    message: String, // runtime error, feedback, etc.
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Submission ||
  mongoose.model("Submission", submissionSchema);
