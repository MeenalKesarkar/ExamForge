import { CheckCircle2, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export default function LoginBrandPanel() {
  return (
          <section
                      className="
                        relative
                        hidden
                        min-h-screen
                        w-full
                        overflow-hidden
                        bg-gradient-to-br
                        from-[#2b174a]
                        via-[#532d87]
                        to-[#8e5cdb]
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
                          c 2026 ExamForge
                          <span className="mx-2">
                            
                          </span>
                          Built for academic excellence.
                        </div>
          
                      </div>
          
                    </section>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 backdrop-blur-md transition hover:bg-white/15">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-white/55">{description}</p>
      </div>
    </div>
  );
}
