import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { updateUser } from "../redux/slices/authSlice";
import { API_URL } from "../apiConfig";

const inputClass = "block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
interface AdminProfileData { id?: string; name: string; email: string; role: "admin"; institution?: string; phone?: string; city?: string; bio?: string; }
interface ProfileForm { name: string; phone: string; city: string; bio: string; }
const makeForm = (profile: AdminProfileData): ProfileForm => ({ name: profile.name || "", phone: profile.phone || "", city: profile.city || "", bio: profile.bio || "" });
const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "EF";

export default function AdminProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [form, setForm] = useState<ProfileForm>({ name: "", phone: "", city: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(API_URL + "/profile/me", { credentials: "include", headers: { Accept: "application/json" } });
        const data = await response.json();
        if (response.status === 401) { navigate("/", { replace: true }); return; }
        if (!response.ok) throw new Error(data.message || "Could not load your profile.");
        const loaded = data.user as AdminProfileData;
        if (loaded.role !== "admin") { navigate("/", { replace: true }); return; }
        setProfile(loaded); setForm(makeForm(loaded));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load your profile.");
      } finally { setLoading(false); }
    };
    void loadProfile();
  }, [navigate]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) { setError("Name cannot be empty."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch(API_URL + "/profile/me", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), bio: form.bio.trim() }),
      });
      const data = await response.json();
      if (response.status === 401) { navigate("/", { replace: true }); return; }
      if (!response.ok) throw new Error(data.message || "Could not save your profile.");
      const saved = data.user as AdminProfileData;
      setProfile(saved); setForm(makeForm(saved));
      dispatch(updateUser({ name: saved.name, phone: saved.phone, city: saved.city, bio: saved.bio }));
      setSuccess("Your profile has been saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Loading your profile…</div>;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl"><div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"><button type="button" onClick={() => navigate("/admin")} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" /> Back to requests</button><div className="flex items-center gap-2 text-sm font-extrabold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 text-white"><ShieldCheck className="h-5 w-5" /></span><span className="hidden sm:inline">ExamForge Admin</span></div></div></header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <div role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
        {success && <div role="status" className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{success}</div>}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 px-6 py-7 text-white sm:px-9"><div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-extrabold">{initials(profile?.name || currentUser?.name || "ExamForge")}</div><div><p className="text-sm font-bold text-indigo-100">Administrator profile</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Your account</h1><p className="mt-1 text-sm text-indigo-100">Manage the profile details shown across ExamForge.</p></div></div></div>
          <form onSubmit={handleSave} className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_260px]"><div className="space-y-5">
            <Field label="Full name"><input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></Field>
            <Field label="Email address"><input value={profile?.email || currentUser?.email || ""} disabled className={inputClass + " cursor-not-allowed bg-slate-50 text-slate-500"} /><span className="mt-1 block text-xs text-slate-400">Email changes require verification.</span></Field>
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Phone"><input maxLength={20} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} /></Field><Field label="City"><input maxLength={100} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={inputClass} /></Field></div>
            <Field label="About"><textarea maxLength={500} rows={4} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className={inputClass + " resize-y"} placeholder="Add a short introduction" /></Field>
            <button type="submit" disabled={saving || !profile} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving…" : "Save profile"}</button>
          </div><aside className="h-fit rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Account details</p><p className="mt-4 text-sm font-bold text-slate-500">Role</p><p className="mt-1 font-extrabold capitalize text-slate-800">{profile?.role || "admin"}</p><p className="mt-4 text-sm font-bold text-slate-500">Institution</p><p className="mt-1 font-extrabold text-slate-800">{profile?.institution || "ExamForge Academy"}</p><p className="mt-4 text-sm leading-6 text-slate-600">Profile updates are saved to your ExamForge account in MongoDB.</p></aside></form>
        </section>
      </main>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<span className="mt-2 block">{children}</span></label>;
}
