import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";

interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
}

export default function LoginForm({ email, setEmail, password, setPassword, rememberMe, setRememberMe, showPassword, setShowPassword, loading, onSubmit, onForgotPassword }: LoginFormProps) {
  return (
                      <form
                        onSubmit={
                          onSubmit
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
                                onForgotPassword
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
  );
}
