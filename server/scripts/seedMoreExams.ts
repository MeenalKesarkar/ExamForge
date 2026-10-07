import "dotenv/config";
import mongoose from "mongoose";

import Exam from "../models/Exam";
import Question from "../models/Question";
import { examSeeds } from "./seedMoreExamsData";
import { examSeedsContinued } from "./seedMoreExamsDataContinued";

const MONGO_URI = process.env.MONGO_URI;
const exams = [...examSeeds, ...examSeedsContinued];

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing in .env");
}

// Your existing instructor: Priya Sharma
const INSTRUCTOR_ID =
  "6aaaa3db81224e43fc6e84ae";



// ======================================================
// SEED FUNCTION
// ======================================================

const seedExams = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    let examsCreated = 0;
    let questionsCreated = 0;

    for (const examData of exams) {
      // --------------------------------------------------
      // Check whether exam already exists
      // --------------------------------------------------

      const existingExam =
        await Exam.findOne({
          title: examData.title,
        });

      if (existingExam) {
        console.log(
          `Skipping existing exam: ${examData.title}`
        );

        continue;
      }

      // --------------------------------------------------
      // Create exam
      // --------------------------------------------------

      const exam = await Exam.create({
        title: examData.title,

        duration: examData.duration,

        questionCount:
          examData.questionCount,

        totalMarks:
          examData.totalMarks,

        passingMarks:
          examData.passingMarks,

        negativeMarking:
          examData.negativeMarking,

        negativePenalty:
          examData.negativePenalty,

        instructions:
          [examData.instructions],

        published: true,

        allowedAttempts: 2,

        shuffleQuestions: false,

        shuffleOptions: false,

        createdBy:
          new mongoose.Types.ObjectId(
            INSTRUCTOR_ID
          ),
      });

      examsCreated++;

      // --------------------------------------------------
      // Create questions
      // --------------------------------------------------

      const questions =
        examData.questions.map(
          (question) => ({
            examId: exam._id,

            questionText:
              question.questionText,

            type: question.type,

            options: question.options,

            correctAnswers:
              question.correctAnswers,

            marks: question.marks,

            explanation:
              question.explanation,

            difficulty:
              question.difficulty,

            order: question.order,
          })
        );

      await Question.insertMany(
        questions
      );

      questionsCreated +=
        questions.length;

      console.log(
        `Created: ${examData.title}`
      );
    }

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      `Exams created: ${examsCreated}`
    );
    console.log(
      `Questions created: ${questionsCreated}`
    );
    console.log(
      "========================================"
    );
  } catch (error) {
    console.error(
      "Error seeding exams:",
      error
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedExams();
