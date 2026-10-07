import { Response } from "express";
import mongoose from "mongoose";

import Exam from "../../models/Exam";
import Question, { IQuestion } from "../../models/Question";
import Attempt from "../../models/Attempt";
import User from "../../models/User";
import { advanceAttemptTimer } from "../../attemptTimer";

import {
  requireAuth,
  AuthenticatedRequest,
} from "../../middleware/authMiddleware";

/* =========================================================
   HELPERS
========================================================= */

export const isValidObjectId = (
  value: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(value);
};

export const getExamId = (
  req: AuthenticatedRequest
): string => {
  const value = req.params.examId;

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export const requireInstructorAccess = (
  req: AuthenticatedRequest,
  res: Response
): boolean => {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });

    return false;
  }

  if (req.user.role !== "instructor") {
    res.status(403).json({
      message: "Instructor access required",
    });

    return false;
  }

  return true;
};

export const requireStudentAccess = (
  req: AuthenticatedRequest,
  res: Response
): boolean => {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });

    return false;
  }

  if (req.user.role !== "student") {
    res.status(403).json({
      message: "Student access required",
    });

    return false;
  }

  return true;
};

export const normalizeInstructions = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: unknown) =>
      String(item).trim()
    )
    .filter(
      (item: string) =>
        item.length > 0
    );
};

/* =========================================================
   GET PUBLISHED EXAMS
   GET /api/exams/published
========================================================= */
export const selectExamQuestions = (questions: IQuestion[], questionCount: number): IQuestion[] => {
        const shuffledQuestions =  
          [...questions];  
    
        for (  
          let index =  
            shuffledQuestions.length -  
            1;  
          index > 0;  
          index--  
        ) {  
          const randomIndex =  
            Math.floor(  
              Math.random() *  
                (index + 1)  
            );  
    
          const currentQuestion =  
            shuffledQuestions[  
              index  
            ];  
    
          shuffledQuestions[  
            index  
          ] =  
            shuffledQuestions[  
              randomIndex  
            ];  
    
          shuffledQuestions[  
            randomIndex  
          ] =  
            currentQuestion;  
        }  
    
    return shuffledQuestions.slice(0, questionCount);
};

export const getAttemptEndTime = (exam: any, startTime: Date): Date => {
  const durationEndTime = new Date(
    startTime.getTime() + Number(exam.duration) * 60 * 1000
  );
  return exam.endDate
    ? new Date(Math.min(durationEndTime.getTime(), new Date(exam.endDate).getTime()))
    : durationEndTime;
};
