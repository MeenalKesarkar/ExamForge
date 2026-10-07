import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  useAppDispatch,
} from "../../../redux/hooks";

import {
  updateUser,
} from "../../../redux/slices/authSlice";
import { API_URL } from "../../../config/apiConfig";


interface TeachingAssignment {
  subject: string;
  degree: string;
  yearOfStudy: number;
  semesters: number[];
  classSections: string[];
}

interface InstructorUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor";
  institution?: string;
  phone?: string;
  city?: string;
  bio?: string;
  profilePicture?: string | null;
  teachingAssignments?: TeachingAssignment[];
}

interface ProfileForm {
  name: string;
  institution: string;
  phone: string;
  city: string;
  bio: string;
  profilePicture: string;
  teachingAssignments: TeachingAssignment[];
}

const emptyAssignment = (): TeachingAssignment => ({
  subject: "",
  degree: "BCA",
  yearOfStudy: 1,
  semesters: [1],
  classSections: ["A"],
});

const getYearLabel = (year: number) => {
  if (year === 1) return "1st Year";
  if (year === 2) return "2nd Year";
  return "3rd Year";
};

const getSemesterOptions = (
  year: number
): number[] => {
  if (year === 1) return [1, 2];
  if (year === 2) return [3, 4];
  return [5, 6];
};

const makeForm = (
  user: InstructorUser
): ProfileForm => ({
  name: user.name || "",
  institution: user.institution || "",
  phone: user.phone || "",
  city: user.city || "",
  bio: user.bio || "",
  profilePicture:
    user.profilePicture || "",
  teachingAssignments:
    user.teachingAssignments?.length
      ? user.teachingAssignments.map(
          (assignment) => ({
            subject:
              assignment.subject || "",
            degree:
              assignment.degree || "BCA",
            yearOfStudy:
              assignment.yearOfStudy || 1,
            semesters:
              assignment.semesters?.length
                ? [...assignment.semesters]
                : [1],
            classSections:
              assignment.classSections?.length
                ? [...assignment.classSections]
                : ["A"],
          })
        )
      : [emptyAssignment()],
});

