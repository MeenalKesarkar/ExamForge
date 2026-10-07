export interface ExamSeed {
  title: string;
  duration: number;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
  negativePenalty: number;
  instructions: string;
  questions: {
    questionText: string;
    type: "single" | "multi";
    options: string[];
    correctAnswers: string[];
    marks: number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    order: number;
  }[];
}
