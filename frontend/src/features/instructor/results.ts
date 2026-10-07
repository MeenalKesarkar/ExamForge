export interface Exam {
  _id: string;
  title: string;
  subject?: string;
  degree?: string;
  yearOfStudy?: number;
  semester?: number;
  duration: number;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
}

export interface Attempt {
  _id: string;

  student?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        studentId?: string;
        yearOfStudy?: number;
        semester?: number;
      };

  studentId?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        studentId?: string;
        yearOfStudy?: number;
        semester?: number;
      };

  examId: string;

  startTime: string;
  endTime: string;
  submittedAt?: string | null;

  status:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "EVALUATED"
    | "TIMED_OUT";

  score?: number;
  totalMarks?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  percentage?: number;
  passed?: boolean;
  tabSwitchCount?: number;
}

export interface AttemptListResponse {
  attempts?: Attempt[];
  data?: Attempt[];
}

export function getStudentName(attempt: Attempt): string {
  const student =
    attempt.student ??
    attempt.studentId;

  if (
    typeof student === "object" &&
    student
  ) {
    return student.name;
  }

  return "Student";
}

export function getStudentEmail(attempt: Attempt): string {
  const student =
    attempt.student ??
    attempt.studentId;

  if (
    typeof student === "object" &&
    student
  ) {
    return student.email;
  }

  return "";
}

export function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusLabel(
  status: Attempt["status"]
): string {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";

    case "EVALUATED":
      return "Evaluated";

    case "TIMED_OUT":
      return "Timed Out";

    case "IN_PROGRESS":
      return "In Progress";

    default:
      return status;
  }
}
