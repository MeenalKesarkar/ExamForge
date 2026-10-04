import { Sparkles } from "lucide-react";

export default function LoginMobileBrand() {
  return (
    <div className="mb-8 flex items-center justify-center lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f39ff] to-[#a20cff] shadow-lg shadow-purple-500/25">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111936]">ExamForge</h1>
          <p className="text-xs text-slate-500">Online Exam Platform</p>
        </div>
      </div>
    </div>
  );
}
