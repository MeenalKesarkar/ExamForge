export interface Exam {
  _id: string;
  title: string;
  duration: number;
  questionCount: number;
  negativeMarking: boolean;
  negativePenalty: number;
  allowedAttempts: number;
  startDate?: string | null;
  endDate?: string | null;
  availabilityStatus?: "UPCOMING" | "ACTIVE" | "EXPIRED";
  attemptsUsed?: number;
  attemptsRemaining?: number;
  activeAttemptId?: string | null;
  activeAttemptPaused?: boolean;
}

export interface StudentResult {
  attemptId: string;
  status: string;
  submittedAt?: string | null;
  exam: { title: string; subject?: string; endDate?: string | null; questionCount?: number };
  resultsAvailable: boolean;
  resultMessage?: string | null;
  result: { score: number; totalMarks: number; correctCount?: number; percentage: number; passed: boolean } | null;
}

export type FilterType = "all" | "negative" | "no-negative";
