import dns from "dns";

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import Exam from "../models/Exam";
import Question from "../models/Question";
import Attempt from "../models/Attempt";
import PasswordReset from "../models/PasswordReset";

dotenv.config();

/**
 * Read-only MongoDB diagnostic. This command never creates, updates, or
 * deletes collections or documents.
 */
const diagnoseDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  try {
    await mongoose.connect(mongoUri, { dbName: "ExamForge" });
    const database = mongoose.connection.db;
    if (!database) throw new Error("MongoDB connected without a selected database");

    const collections = await database.listCollections({}, { nameOnly: true }).toArray();
    const existingNames = new Set(collections.map((collection) => collection.name));
    const expected = [User, Exam, Question, Attempt, PasswordReset].map((model) => model.collection.name);
    const missing = expected.filter((name) => !existingNames.has(name));

    console.log(`Connected to database: ${mongoose.connection.name}`);
    console.log(`Collections found: ${collections.map(({ name }) => name).sort().join(", ") || "none"}`);
    if (missing.length > 0) {
      console.warn(`Expected collections not present yet: ${missing.join(", ")}`);
      console.warn("MongoDB creates these collections when the application first writes documents.");
    } else {
      console.log("All ExamForge model collections are present.");
    }
    console.log("Diagnostic completed. No database records were changed.");
  } finally {
    await mongoose.disconnect();
  }
};

void diagnoseDatabase().catch((error: unknown) => {
  console.error("Database diagnostic failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
