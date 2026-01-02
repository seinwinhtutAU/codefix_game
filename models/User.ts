import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Unique identifier for the user
  username: {
    type: String,
    required: true,
    unique: true, // Ensures no two users share the same username
    trim: true, // Removes whitespace from both ends of a string
  },

  // User's email address
  email: {
    type: String,
    required: true,
    unique: true, // Ensures no two users share the same email
    trim: true,
    lowercase: true, // Stores the email in all lowercase
  },

  // Hashed password (never store the plaintext password!)
  password: {
    type: String,
    required: true,
  },

  // Date the user account was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the model, ensuring it's only defined once
export default mongoose.models.User || mongoose.model("User", userSchema);
