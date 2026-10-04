import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import LoginForm from "./LoginForm";
import LoginMobileBrand from "./LoginMobileBrand";
import LoginWelcome from "./LoginWelcome";

interface LoginPanelProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export default function LoginPanel({ email, setEmail, password, setPassword, rememberMe, setRememberMe, showPassword, setShowPassword, loading, error, onSubmit, onForgotPassword, onRegister }: LoginPanelProps) {
  return (
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
          
                        <LoginMobileBrand />
          
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
          
                            <LoginWelcome error={error} />
          
                            {/* =================================================
                                FORM
                                ================================================= */}
          
                            <LoginForm
                              email={email}
                              setEmail={setEmail}
                              password={password}
                              setPassword={setPassword}
                              rememberMe={rememberMe}
                              setRememberMe={setRememberMe}
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                              loading={loading}
                              onSubmit={onSubmit}
                              onForgotPassword={onForgotPassword}
                            />
          
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
                                      onRegister()
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
                                c 2026 ExamForge
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
  );
}
