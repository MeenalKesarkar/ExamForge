import { LogOut } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface LogoutConfirmationProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onConfirm: () => void;
}

export default function LogoutConfirmation({
  open, setOpen, onConfirm,
}: LogoutConfirmationProps) {
  if (!open) return null;
  return (
    <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
              onClick={() =>
                setOpen(false)
              }
              role="presentation"
            >
              <div
                className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl"
                onClick={(event) =>
                  event.stopPropagation()
                }
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-title"
              >
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-7 text-white">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
                  <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/5" />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
                      <LogOut className="h-6 w-6" />
                    </div>
                    <div>
                      <h2
                        id="logout-title"
                        className="text-xl font-bold"
                      >
                        Ready to leave?
                      </h2>
                      <p className="mt-1 text-sm text-indigo-100">
                        You are about
                        to sign out of
                        ExamForge.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-6">
                  <p className="text-center text-sm leading-6 text-slate-500">
                    Are you sure you
                    want to logout?
                    You will need to
                    sign in again to
                    access your exams
                    and dashboard.
                  </p>
                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setOpen(false)
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                    >
                      Stay Logged In
                    </button>
                    <button
                      type="button"
                      onClick={
                        onConfirm
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition-all hover:from-red-600 hover:to-rose-700 hover:shadow-xl active:scale-[0.98]"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
  );
}
