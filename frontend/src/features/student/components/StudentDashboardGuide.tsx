import { CircleCheck, Timer } from "lucide-react";

export default function StudentDashboardGuide({
  loading,
  examCount,
}: {
  loading: boolean;
  examCount: number;
}) {
  if (loading || examCount === 0) return null;
  return (
    <section
                  id="exam-guide"
                  className="mt-10 grid gap-5 md:grid-cols-2"
                >
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                        <Timer className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-indigo-950">
                          Keep an eye
                          on the timer
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-indigo-800/70">
                          Your exam time
                          is controlled
                          by the server.
                          Make sure you
                          submit your
                          answers before
                          the time
                          expires.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
                        <CircleCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-950">
                          Your answers
                          are saved
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-emerald-800/70">
                          Answers are
                          progressively
                          saved while
                          you take an
                          exam, so you
                          can safely
                          continue if you
                          refresh the
                          page.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
  );
}
