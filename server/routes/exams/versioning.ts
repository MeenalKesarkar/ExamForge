import type { IExam } from "../../models/Exam";
import Attempt from "../../models/Attempt";
import type { IAttempt } from "../../models/Attempt";
import Question, { type IQuestion } from "../../models/Question";

export async function freezeActiveExamAttempts(exam: IExam): Promise<void> {
  const activeAttempts = await Attempt.find({
    examId: exam._id,
    status: "IN_PROGRESS",
    archived: { $ne: true },
    $or: [
      { questionSnapshots: { $exists: false } },
      { questionSnapshots: { $size: 0 } },
      { examSnapshot: { $exists: false } },
    ],
  });

  for (const attempt of activeAttempts) {
    if (!attempt.questionSnapshots?.length) {
      const questions = await Question.find({ _id: { $in: attempt.questionIds } }).lean() as unknown as IQuestion[];
      const questionsById = new Map<string, IQuestion>(questions.map((question) => [question._id.toString(), question]));
      const snapshots: Array<IQuestion | undefined> = attempt.questionIds.map((id: IAttempt["questionIds"][number]) => questionsById.get(id.toString()));
      if (snapshots.some((question) => !question)) continue;

      attempt.questionSnapshots = snapshots.map((question) => ({
        _id: question!._id,
        questionText: question!.questionText,
        type: question!.type,
        options: [...question!.options],
        correctAnswers: [...question!.correctAnswers],
        marks: question!.marks,
        difficulty: question!.difficulty,
        order: question!.order,
        explanation: question!.explanation,
      }));
    }

    attempt.examSnapshot = attempt.examSnapshot || makeAttemptExamSnapshot(exam);
    attempt.examVersion = Math.max(1, Number(attempt.examVersion || 1));
    await attempt.save();
  }
}

const COMPLETED_STATUSES = ["SUBMITTED", "EVALUATED", "TIMED_OUT"];

export async function advancePublishedExamVersion(exam: IExam): Promise<void> {
  exam.version = Math.max(1, Number(exam.version || 1)) + 1;
  await exam.save();

  await Attempt.updateMany(
    {
      examId: exam._id,
      archived: { $ne: true },
      status: { $in: COMPLETED_STATUSES },
      $or: [
        { examVersion: { $lt: exam.version } },
        { examVersion: { $exists: false } },
      ],
    },
    {
      $set: {
        archived: true,
        archivedAt: new Date(),
        archiveReason: `Exam updated to version ${exam.version}; a new attempt is available.`,
      },
    },
  );
}

export function getExamVersionSignature(exam: IExam): string {
  return JSON.stringify({
    title: exam.title,
    subject: exam.subject,
    degree: exam.degree,
    yearOfStudy: exam.yearOfStudy,
    semester: exam.semester,
    duration: exam.duration,
    questionCount: exam.questionCount,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    negativeMarking: exam.negativeMarking,
    negativePenalty: exam.negativePenalty,
    instructions: exam.instructions,
    shuffleQuestions: exam.shuffleQuestions,
    shuffleOptions: exam.shuffleOptions,
    published: exam.published,
  });
}

export function makeAttemptExamSnapshot(exam: IExam) {
  return {
    version: Math.max(1, Number(exam.version || 1)),
    title: exam.title,
    subject: exam.subject || "",
    degree: exam.degree || "",
    yearOfStudy: exam.yearOfStudy,
    semester: exam.semester,
    duration: exam.duration,
    questionCount: exam.questionCount,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    negativeMarking: exam.negativeMarking,
    negativePenalty: exam.negativePenalty,
    endDate: exam.endDate,
    instructions: [...(exam.instructions || [])],
  };
}

export function isAttemptOutdated(attemptVersion: number | undefined, examVersion: number): boolean {
  return Number(attemptVersion || 1) < Math.max(1, Number(examVersion || 1));
}

export async function archiveCompletedOutdatedAttempt(
  attempt: { status: string; examVersion?: number; archived?: boolean; archivedAt?: Date; archiveReason?: string; save: () => Promise<unknown> },
  currentExamVersion: number,
): Promise<void> {
  if (attempt.archived || attempt.status === "IN_PROGRESS" || !isAttemptOutdated(attempt.examVersion, currentExamVersion)) return;
  attempt.archived = true;
  attempt.archivedAt = new Date();
  attempt.archiveReason = `Attempt belongs to exam version ${attempt.examVersion || 1}; current version is ${currentExamVersion}.`;
  await attempt.save();
}
