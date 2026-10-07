import React, {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  refreshSession,
} from "../services/authService";

import {
  useAppDispatch,
  useAppSelector,
} from "../redux/hooks";

import {
  login,
} from "../redux/slices/authSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;

  role?:
    | "student"
    | "instructor";
}

// ProtectedRoute component
function ProtectedRoute({
  children,
  role,
}: ProtectedRouteProps) {
  const dispatch =
    useAppDispatch();

  const location =
    useLocation();

  const {
    user,
    isAuthenticated,
  } =
    useAppSelector(
      (state) =>
        state.auth
    );

  const [
    checking,
    setChecking,
  ] = useState(
    !isAuthenticated
  );

  useEffect(() => {
    if (isAuthenticated) {
      setChecking(false);
      return;
    }

    let active = true;

    const restore =
      async () => {
        try {
          const result =
            await refreshSession();

          if (active) {
            dispatch(
              login({
                user:
                  result.user,
              })
            );
          }
        } catch {
          // No active session
        } finally {
          if (active) {
            setChecking(false);
          }
        }
      };

    void restore();

    return () => {
      active = false;
    };
  }, [
    dispatch,
    isAuthenticated,
  ]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-indigo-500" />

          <p className="mt-4 text-sm text-white/50">
            Restoring your secure session...
          </p>

        </div>

      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  if (
    role &&
    user.role !== role
  ) {
    return (
      <Navigate
        to={
          user.role ===
          "student"
            ? "/student"
            : "/instructor"
        }
        replace
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;