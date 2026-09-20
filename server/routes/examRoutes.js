const express = require("express");

const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");

const router = express.Router();

// Get all published exams
router.get("/published", async (req, res) => {
  try {
    const exams = await Exam.find({ published: true })
      .select("title duration questionCount negativeMarking negativePenalty")
      .sort({ createdAt: -1 });

    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching published exams:", error);

    res.status(500).json({
      message: "Failed to fetch published exams",
    });
  }
});

// Start an exam
router.post("/:examId/start", async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId } = req.body;

    // Check that student ID was provided
    if (!studentId) {
      return res.status(400).json({
        message: "Student ID is required",
      });
    }

    // Find the published exam
    const exam = await Exam.findOne({
      _id: examId,
      published: true,
    });

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found or not published",
      });
    }

    // Check if the student already has an attempt
    const existingAttempt = await Attempt.findOne({
      studentId,
      examId,
    });

    if (existingAttempt) {
      return res.status(409).json({
        message: "You have already attempted this exam",
        attemptId: existingAttempt._id,
      });
    }

    // Select random questions from this exam
    const questions = await Question.aggregate([
      {
        $match: {
          examId: exam._id,
        },
      },
      {
        $sample: {
          size: exam.questionCount,
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]);

    // Make sure enough questions are available
    if (questions.length < exam.questionCount) {
      return res.status(400).json({
        message: "Not enough questions available for this exam",
      });
    }

    // Store the selected question IDs
    const questionIds = questions.map((question) => question._id);

    // Server-side start time
    const startTime = new Date();

    // Calculate server-side end time
    const endTime = new Date(
      startTime.getTime() + exam.duration * 60 * 1000
    );

    // Create the attempt
    const attempt = await Attempt.create({
      studentId,
      examId,
      questionIds,
      answers: {},
      startTime,
      endTime,
      status: "IN_PROGRESS",
    });

    res.status(201).json({
      message: "Exam started successfully",
      attempt,
    });
  } catch (error) {
    console.error("Error starting exam:", error);

    // Handles duplicate student + exam attempts
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already attempted this exam",
      });
    }

    res.status(500).json({
      message: "Failed to start exam",
    });
  }
});

module.exports = router;