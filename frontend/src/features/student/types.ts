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
}

export interface StudentResult {
  attemptId: string;
  status: string;
  submittedAt?: string | null;
  exam: { title: string; subject?: string; endDate?: string | null };
  resultsAvailable: boolean;
  result: { score: number; totalMarks: number; percentage: number; passed: boolean } | null;
}

export type FilterType = "all" | "negative" | "no-negative";
