export interface ExamQuestion {
  _id: string;
  examId: string;
  questionText: string;
  type: "single" | "multi";
  options: string[];
  marks: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  order: number;
}

export interface AttemptData {
  _id: string;
  examId: string;
  studentId: string;
  questionIds: string[];
  answers: Record<string, string[]>;
  startTime: string;
  endTime: string;
  timerPaused?: boolean;
  submittedAt?: string | null;
  status: "IN_PROGRESS" | "SUBMITTED" | "EVALUATED" | "TIMED_OUT";
  tabSwitchCount?: number;
  proctoringDisqualified?: boolean;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
}

export interface ExamData {
  _id: string;
  title: string;
  subject?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking?: boolean;
  negativePenalty?: number;
  instructions?: string[];
}

export interface ExamResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passingMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  answeredCount: number;
  questionResults?: Array<{
    questionId: string;
    answered: boolean;
    correct: boolean;
    marks: number;
  }>;
}

export interface AttemptResponse {
  attempt: AttemptData;
  exam: ExamData;
  questions: ExamQuestion[];
  serverNow: string;
  remainingSeconds?: number;
  timerPaused?: boolean;
  resultsAvailable?: boolean;
  result?: ExamResult | null;
}
