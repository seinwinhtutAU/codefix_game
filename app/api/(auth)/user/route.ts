import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";
import ProblemSolveRecord from "@/models/ProblemSolveRecord";
import UserCodeFile from "@/models/UserCodeFile";

export async function GET() {
  try {
    await dbConnect();

    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const email = url.searchParams.get("email");
    const confirmAll = url.searchParams.get("confirmAll");
    const keepUsers = url.searchParams.get("keepUsers");

    // Case 1: Delete all users (requires confirmation)
    if (confirmAll === "true") {
      // If keepUsers=true, we won't delete users (just return info)
      if (keepUsers === "true") {
        const totalUsers = await User.countDocuments();
        return NextResponse.json(
          {
            success: true,
            message: `Operation skipped. ${totalUsers} users were preserved.`,
            note: "Use ?confirmAll=true without &keepUsers=true to delete all users",
          },
          { status: 200 }
        );
      }

      // Get all user IDs first for cleaning up related data
      const allUsers = await User.find({}, "_id").lean();
      const userIds = allUsers.map((u) => u._id.toString());

      // Delete all users and their related data in parallel
      const [deletedUsers, deletedSolveRecords, deletedUserCodes] =
        await Promise.all([
          User.deleteMany({}),
          ProblemSolveRecord.deleteMany({ userId: { $in: userIds } }),
          UserCodeFile.deleteMany({ userId: { $in: userIds } }),
        ]);

      return NextResponse.json(
        {
          success: true,
          message: `Successfully deleted ${deletedUsers.deletedCount} users and all related data`,
          data: {
            deletedUsers: deletedUsers.deletedCount,
            deletedSolveRecords: deletedSolveRecords.deletedCount,
            deletedUserCodes: deletedUserCodes.deletedCount,
          },
        },
        { status: 200 }
      );
    }

    // Case 2: Delete by user ID
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid userId format",
          },
          { status: 400 }
        );
      }

      const userIdObj = new mongoose.Types.ObjectId(userId);

      // Delete user and all related data in parallel
      const [deletedUser, deletedSolveRecords, deletedUserCodes] =
        await Promise.all([
          User.findByIdAndDelete(userIdObj),
          ProblemSolveRecord.deleteMany({ userId: userIdObj }),
          UserCodeFile.deleteMany({ userId: userIdObj }),
        ]);

      if (!deletedUser) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "User and all related data deleted successfully",
          data: {
            user: {
              userId: deletedUser._id,
              email: deletedUser.email,
              username: deletedUser.username,
            },
            relatedDataDeleted: {
              solveRecords: deletedSolveRecords.deletedCount,
              userCodeFiles: deletedUserCodes.deletedCount,
            },
          },
        },
        { status: 200 }
      );
    }

    // Case 3: Delete by email
    if (email) {
      if (!email.includes("@")) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email format",
          },
          { status: 400 }
        );
      }

      // First find the user to get their ID
      const user = await User.findOne({ email });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found with this email",
          },
          { status: 404 }
        );
      }

      const userIdObj = user._id;

      // Delete user and all related data in parallel
      const [deletedUser, deletedSolveRecords, deletedUserCodes] =
        await Promise.all([
          User.findOneAndDelete({ email }),
          ProblemSolveRecord.deleteMany({ userId: userIdObj }),
          UserCodeFile.deleteMany({ userId: userIdObj }),
        ]);

      return NextResponse.json(
        {
          success: true,
          message: "User and all related data deleted successfully",
          data: {
            user: {
              userId: deletedUser._id,
              email: deletedUser.email,
              username: deletedUser.username,
            },
            relatedDataDeleted: {
              solveRecords: deletedSolveRecords.deletedCount,
              userCodeFiles: deletedUserCodes.deletedCount,
            },
          },
        },
        { status: 200 }
      );
    }

    // No valid parameters provided
    return NextResponse.json(
      {
        success: false,
        message:
          "Please provide at least one parameter: userId, email, or confirmAll=true",
        note: "To delete all users, use ?confirmAll=true (use &keepUsers=true to skip deletion)",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
