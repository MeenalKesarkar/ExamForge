import { Clock3 } from "lucide-react";
import { ExamLoadErrorScreen, ExamLoadingScreen, ExamResultScreen, ExamSubmittedScreen } from "../components/ExamStateScreens";
import ExamQuestionPanel from "../components/ExamQuestionPanel";
import ExamSidebar from "../components/ExamSidebar";
import { formatTime } from "../formatTime";
import { useExamAttempt } from "../hooks/useExamAttempt";
// ExamPage component
function ExamPage() {
    const { loading, submitting, error, attempt, exam, questions, answers, currentIndex, setCurrentIndex, remainingSeconds, timerPaused, resumeTimer, result, submittedStatus, focusWarning, proctoringDisqualified, flaggedQuestions, savingQuestionId, currentQuestion, currentAnswers, answeredCount, unansweredCount, flaggedCount, tabSwitchCount, progress, isLowTime, isCriticalTime, handleAnswerChange, toggleFlag, submitExam, returnToDashboard } = useExamAttempt();
    if (loading)
        return <ExamLoadingScreen />;
    if (submittedStatus && result)
        return <ExamResultScreen submittedStatus={submittedStatus} result={result} exam={exam} onBack={returnToDashboard}/>;
    if (submittedStatus)
        return <ExamSubmittedScreen submittedStatus={submittedStatus} proctoringDisqualified={proctoringDisqualified} onBack={returnToDashboard}/>;
    if (!attempt || !exam || !currentQuestion)
        return <ExamLoadErrorScreen error={error} onBack={returnToDashboard}/>;
    if (timerPaused)
        return (<div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Clock3 className="h-7 w-7"/></div>
        <h1 className="mt-5 text-2xl font-extrabold">Exam paused</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your progress is saved. Resume the exam when you are ready; the timer will continue from where it paused.</p>
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button type="button" onClick={() => void resumeTimer()} className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-md transition hover:bg-indigo-700">Resume Exam</button>
      </section>
    </div>);
    return (<div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">ExamForge</p><h1 className="truncate text-base font-bold sm:text-lg">{exam.title}</h1><p className="hidden text-xs text-slate-500 sm:block">{exam.subject || "Online Assessment"}</p></div>
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 ${isCriticalTime ? "border-rose-200 bg-rose-50 text-rose-700" : isLowTime ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-800"}`}><Clock3 className="h-5 w-5"/><div><p className="hidden text-[10px] uppercase tracking-wider opacity-50 sm:block">Time Remaining</p><p className="font-mono text-lg font-bold">{formatTime(remainingSeconds)}</p></div></div>
        </div>
        <div className="h-1 bg-slate-200"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }}/></div>
      </header>
      {error && <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"><div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span></div></div>}
      {focusWarning && <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"><div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="alert">{focusWarning}</div></div>}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8"><div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <ExamQuestionPanel question={currentQuestion} index={currentIndex} total={questions.length} selectedAnswers={currentAnswers} flagged={flaggedQuestions.has(currentQuestion._id)} saving={savingQuestionId === currentQuestion._id} submitting={submitting} onAnswer={handleAnswerChange} onFlag={toggleFlag} onPrevious={() => setCurrentIndex((index) => Math.max(0, index - 1))} onNext={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} onSubmit={() => void submitExam(false)}/>
        <ExamSidebar exam={exam} questions={questions} answers={answers} flaggedQuestions={flaggedQuestions} currentIndex={currentIndex} progress={progress} answeredCount={answeredCount} unansweredCount={unansweredCount} flaggedCount={flaggedCount} tabSwitchCount={tabSwitchCount} submitting={submitting} onSelectQuestion={setCurrentIndex} onSubmit={() => void submitExam(false)}/>
      </div></main>
    </div>);
}
export default ExamPage;
