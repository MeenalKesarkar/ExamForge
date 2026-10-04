import { Clock3 } from "lucide-react";
import {
  ExamLoadErrorScreen,
  ExamLoadingScreen,
  ExamResultScreen,
  ExamSubmittedScreen,
} from "../features/exam/components/ExamStateScreens";
import ExamQuestionPanel from "../features/exam/components/ExamQuestionPanel";
import ExamSidebar from "../features/exam/components/ExamSidebar";
import { formatTime } from "../features/exam/formatTime";
import { useExamAttempt } from "../features/exam/hooks/useExamAttempt";

/* =========================================================
   COMPONENT
========================================================= */

function ExamPage() {
  const {
    loading,
    submitting,
    error,
    attempt,
    exam,
    questions,
    answers,
    currentIndex,
    setCurrentIndex,
    remainingSeconds,
    result,
    submittedStatus,
    flaggedQuestions,
    savingQuestionId,
    currentQuestion,
    currentAnswers,
    answeredCount,
    unansweredCount,
    flaggedCount,
    progress,
    isLowTime,
    isCriticalTime,
    handleAnswerChange,
    toggleFlag,
    submitExam,
    returnToDashboard,
  } = useExamAttempt();

  /* =======================================================
     STATE SCREENS
  ======================================================= */

  if (loading) {
    return <ExamLoadingScreen />;
  }

  if (submittedStatus) {
    return (
      <ExamSubmittedScreen
        submittedStatus={submittedStatus}
        onBack={returnToDashboard}
      />
    );
  }

  if (submittedStatus && result) {
    return (
      <ExamResultScreen
        submittedStatus={submittedStatus}
        result={result}
        exam={exam}
        onBack={returnToDashboard}
      />
    );
  }

  if (!attempt || !exam || !currentQuestion) {
    return (
      <ExamLoadErrorScreen
        error={error}
        onBack={returnToDashboard}
      />
    );
  }

  /* =======================================================
     MAIN EXAM UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">ExamForge</p>
            <h1 className="truncate text-base font-bold sm:text-lg">{exam.title}</h1>
            <p className="hidden text-xs text-slate-500 sm:block">{exam.subject || "Online Assessment"}</p>
          </div>
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 ${
            isCriticalTime
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : isLowTime
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-800"
          }`}>
            <Clock3 className="h-5 w-5" />
            <div>
              <p className="hidden text-[10px] uppercase tracking-wider opacity-50 sm:block">Time Remaining</p>
              <p className="font-mono text-lg font-bold">{formatTime(remainingSeconds)}</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-slate-200">
          <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{error}</span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <ExamQuestionPanel
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            selectedAnswers={currentAnswers}
            flagged={flaggedQuestions.has(currentQuestion._id)}
            saving={savingQuestionId === currentQuestion._id}
            submitting={submitting}
            onAnswer={handleAnswerChange}
            onFlag={toggleFlag}
            onPrevious={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            onNext={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
            onSubmit={() => void submitExam(false)}
          />

          <ExamSidebar
            exam={exam}
            questions={questions}
            answers={answers}
            flaggedQuestions={flaggedQuestions}
            currentIndex={currentIndex}
            progress={progress}
            answeredCount={answeredCount}
            unansweredCount={unansweredCount}
            flaggedCount={flaggedCount}
            submitting={submitting}
            onSelectQuestion={setCurrentIndex}
            onSubmit={() => void submitExam(false)}
          />
        </div>
      </main>
    </div>
  );

}

export default ExamPage;