// InstructorProfile component
function InstructorProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [user, setUser] =
    useState<InstructorUser | null>(null);

  const [form, setForm] =
    useState<ProfileForm | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/profile/me`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

        const data =
          await response.json();

        if (response.status === 401) {
          navigate("/");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load your profile."
          );
        }

        const profileUser =
          data?.user || data;

        if (
          profileUser?.role !==
          "instructor"
        ) {
          navigate("/student");
          return;
        }

        setUser(profileUser);
        setForm(makeForm(profileUser));
      } catch (err) {
        console.error(
          "Instructor profile error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [navigate]);

  const updateField = (
    field: keyof Omit<
      ProfileForm,
      "teachingAssignments"
    >,
    value: string
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  };

  const updateAssignment = (
    index: number,
    field: keyof TeachingAssignment,
    value:
      | string
      | number
      | number[]
      | string[]
  ) => {
    setForm((current) => {
      if (!current) return current;

      const assignments = [
        ...current.teachingAssignments,
      ];

      assignments[index] = {
        ...assignments[index],
        [field]: value,
      };

      return {
        ...current,
        teachingAssignments:
          assignments,
      };
    });
  };

  const changeAssignmentYear = (
    index: number,
    year: number
  ) => {
    const semesters =
      getSemesterOptions(year);

    updateAssignment(
      index,
      "yearOfStudy",
      year
    );

    updateAssignment(
      index,
      "semesters",
      [semesters[0]]
    );
  };

  const toggleSemester = (
    index: number,
    semester: number
  ) => {
    setForm((current) => {
      if (!current) return current;

      const assignments = [
        ...current.teachingAssignments,
      ];

      const currentSemesters =
        assignments[index]
          .semesters;

      const nextSemesters =
        currentSemesters.includes(
          semester
        )
          ? currentSemesters.filter(
              (item) =>
                item !== semester
            )
          : [
              ...currentSemesters,
              semester,
            ];

      assignments[index] = {
        ...assignments[index],
        semesters:
          nextSemesters.sort(
            (a, b) => a - b
          ),
      };

      return {
        ...current,
        teachingAssignments:
          assignments,
      };
    });
  };

  const setSections = (
    index: number,
    value: string
  ) => {
    const sections = value
      .split(",")
      .map((section) =>
        section.trim()
      )
      .filter(Boolean);

    updateAssignment(
      index,
      "classSections",
      sections
    );
  };

  const addAssignment = () => {
    setForm((current) =>
      current
        ? {
            ...current,
            teachingAssignments: [
              ...current.teachingAssignments,
              emptyAssignment(),
            ],
          }
        : current
    );
  };

  const removeAssignment = (
    index: number
  ) => {
    setForm((current) => {
      if (!current) return current;

      if (
        current.teachingAssignments
          .length <= 1
      ) {
        return current;
      }

      return {
        ...current,
        teachingAssignments:
          current.teachingAssignments.filter(
            (_, itemIndex) =>
              itemIndex !== index
          ),
      };
    });
  };

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 2_000_000) {
      setError(
        "Please choose an image smaller than 2 MB."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const result =
        typeof reader.result === "string"
          ? reader.result
          : "";

      setForm((current) =>
        current
          ? {
              ...current,
              profilePicture: result,
            }
          : current
      );

      setError("");
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!form) return;

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (!form.institution.trim()) {
      setError(
        "Institution cannot be empty."
      );
      return;
    }

    if (
      form.teachingAssignments.length ===
      0
    ) {
      setError(
        "At least one teaching assignment is required."
      );
      return;
    }

    for (const assignment of
      form.teachingAssignments) {
      if (!assignment.subject.trim()) {
        setError(
          "Every teaching assignment needs a subject."
        );
        return;
      }

      if (
        assignment.semesters.length === 0
      ) {
        setError(
          "Select at least one semester for every teaching assignment."
        );
        return;
      }

      if (
        assignment.classSections.length ===
        0
      ) {
        setError(
          "Enter at least one class section for every teaching assignment."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/profile/me`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            institution:
              form.institution.trim(),
            phone:
              form.phone.trim(),
            city: form.city.trim(),
            bio: form.bio.trim(),
            profilePicture:
              form.profilePicture || "",
            teachingAssignments:
              form.teachingAssignments.map(
                (assignment) => ({
                  subject:
                    assignment.subject.trim(),
                  degree:
                    assignment.degree.trim() ||
                    "BCA",
                  yearOfStudy:
                    Number(
                      assignment.yearOfStudy
                    ),
                  semesters:
                    assignment.semesters,
                  classSections:
                    assignment.classSections,
                })
              ),
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        navigate("/");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update your profile."
        );
      }

      const savedUser =
        data?.user as InstructorUser;

      setUser(savedUser);
      setForm(makeForm(savedUser));
      setEditing(false);
      setSuccess(
        "Profile updated successfully."
      );

      dispatch(
        updateUser({
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          institution:
            savedUser.institution,
          phone: savedUser.phone,
          city: savedUser.city,
          bio: savedUser.bio,
          profilePicture:
            savedUser.profilePicture,
          teachingAssignments:
            savedUser.teachingAssignments,
        })
      );
    } catch (err) {
      console.error(
        "Update instructor profile error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm(makeForm(user));
    }

    setEditing(false);
    setError("");
  };

  const handleRemovePicture = () => {
    setForm((current) =>
      current
        ? {
            ...current,
            profilePicture: "",
          }
        : current
    );
  };

  if (loading || !form || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-200">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading instructor profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              navigate("/instructor")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-200">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="hidden text-left sm:block">
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Exam
                <span className="text-indigo-600">
                  Forge
                </span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Instructor Profile
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/instructor")
            }
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="leading-6">
              {error}
            </span>
            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Close error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700 p-6 text-white shadow-xl shadow-indigo-200 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
                <GraduationCap className="h-4 w-4" />
                Instructor Profile
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                {user.name}
              </h2>
              <p className="mt-2 text-sm text-indigo-100 sm:text-base">
                Manage your personal information and teaching assignments.
              </p>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setSuccess("");
                  setEditing(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </section>

        <form
          onSubmit={handleSave}
          className="mt-6 space-y-6"
        >
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-100 to-violet-100 text-3xl font-black text-indigo-700 ring-4 ring-indigo-50">
                  {form.profilePicture ? (
                    <img
                      src={
                        form.profilePicture
                      }
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.name
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>

                {editing && (
                  <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={
                        handleImageChange
                      }
                    />
                  </label>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {user.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {user.email}
                    </p>
                  </div>
                  {editing &&
                    form.profilePicture && (
                      <button
                        type="button"
                        onClick={
                          handleRemovePicture
                        }
                        className="inline-flex items-center gap-2 self-start rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove photo
                      </button>
                    )}
                </div>
                <p className="mt-3 text-xs font-medium text-slate-400">
                  {editing
                    ? "Choose a profile image up to 2 MB."
                    : "Your instructor account information."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Personal Information
                </h3>
                <p className="text-xs font-medium text-slate-400">
                  Basic information about you
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Full name"
                value={form.name}
                disabled={!editing}
                onChange={(value) =>
                  updateField(
                    "name",
                    value
                  )
                }
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={user.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 pl-11 text-sm font-medium text-slate-500 outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                  Email changes require verification.
                </p>
              </div>

              <Field
                label="Phone number"
                value={form.phone}
                disabled={!editing}
                placeholder="Enter phone number"
                icon={<Phone className="h-4 w-4" />}
                onChange={(value) =>
                  updateField(
                    "phone",
                    value
                  )
                }
              />

              <Field
                label="City"
                value={form.city}
                disabled={!editing}
                placeholder="Enter city"
                icon={<MapPin className="h-4 w-4" />}
                onChange={(value) =>
                  updateField(
                    "city",
                    value
                  )
                }
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  About me
                </label>
                <textarea
                  value={form.bio}
                  disabled={!editing}
                  onChange={(event) =>
                    updateField(
                      "bio",
                      event.target.value
                    )
                  }
                  rows={4}
                  maxLength={500}
                  placeholder="Tell students a little about yourself..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-100 disabled:text-slate-500"
                />
                {editing && (
                  <p className="mt-1 text-right text-[11px] font-medium text-slate-400">
                    {form.bio.length}/500
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Teaching Information
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Institution and classes you teach
                  </p>
                </div>
              </div>

              {editing && (
                <button
                  type="button"
                  onClick={addAssignment}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Assignment
                </button>
              )}
            </div>

            <div className="mb-6">
              <Field
                label="Institution"
                value={form.institution}
                disabled={!editing}
                placeholder="Enter institution"
                onChange={(value) =>
                  updateField(
                    "institution",
                    value
                  )
                }
              />
            </div>

            <div className="space-y-5">
              {form.teachingAssignments.map(
                (assignment, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">
                          Assignment {index + 1}
                        </p>
                        {!editing && (
                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {assignment.subject}
                          </p>
                        )}
                      </div>

                      {editing &&
                        form.teachingAssignments
                          .length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeAssignment(
                                index
                              )
                            }
                            className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
                            title="Remove assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                    </div>

                    {editing ? (
                      <div className="grid gap-5 md:grid-cols-2">
                        <Field
                          label="Subject"
                          value={
                            assignment.subject
                          }
                          placeholder="e.g. Financial Accounting"
                          onChange={(value) =>
                            updateAssignment(
                              index,
                              "subject",
                              value
                            )
                          }
                        />

                        <Field
                          label="Degree"
                          value={
                            assignment.degree
                          }
                          onChange={(value) =>
                            updateAssignment(
                              index,
                              "degree",
                              value
                            )
                          }
                        />

                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">
                            BCA Year
                          </label>
                          <select
                            value={
                              assignment.yearOfStudy
                            }
                            onChange={(event) =>
                              changeAssignmentYear(
                                index,
                                Number(
                                  event.target.value
                                )
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                          >
                            <option value={1}>
                              1st Year
                            </option>
                            <option value={2}>
                              2nd Year
                            </option>
                            <option value={3}>
                              3rd Year
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">
                            Semesters
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {getSemesterOptions(
                              assignment.yearOfStudy
                            ).map(
                              (semester) => {
                                const selected =
                                  assignment.semesters.includes(
                                    semester
                                  );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      semester
                                    }
                                    onClick={() =>
                                      toggleSemester(
                                        index,
                                        semester
                                      )
                                    }
                                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                      selected
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                        : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                                    }`}
                                  >
                                    Sem {semester}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <Field
                            label="Class sections"
                            value={assignment.classSections.join(
                              ", "
                            )}
                            placeholder="A, B"
                            onChange={(value) =>
                              setSections(
                                index,
                                value
                              )
                            }
                          />
                          <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                            Enter multiple sections separated by commas.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoBox
                          label="Subject"
                          value={
                            assignment.subject
                          }
                        />
                        <InfoBox
                          label="Degree"
                          value={
                            assignment.degree
                          }
                        />
                        <InfoBox
                          label="Year"
                          value={getYearLabel(
                            assignment.yearOfStudy
                          )}
                        />
                        <InfoBox
                          label="Semesters"
                          value={assignment.semesters
                            .sort(
                              (a, b) =>
                                a - b
                            )
                            .map(
                              (semester) =>
                                `Sem ${semester}`
                            )
                            .join(", ")}
                        />
                        <InfoBox
                          label="Class sections"
                          value={assignment.classSections.join(
                            ", "
                          )}
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {editing && (
            <div className="sticky bottom-4 z-20 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs font-medium text-slate-400 sm:px-6 lg:px-8">
          © 2026 ExamForge · Instructor Portal
        </div>
      </footer>
    </div>
  );
}

// Field component
function Field({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  icon?: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-100 disabled:text-slate-500 ${
            icon ? "pl-11" : ""
          }`}
        />
      </div>
    </div>
  );
}

// InfoBox component
function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">
        {value || "Not set"}
      </p>
    </div>
  );
}

export default InstructorProfile;
