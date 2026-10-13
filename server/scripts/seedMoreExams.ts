import "dotenv/config";
import mongoose from "mongoose";
import Exam from "../models/Exam";
import Question from "../models/Question";
import User from "../models/User";
import { examSeeds } from "./seedMoreExamsData";
import { examSeedsContinued } from "./seedMoreExamsDataContinued";

const seeds = [...examSeeds, ...examSeedsContinued];
const marker = "ExamForge development sample seed";
const applyChanges = process.argv.includes("--apply");
const validationExamId = new mongoose.Types.ObjectId();
const validationInstructorId = new mongoose.Types.ObjectId();

async function validateSeedData(): Promise<void> {
  for (const seed of seeds) {
    if (seed.questions.length !== seed.questionCount) {
      throw new Error(`${seed.title}: questionCount does not match the question list`);
    }
    if (seed.questions.reduce((sum, question) => sum + question.marks, 0) !== seed.totalMarks) {
      throw new Error(`${seed.title}: totalMarks does not match the question marks`);
    }

    const exam = new Exam({
      title: seed.title,
      duration: seed.duration,
      questionCount: seed.questionCount,
      totalMarks: seed.totalMarks,
      passingMarks: seed.passingMarks,
      negativeMarking: seed.negativeMarking,
      negativePenalty: seed.negativePenalty,
      allowedAttempts: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      instructions: [seed.instructions, marker],
      published: false,
      createdBy: validationInstructorId,
    });
    await exam.validate();

    for (const question of seed.questions) {
      await new Question({ examId: validationExamId, ...question }).validate();
    }
  }
}

async function seedExams(): Promise<void> {
  await validateSeedData();
  console.log(`Validated ${seeds.length} exam definitions without connecting to MongoDB.`);

  if (!applyChanges) {
    console.log("Dry run only. Use --apply with a development/test database to write seed data.");
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  const databaseName = process.env.SEED_DATABASE_NAME?.trim() || "";
  const instructorId = process.env.SEED_INSTRUCTOR_ID?.trim() || "";
  if (!mongoUri) throw new Error("MONGO_URI is required to apply seed data.");
  if (process.env.NODE_ENV === "production") throw new Error("Seed writes are disabled when NODE_ENV=production.");
  if (!/(?:_DEV|_TEST)$/i.test(databaseName)) {
    throw new Error("Set SEED_DATABASE_NAME to an isolated database ending in _DEV or _TEST.");
  }
  if (!mongoose.Types.ObjectId.isValid(instructorId)) {
    throw new Error("Set SEED_INSTRUCTOR_ID to the ObjectId of a development instructor.");
  }

  try {
    await mongoose.connect(mongoUri, { dbName: databaseName });
    const instructor = await User.findById(instructorId).select("role isActive accountStatus");
    if (!instructor || instructor.role !== "instructor" || !instructor.isActive || instructor.accountStatus !== "approved") {
      throw new Error("SEED_INSTRUCTOR_ID must identify an active, approved instructor in the selected database.");
    }

    let createdExams = 0;
    let addedQuestions = 0;
    const now = new Date();

    for (const seed of seeds) {
      let exam = await Exam.findOne({
        title: seed.title,
        createdBy: instructor._id,
        instructions: marker,
      });

      if (!exam) {
        const titleAlreadyInUse = await Exam.exists({ title: seed.title, createdBy: instructor._id });
        if (titleAlreadyInUse) {
          console.warn(`Skipped "${seed.title}": an exam with this title already exists and was not created by this seed script.`);
          continue;
        }
        exam = await Exam.create({
          title: seed.title,
          duration: seed.duration,
          questionCount: seed.questionCount,
          totalMarks: seed.totalMarks,
          passingMarks: seed.passingMarks,
          negativeMarking: seed.negativeMarking,
          negativePenalty: seed.negativePenalty,
          allowedAttempts: 1,
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          instructions: [seed.instructions, marker],
          published: false,
          createdBy: instructor._id,
        });
        createdExams += 1;
      }

      for (const question of seed.questions) {
        const existingQuestion = await Question.exists({ examId: exam._id, order: question.order });
        if (existingQuestion) continue;
        await Question.create({ examId: exam._id, ...question });
        addedQuestions += 1;
      }

      const questionCount = await Question.countDocuments({ examId: exam._id });
      if (questionCount < exam.questionCount) {
        console.warn(`Left "${seed.title}" unpublished: it has ${questionCount} questions but requires ${exam.questionCount}.`);
        continue;
      }

      if (!exam.endDate || new Date(exam.endDate) <= new Date()) {
        exam.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      exam.published = true;
      await exam.save();
    }

    console.log(`Seed operation finished: ${createdExams} exam(s) created and ${addedQuestions} question(s) added.`);
  } finally {
    await mongoose.disconnect();
  }
}

void seedExams().catch((error: unknown) => {
  console.error("Seed validation/application failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
