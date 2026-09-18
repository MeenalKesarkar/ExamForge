const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("../models/User");
const Question = require("../models/Question");

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// Known IDs (from Atlas)
// ─────────────────────────────────────────────────────────────────────────────
const IDS = {
  // Users
  priya:  "6aaaa3db81224e43fc6e84ae",   // instructor  — password OK
  rahul:  "6aaaa3ed81224e43fc6e84b0",   // student     — password OK
  sneha:  "6aaaa3fc81224e43fc6e84b2",   // student     — ❌ fake hash
  arjun:  "6aaaa40b81224e43fc6e84b4",   // student     — ❌ fake hash

  // Questions (examId: 6aaaa44481224e43fc6e84b7)
  q1: "6aaaa59881224e43fc6e84c1",  // "Which keyword is used to declare a constant in JavaScript?"
  q2: "6aaaa61281224e43fc6e84c3",  // "Which method converts a JSON string into a JavaScript object?"
  q3: "6aaaa62d81224e43fc6e84c5",  // "Which of the following are JavaScript primitive data types?"
  q4: "6aaaa64a81224e43fc6e84c7",  // "Which symbol is used for strict equality in JavaScript?"
  q5: "6aaaa66b81224e43fc6e84c9",  // "Which of the following are valid JavaScript loop statements?"
};

// ─────────────────────────────────────────────────────────────────────────────
// Enrichment data for questions
// NOTE: options/correctAnswers are NOT touched — they already exist in Atlas.
//       We only $set the fields that are missing.
// ─────────────────────────────────────────────────────────────────────────────
const questionPatches = [
  {
    _id: IDS.q1,
    marks: 1,
    difficulty: "easy",
    order: 1,
    explanation:
      "'const' declares a block-scoped variable whose binding cannot be reassigned. " +
      "'var' is function-scoped and hoisted; 'let' is block-scoped but mutable; " +
      "'static' is not a variable-declaration keyword in JavaScript.",
  },
  {
    _id: IDS.q2,
    marks: 1,
    difficulty: "easy",
    order: 2,
    explanation:
      "JSON.parse() parses a JSON-formatted string and returns the equivalent JavaScript object. " +
      "JSON.stringify() does the reverse — it converts a JS object into a JSON string.",
  },
  {
    _id: IDS.q3,
    marks: 1,
    difficulty: "medium",
    order: 3,
    explanation:
      "JavaScript has 7 primitive types: String, Number, BigInt, Boolean, Undefined, Symbol, and Null. " +
      "Arrays and Objects are not primitives — they are reference types.",
  },
  {
    _id: IDS.q4,
    marks: 1,
    difficulty: "easy",
    order: 4,
    explanation:
      "=== is the strict equality operator. It checks both value AND type without any type coercion. " +
      "== (loose equality) performs type coercion before comparing, which can lead to unexpected results.",
  },
  {
    _id: IDS.q5,
    marks: 1,
    difficulty: "medium",
    order: 5,
    explanation:
      "JavaScript supports: for, while, do...while, for...in, and for...of loops. " +
      "'foreach' (lowercase, no dots) is not a valid JS loop — forEach() is an Array method, not a loop statement.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Fix passwords for Sneha & Arjun
// ─────────────────────────────────────────────────────────────────────────────
const userPasswordFixes = [
  { _id: IDS.sneha, email: "sneha.student@example.com", plainPassword: "Sneha@123" },
  { _id: IDS.arjun, email: "arjun.student@example.com", plainPassword: "Arjun@123" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main fix function
// ─────────────────────────────────────────────────────────────────────────────
const fixDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "ExamForge" });
    console.log("✅  MongoDB connected\n");

    // ── 1. Fix placeholder passwords ─────────────────────────────────────────
    console.log("━━━ [1/3] Fixing placeholder passwords ━━━━━━━━━━━━━━━━━━━━━━");
    for (const user of userPasswordFixes) {
      const hash = await bcrypt.hash(user.plainPassword, 10);
      const result = await User.updateOne(
        { _id: new mongoose.Types.ObjectId(user._id) },
        { $set: { passwordHash: hash } }
      );
      console.log(
        result.modifiedCount
          ? `   ✅  ${user.email}  →  password set to "${user.plainPassword}"`
          : `   ⚠️   ${user.email}  →  no changes (already fixed?)`
      );
    }

    // ── 2. Add missing user fields (institution, isActive) ───────────────────
    console.log("\n━━━ [2/3] Adding missing user fields ━━━━━━━━━━━━━━━━━━━━━━━━");
    const userIds = [IDS.priya, IDS.rahul, IDS.sneha, IDS.arjun].map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const r1 = await User.updateMany(
      { _id: { $in: userIds }, institution: { $exists: false } },
      { $set: { institution: "ExamForge Academy" } }
    );
    const r2 = await User.updateMany(
      { _id: { $in: userIds }, isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    console.log(`   ✅  institution added to ${r1.modifiedCount} user(s)`);
    console.log(`   ✅  isActive added to ${r2.modifiedCount} user(s)`);

    // ── 3. Enrich questions with missing fields ───────────────────────────────
    console.log("\n━━━ [3/3] Enriching questions with missing fields ━━━━━━━━━━━");
    for (const patch of questionPatches) {
      const { _id, ...fields } = patch;
      const result = await Question.updateOne(
        { _id: new mongoose.Types.ObjectId(_id) },
        { $set: fields }
      );
      const q = await Question.findById(_id).select("questionText difficulty marks order");
      const preview = q ? q.questionText.slice(0, 55) + "..." : _id;
      console.log(
        result.modifiedCount
          ? `   ✅  [${fields.order}] (${fields.difficulty}, ${fields.marks}pt) ${preview}`
          : `   ⚠️   [${fields.order}] already enriched — ${preview}`
      );
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log("\n━━━ Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   Passwords fixed  : Sneha@123  |  Arjun@123");
    console.log("   Questions patched: explanation + difficulty + marks + order");
    console.log("   Options/answers  : untouched (already correct in Atlas)");

    await mongoose.disconnect();
    console.log("\n🎉  All fixes applied. MongoDB disconnected.");
  } catch (error) {
    console.error("\n❌  Fix failed:", error.message);
    process.exit(1);
  }
};

fixDatabase();
