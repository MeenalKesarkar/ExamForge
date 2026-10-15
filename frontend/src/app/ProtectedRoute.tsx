import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { login, logout, type UserRole } from "../redux/slices/authSlice";
import { logoutUser, refreshSession } from "../services/authService";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: UserRole;
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, sessionExpiresAt } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [restoring, setRestoring] = useState(!isAuthenticated);
  const [restoreError, setRestoreError] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      return;
    }

    let active = true;
    void refreshSession()
      .then((session) => {
        if (active) {
          dispatch(login({ user: session.user, sessionExpiresAt: session.sessionExpiresAt }));
        }
      })
      .catch((error: Error & { status?: number }) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          dispatch(logout());
        } else {
          setRestoreError("ExamForge could not verify your saved session. Check your connection and try again; your session has not been cleared.");
        }
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => { active = false; };
  }, [dispatch, isAuthenticated, user, restoreAttempt]);

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;
    // Browser timers are limited to a signed 32-bit delay (~24.8 days).
    // A 30-day Remember Me session must be checked and rescheduled in chunks;
    // passing the full duration to setTimeout can make it fire immediately.
    const maxTimerDelay = 2_147_000_000;
    let timer: number | undefined;

    const checkSessionExpiry = () => {
      const remaining = sessionExpiresAt - Date.now();
      if (remaining <= 0) {
        dispatch(logout());
        void logoutUser();
        return;
      }

      timer = window.setTimeout(
        checkSessionExpiry,
        Math.min(remaining, maxTimerDelay)
      );
    };

    checkSessionExpiry();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [dispatch, isAuthenticated, sessionExpiresAt]);

  if (!isAuthenticated && restoring) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm text-slate-500">Restoring your secure session...</p></div>;
  }

  if (!isAuthenticated && restoreError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-extrabold text-slate-900">Session check paused</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{restoreError}</p>
          <button type="button" onClick={() => { setRestoreError(""); setRestoring(true); setRestoreAttempt((count) => count + 1); }} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">Try again</button>
        </section>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== allowedRole) {
    const homeByRole: Record<UserRole, string> = {
      student: "/student",
      instructor: "/instructor",
      admin: "/admin",
    };
    return <Navigate to={homeByRole[user.role]} replace />;
  }

  if (user.accountStatus !== "approved") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
