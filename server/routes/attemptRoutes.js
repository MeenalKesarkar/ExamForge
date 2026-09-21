const express = require("express");

const Attempt = require("../models/Attempt");
const Question = require("../models/Question");

const router = express.Router();

// Get an attempt and its questions
router.get("/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params;

    // Find the attempt
    const attempt = await Attempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found",
      });
    }

    // Server-side expiry check
    if (
      attempt.status === "IN_PROGRESS" &&
      new Date() >= new Date(attempt.endTime)
    ) {
      attempt.status = "TIMED_OUT";
      attempt.submittedAt = new Date();

      await attempt.save();
    }

    // Fetch only the questions assigned to this attempt
    const questions = await Question.find({
      _id: { $in: attempt.questionIds },
    }).select(
      "_id questionText type options marks"
    );

    res.status(200).json({
      message: "Attempt fetched successfully",
      attempt,
      questions,
    });
  } catch (error) {
    console.error("Error fetching attempt:", error);

    res.status(500).json({
      message: "Failed to fetch attempt",
    });
  }
});

// Save an answer for an attempt
router.patch("/:attemptId/answer", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedAnswers } = req.body;

    // Validate request
    if (!questionId || !Array.isArray(selectedAnswers)) {
      return res.status(400).json({
        message: "Question ID and selected answers are required",
      });
    }

    // Find attempt
    const attempt = await Attempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found",
      });
    }

    // Check if attempt is already completed
    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "This exam is no longer in progress",
      });
    }

    // Check server-side expiry
    if (new Date() >= new Date(attempt.endTime)) {
      attempt.status = "TIMED_OUT";
      attempt.submittedAt = new Date();

      await attempt.save();

      return res.status(400).json({
        message: "Time is over. The exam has ended.",
      });
    }

    // Make sure this question belongs to this attempt
    const questionBelongsToAttempt =
      attempt.questionIds.some(
        (id) => id.toString() === questionId.toString()
      );

    if (!questionBelongsToAttempt) {
      return res.status(400).json({
        message: "This question does not belong to the attempt",
      });
    }

    // Save the answer
    attempt.answers.set(
      questionId,
      selectedAnswers
    );

    await attempt.save();

    res.status(200).json({
      message: "Answer saved successfully",
      answers: attempt.answers,
    });
  } catch (error) {
    console.error("Error saving answer:", error);

    res.status(500).json({
      message: "Failed to save answer",
    });
  }
});

module.exports = router;