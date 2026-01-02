import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Problem",
      index: true,
    },

    // Number of attempts for this problem
    attempts: {
      type: Number,
      default: 0,
    },

    // Did user successfully solve the problem?
    solved: {
      type: Boolean,
      default: false,
    },

    // last result: correct / incorrect / error / pending
    lastStatus: {
      type: String,
      enum: ["correct", "incorrect", "error", "pending"],
      default: "pending",
    },

    // last submission time
    lastSubmittedAt: {
      type: Date,
      default: null,
    },

    // Track hint usage
    hintsUsed: {
      small: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      big: { type: Number, default: 0 },
    },

    // Store first successful submission
    bestSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure one progress per user/problem
userProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.models.UserProgress ||
  mongoose.model("UserProgress", userProgressSchema);
