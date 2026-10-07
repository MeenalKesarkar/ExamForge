import React from "react";
import { CheckCircle2 } from "lucide-react";

// ForgotPasswordProgress component
export default function ForgotPasswordProgress({ step }: { step: "email" | "otp" | "password" | "success" }) {
  return (
            <div className="my-7 flex items-center gap-2">

              {[
                "email",
                "otp",
                "password",
              ].map(
                (
                  item,
                  index
                ) => {

                  const active =
                    item === step;

                  const completed =
                    (
                      step === "otp" &&
                      index === 0
                    ) ||
                    (
                      step === "password" &&
                      index < 2
                    );

                  return (
                    <React.Fragment
                      key={item}
                    >

                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          active ||
                          completed
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2
                            size={16}
                          />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {index < 2 && (
                        <div
                          className={`h-1 flex-1 rounded-full ${
                            completed
                              ? "bg-indigo-600"
                              : "bg-slate-100"
                          }`}
                        />
                      )}

                    </React.Fragment>
                  );
                }
              )}

            </div>
  );
}
