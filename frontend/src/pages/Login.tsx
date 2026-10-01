import { useState } from "react";
import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../redux/hooks";
import { login } from "../redux/slices/authSlice";

import {
  loginUser,
} from "../services/authService";

// ======================================================
// LOGIN PAGE
// ======================================================

export default function Login() {
  const navigate =
    useNavigate();

  const dispatch =
    useAppDispatch();

  // ====================================================
  // FORM STATE
  // ====================================================

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // LOGIN
  // ====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // --------------------------------------------------
    // Required field validation
    // --------------------------------------------------

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Email and password are required."
      );

      return;
    }

    // --------------------------------------------------
    // Email validation
    // --------------------------------------------------

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        normalizedEmail
      )
    ) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    try {
      setLoading(true);

      // ------------------------------------------------
      // BACKEND LOGIN
      // ------------------------------------------------

      const result =
        await loginUser({
          email:
            normalizedEmail,

          password,

          rememberMe,
        });

      // ------------------------------------------------
      // STORE USER IN REDUX
      // ------------------------------------------------
      //
      // We intentionally don't import your hooks.ts
      // or authSlice.ts here because those paths are
      // currently causing the TypeScript errors shown
      // in your screenshot.
      //
      // Your auth reducer already listens to:
      //
      // auth/login
      //
      // ------------------------------------------------

      dispatch(
        login({
          user: result.user,
        })
      );

      // ------------------------------------------------
      // REDIRECT BASED ON ROLE
      // ------------------------------------------------

      if (
        result.user.role ===
        "student"
      ) {
        navigate(
          "/student",
          {
            replace: true,
          }
        );
      } else if (
        result.user.role ===
        "instructor"
      ) {
        navigate(
          "/instructor",
          {
            replace: true,
          }
        );
      } else {
        setError(
          "Your account has an invalid role."
        );
      }
    } catch (err) {
      // ------------------------------------------------
      // ERROR HANDLING
      // ------------------------------------------------

      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";

      setError(
        message
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // FORGOT PASSWORD
  // ====================================================

  const handleForgotPassword =
    () => {
      navigate(
        "/forgot-password"
      );
    };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[#05091f]
      "
    >

      <div
        className="
          min-h-screen
          w-full
        "
      >

        <div
          className="
            mx-auto
            flex
            min-h-screen
            w-full
            max-w-[1600px]
            flex-col
            lg:flex-row
          "
        >

          {/* =================================================
              LEFT BRAND PANEL
              ================================================= */}

          <section
            className="
              relative
              hidden
              min-h-screen
              w-full
              overflow-hidden
              bg-gradient-to-br
              from-[#15104f]
              via-[#24117c]
              to-[#6d16df]
              lg:flex
              lg:w-[46%]
              xl:w-[48%]
            "
          >

            {/* Background glow */}

            <div
              className="
                absolute
                -left-32
                -top-32
                h-96
                w-96
                rounded-full
                bg-purple-500/20
                blur-3xl
              "
            />

            <div
              className="
                absolute
                -bottom-40
                -right-40
                h-[500px]
                w-[500px]
                rounded-full
                bg-fuchsia-500/20
                blur-3xl
              "
            />

            {/* Decorative circles */}

            <div
              className="
                absolute
                right-10
                top-24
                h-24
                w-24
                rounded-full
                border
                border-white/10
              "
            />

            <div
              className="
                absolute
                bottom-32
                left-12
                h-16
                w-16
                rounded-full
                border
                border-white/10
              "
            />

            {/* Left content */}

            <div
              className="
                relative
                z-10
                flex
                min-h-screen
                w-full
                flex-col
                justify-between
                px-8
                py-10
                sm:px-10
                lg:px-10
                xl:px-14
                2xl:px-16
              "
            >

              {/* =================================================
                  BRAND
                  ================================================= */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-white/15
                    ring-1
                    ring-white/20
                    backdrop-blur-sm
                  "
                >
                  <Sparkles
                    className="
                      h-6
                      w-6
                      text-white
                    "
                  />
                </div>

                <div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <h1
                      className="
                        text-xl
                        font-bold
                        tracking-tight
                        text-white
                      "
                    >
                      ExamForge
                    </h1>

                    <span
                      className="
                        rounded-full
                        bg-white/15
                        px-2
                        py-0.5
                        text-[10px]
                        font-semibold
                        text-white/90
                        ring-1
                        ring-white/15
                      "
                    >
                      V1.0
                    </span>

                  </div>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-white/60
                    "
                  >
                    Academic Assessment Platform
                  </p>

                </div>

              </div>

              {/* =================================================
                  HERO
                  ================================================= */}

              <div
                className="
                  max-w-xl
                  py-12
                "
              >

                <div
                  className="
                    mb-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-white/90
                    backdrop-blur-sm
                  "
                >

                  <GraduationCap
                    className="
                      h-4
                      w-4
                    "
                  />

                  BCA Student Assessment

                </div>

                <h2
                  className="
                    text-4xl
                    font-extrabold
                    leading-[1.08]
                    tracking-tight
                    text-white
                    xl:text-5xl
                    2xl:text-6xl
                  "
                >
                  Test.
                  <br />

                  <span
                    className="
                      bg-gradient-to-r
                      from-white
                      via-purple-100
                      to-fuchsia-200
                      bg-clip-text
                      text-transparent
                    "
                  >
                    Learn.
                  </span>

                  <br />

                  Achieve.
                </h2>

                <p
                  className="
                    mt-6
                    max-w-lg
                    text-sm
                    leading-7
                    text-white/65
                    xl:text-base
                  "
                >
                  A focused assessment platform
                  designed for BCA students to
                  practice, evaluate their knowledge,
                  and track their academic progress.
                </p>

                {/* =================================================
                    FEATURE CARDS
                    ================================================= */}

                <div
                  className="
                    mt-9
                    space-y-3
                  "
                >

                  <FeatureCard
                    icon={
                      <ShieldCheck
                        className="
                          h-5
                          w-5
                        "
                      />
                    }
                    title="Secure Assessments"
                    description="Protected student and instructor portals."
                  />

                  <FeatureCard
                    icon={
                      <CheckCircle2
                        className="
                          h-5
                          w-5
                        "
                      />
                    }
                    title="Real-Time Evaluation"
                    description="Instant scoring and detailed results."
                  />

                  <FeatureCard
                    icon={
                      <GraduationCap
                        className="
                          h-5
                          w-5
                        "
                      />
                    }
                    title="Dedicated Role Portals"
                    description="Personalized experiences for students and instructors."
                  />

                </div>

              </div>

              {/* =================================================
                  LEFT FOOTER
                  ================================================= */}

              <div
                className="
                  text-xs
                  text-white/40
                "
              >
                © 2026 ExamForge
                <span className="mx-2">
                  •
                </span>
                Built for academic excellence.
              </div>

            </div>

          </section>

          {/* =================================================
              RIGHT LOGIN PANEL
              ================================================= */}

          <section
            className="
              flex
              min-h-screen
              w-full
              items-center
              justify-center
              bg-white
              px-4
              py-8
              sm:px-6
              sm:py-10
              md:px-8
              lg:w-[54%]
              lg:px-10
              xl:w-[52%]
              xl:px-14
            "
          >

            <div
              className="
                w-full
                max-w-[520px]
              "
            >

              {/* =================================================
                  MOBILE BRAND
                  ================================================= */}

              <div
                className="
                  mb-8
                  flex
                  items-center
                  justify-center
                  lg:hidden
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gradient-to-br
                      from-[#4f39ff]
                      to-[#a20cff]
                      shadow-lg
                      shadow-purple-500/25
                    "
                  >
                    <Sparkles
                      className="
                        h-6
                        w-6
                        text-white
                      "
                    />
                  </div>

                  <div>

                    <h1
                      className="
                        text-xl
                        font-bold
                        tracking-tight
                        text-[#111936]
                      "
                    >
                      ExamForge
                    </h1>

                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Online Exam Platform
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  LOGIN CARD
                  ================================================= */}

              <div
                className="
                  overflow-hidden
                  rounded-[24px]
                  border
                  border-slate-200
                  bg-white
                  shadow-[0_20px_70px_rgba(17,25,54,0.10)]
                "
              >

                {/* Top gradient */}

                <div
                  className="
                    h-1.5
                    w-full
                    bg-gradient-to-r
                    from-[#4f39ff]
                    via-[#6937ff]
                    to-[#b10cff]
                  "
                />

                <div
                  className="
                    p-5
                    sm:p-7
                    md:p-9
                    lg:p-10
                  "
                >

                  {/* =================================================
                      PORTAL LABEL
                      ================================================= */}

                  <div
                    className="
                      mb-6
                      inline-flex
                      max-w-full
                      items-center
                      gap-2
                      rounded-xl
                      bg-[#f0efff]
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      text-[#4f39ff]
                    "
                  >

                    <GraduationCap
                      className="
                        h-4
                        w-4
                        shrink-0
                      "
                    />

                    <span>
                      BCA Assessment Portal
                    </span>

                  </div>

                  {/* =================================================
                      HEADING
                      ================================================= */}

                  <div>

                    <h2
                      className="
                        text-3xl
                        font-extrabold
                        tracking-tight
                        text-[#111936]
                        sm:text-[34px]
                      "
                    >
                      Welcome back{" "}
                      <span>
                        👋
                      </span>
                    </h2>

                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-slate-500
                        sm:text-base
                      "
                    >
                      Sign in to access your
                      academic assessment
                      dashboard.
                    </p>

                  </div>

                  {/* =================================================
                      ERROR
                      ================================================= */}

                  {error && (
                    <div
                      className="
                        mt-6
                        flex
                        items-start
                        gap-3
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-3.5
                        text-sm
                        text-red-700
                      "
                      role="alert"
                    >

                      <AlertCircle
                        className="
                          mt-0.5
                          h-5
                          w-5
                          shrink-0
                          text-red-600
                        "
                      />

                      <span
                        className="
                          min-w-0
                          break-words
                          leading-5
                        "
                      >
                        {error}
                      </span>

                    </div>
                  )}

                  {/* =================================================
                      FORM
                      ================================================= */}

                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="
                      mt-7
                      space-y-5
                    "
                  >

                    {/* =================================================
                        EMAIL
                        ================================================= */}

                    <div>

                      <label
                        htmlFor="email"
                        className="
                          mb-2
                          block
                          text-sm
                          font-semibold
                          text-slate-700
                        "
                      >
                        Email address
                      </label>

                      <div
                        className="
                          relative
                        "
                      >

                        <Mail
                          className="
                            pointer-events-none
                            absolute
                            left-4
                            top-1/2
                            h-5
                            w-5
                            -translate-y-1/2
                            text-slate-400
                          "
                        />

                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(
                            event
                          ) =>
                            setEmail(
                              event.target.value
                            )
                          }
                          placeholder="you@example.com"
                          disabled={
                            loading
                          }
                          className="
                            h-14
                            w-full
                            min-w-0
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-50
                            pl-12
                            pr-4
                            text-sm
                            text-slate-900
                            outline-none
                            transition
                            placeholder:text-slate-400
                            focus:border-[#6347ff]
                            focus:bg-white
                            focus:ring-4
                            focus:ring-[#6347ff]/10
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        />

                      </div>

                    </div>

                    {/* =================================================
                        PASSWORD
                        ================================================= */}

                    <div>

                      <div
                        className="
                          mb-2
                          flex
                          flex-wrap
                          items-center
                          justify-between
                          gap-2
                        "
                      >

                        <label
                          htmlFor="password"
                          className="
                            text-sm
                            font-semibold
                            text-slate-700
                          "
                        >
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={
                            handleForgotPassword
                          }
                          className="
                            shrink-0
                            text-sm
                            font-semibold
                            text-[#5138ff]
                            transition
                            hover:text-[#8b16f5]
                            hover:underline
                          "
                        >
                          Forgot password?
                        </button>

                      </div>

                      <div
                        className="
                          relative
                        "
                      >

                        <Lock
                          className="
                            pointer-events-none
                            absolute
                            left-4
                            top-1/2
                            h-5
                            w-5
                            -translate-y-1/2
                            text-slate-400
                          "
                        />

                        <input
                          id="password"
                          name="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="current-password"
                          value={password}
                          onChange={(
                            event
                          ) =>
                            setPassword(
                              event.target.value
                            )
                          }
                          placeholder="Enter your password"
                          disabled={
                            loading
                          }
                          className="
                            h-14
                            w-full
                            min-w-0
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-50
                            pl-12
                            pr-12
                            text-sm
                            text-slate-900
                            outline-none
                            transition
                            placeholder:text-slate-400
                            focus:border-[#6347ff]
                            focus:bg-white
                            focus:ring-4
                            focus:ring-[#6347ff]/10
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (
                                current
                              ) =>
                                !current
                            )
                          }
                          disabled={
                            loading
                          }
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="
                            absolute
                            right-2
                            top-1/2
                            flex
                            h-10
                            w-10
                            -translate-y-1/2
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-600
                          "
                        >

                          {showPassword ? (
                            <EyeOff
                              className="
                                h-5
                                w-5
                              "
                            />
                          ) : (
                            <Eye
                              className="
                                h-5
                                w-5
                              "
                            />
                          )}

                        </button>

                      </div>

                    </div>

                    {/* =================================================
                        REMEMBER ME
                        ================================================= */}

                    <label
                      className="
                        flex
                        cursor-pointer
                        items-center
                        gap-3
                        select-none
                      "
                    >

                      <input
                        type="checkbox"
                        checked={
                          rememberMe
                        }
                        onChange={(
                          event
                        ) =>
                          setRememberMe(
                            event.target.checked
                          )
                        }
                        disabled={
                          loading
                        }
                        className="
                          h-5
                          w-5
                          shrink-0
                          cursor-pointer
                          rounded
                          border-slate-300
                          accent-[#5b3df5]
                        "
                      />

                      <span
                        className="
                          text-sm
                          font-medium
                          text-slate-600
                        "
                      >
                        Remember me
                      </span>

                    </label>

                    {/* =================================================
                        LOGIN BUTTON
                        ================================================= */}

                    <button
                      type="submit"
                      disabled={
                        loading
                      }
                      className="
                        group
                        flex
                        h-14
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-gradient-to-r
                        from-[#4c39f5]
                        via-[#6534f7]
                        to-[#a20cff]
                        px-5
                        text-sm
                        font-bold
                        text-white
                        shadow-lg
                        shadow-purple-500/20
                        transition
                        duration-200
                        hover:-translate-y-0.5
                        hover:shadow-xl
                        hover:shadow-purple-500/25
                        focus:outline-none
                        focus:ring-4
                        focus:ring-purple-500/20
                        disabled:cursor-not-allowed
                        disabled:opacity-70
                        disabled:hover:translate-y-0
                      "
                    >

                      {loading ? (
                        <>
                          <span
                            className="
                              h-5
                              w-5
                              animate-spin
                              rounded-full
                              border-2
                              border-white/30
                              border-t-white
                            "
                          />

                          Signing in...
                        </>
                      ) : (
                        <>
                          <span>
                            Continue to ExamForge
                          </span>

                          <ArrowRight
                            className="
                              h-5
                              w-5
                              shrink-0
                              transition
                              duration-200
                              group-hover:translate-x-1
                            "
                          />
                        </>
                      )}

                    </button>

                  </form>

                  {/* =================================================
                      INSTITUTIONAL ACCESS
                      ================================================= */}

                  <div
                    className="
                      mt-7
                      rounded-2xl
                      border
                      border-slate-200
                      bg-slate-50
                      p-4
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-white
                          shadow-sm
                          ring-1
                          ring-slate-200
                        "
                      >
                        <CheckCircle2
                          className="
                            h-5
                            w-5
                            text-emerald-500
                          "
                        />
                      </div>

                      <div
                        className="
                          min-w-0
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-slate-700
                          "
                        >
                          Institutional access only
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-slate-500
                          "
                        >
                          New to ExamForge? Create your
                          student or instructor account
                          to get started.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/register")
                          }
                          className="
                            mt-3
                            inline-flex
                            items-center
                            gap-2
                            text-sm
                            font-semibold
                            text-[#5138ff]
                            transition
                            hover:text-[#8b16f5]
                            hover:underline
                          "
                        >
                          Create an account
                          <ArrowRight className="h-4 w-4" />
                        </button>

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      SECURITY FOOTER
                      ================================================= */}

                  <div
                    className="
                      mt-6
                      flex
                      flex-wrap
                      items-center
                      justify-center
                      gap-x-5
                      gap-y-2
                      text-xs
                      text-slate-400
                    "
                  >

                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                      "
                    >

                      <ShieldCheck
                        className="
                          h-4
                          w-4
                          text-emerald-500
                        "
                      />

                      Secure HttpOnly session

                    </span>

                    <span
                      className="
                        hidden
                        h-1
                        w-1
                        rounded-full
                        bg-slate-300
                        sm:block
                      "
                    />

                    <span>
                      © 2026 ExamForge
                    </span>

                  </div>

                </div>

              </div>

              {/* =================================================
                  MOBILE FOOTER
                  ================================================= */}

              <p
                className="
                  mt-6
                  text-center
                  text-xs
                  leading-5
                  text-slate-400
                  lg:hidden
                "
              >
                Secure academic assessment
                platform for BCA students.
              </p>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}

// ======================================================
// FEATURE CARD
// ======================================================

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div
      className="
        flex
        items-center
        gap-4
        rounded-2xl
        border
        border-white/10
        bg-white/10
        px-4
        py-3.5
        backdrop-blur-md
        transition
        hover:bg-white/15
      "
    >

      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-white/10
          text-white
          ring-1
          ring-white/10
        "
      >
        {icon}
      </div>

      <div
        className="
          min-w-0
        "
      >

        <p
          className="
            text-sm
            font-semibold
            text-white
          "
        >
          {title}
        </p>

        <p
          className="
            mt-0.5
            text-xs
            leading-5
            text-white/55
          "
        >
          {description}
        </p>

      </div>

    </div>
  );
}