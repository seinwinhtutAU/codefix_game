import mongoose, { Schema, Types, Model } from "mongoose";

/* =====================================================
   Interfaces
===================================================== */

export interface CurrentTask {
  taskType: "code_problem" | "none";
  taskId?: Types.ObjectId;
  status: "none" | "in_progress" | "completed";
}

export interface GameState {
  currentScene: string;
  eventFlags: Record<string, boolean>;
  currentTask: CurrentTask;
}

export interface IGameProgress {
  userId: Types.ObjectId;
  lastLocation: string;
  gameState: GameState;
  updatedAt: Date;
}

/* =====================================================
   Sub Schemas
===================================================== */

const currentTaskSchema = new Schema<CurrentTask>(
  {
    taskType: {
      type: String,
      enum: ["code_problem", "none"],
      default: "none",
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
    },
    status: {
      type: String,
      enum: ["none", "in_progress", "completed"],
      default: "none",
    },
  },
  { _id: false }
);

const gameStateSchema = new Schema<GameState>(
  {
    currentScene: {
      type: String,
      default: "IntroScene",
    },

    /**
     * Narrative / scene flags ONLY
     * ❌ Do NOT store "problem solved" here
     * ✔ That lives in ProblemSolveRecord
     */
    eventFlags: {
      type: Map,
      of: Boolean,
      default: {
        introCompleted: false,
      },
    },

    currentTask: {
      type: currentTaskSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

/* =====================================================
   Main Schema
===================================================== */

const gameProgressSchema = new Schema<IGameProgress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // one save per user
    index: true,
  },

  /**
   * Last visited route
   * e.g. /game, /problem/123
   */
  lastLocation: {
    type: String,
    default: "/game",
  },

  gameState: {
    type: gameStateSchema,
    default: () => ({}),
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

/* =====================================================
   Middleware
===================================================== */

// DO NOT use arrow function
gameProgressSchema.pre("save", function () {
  this.updatedAt = new Date();
});

/* =====================================================
   Export Model
===================================================== */

const GameProgressModel: Model<IGameProgress> =
  mongoose.models.GameProgress ||
  mongoose.model<IGameProgress>("GameProgress", gameProgressSchema);

export default GameProgressModel;
