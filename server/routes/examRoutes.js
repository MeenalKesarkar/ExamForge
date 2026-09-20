const express = require("express");
const Exam = require("../models/Exam");

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

module.exports = router;