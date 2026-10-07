interface TeachingAssignmentInput {
  subject?: unknown;
  degree?: unknown;
  yearOfStudy?: unknown;
  semesters?: unknown;
  classSections?: unknown;
}

/* =========================================================
   Helpers
========================================================= */

export const normalizeString = (
  value: unknown
): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
};

export const sanitizeUser = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,

  degree: user.degree,
  yearOfStudy: user.yearOfStudy,
  semester: user.semester,
  studentId: user.studentId,
  classSection: user.classSection,

  institution: user.institution,
  teachingAssignments:
    user.teachingAssignments || [],

  phone: user.phone,
  city: user.city,
  bio: user.bio,
  profilePicture: user.profilePicture || null,
});

export const normalizeTeachingAssignments = (
  value: unknown
): {
  subject: string;
  degree: string;
  yearOfStudy: number;
  semesters: number[];
  classSections: string[];
}[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const assignments: {
    subject: string;
    degree: string;
    yearOfStudy: number;
    semesters: number[];
    classSections: string[];
  }[] = [];

  for (const rawAssignment of value as TeachingAssignmentInput[]) {
    if (
      !rawAssignment ||
      typeof rawAssignment !== "object"
    ) {
      return null;
    }

    const subject = normalizeString(
      rawAssignment.subject
    );

    const degree = normalizeString(
      rawAssignment.degree
    );

    const yearOfStudy = Number(
      rawAssignment.yearOfStudy
    );

    const rawSemesters =
      Array.isArray(
        rawAssignment.semesters
      )
        ? rawAssignment.semesters
        : [];

    const rawSections =
      Array.isArray(
        rawAssignment.classSections
      )
        ? rawAssignment.classSections
        : [];

    const semesters = Array.from(
      new Set(
        rawSemesters
          .map((semester) =>
            Number(semester)
          )
          .filter((semester) =>
            Number.isInteger(semester) &&
            semester >= 1 &&
            semester <= 6
          )
      )
    );

    const classSections = Array.from(
      new Set(
        rawSections
          .map((section) =>
            normalizeString(section)
          )
          .filter(
            (
              section
            ): section is string =>
              Boolean(section)
          )
      )
    );

    if (!subject) {
      return null;
    }

    if (subject.length > 150) {
      return null;
    }

    if (!degree) {
      return null;
    }

    if (degree.length > 50) {
      return null;
    }

    if (
      !Number.isInteger(yearOfStudy) ||
      yearOfStudy < 1 ||
      yearOfStudy > 3
    ) {
      return null;
    }

    if (semesters.length === 0) {
      return null;
    }

    if (classSections.length === 0) {
      return null;
    }

    if (
      classSections.some(
        (section) =>
          section.length > 20
      )
    ) {
      return null;
    }

    assignments.push({
      subject,
      degree,
      yearOfStudy,
      semesters,
      classSections,
    });
  }

  return assignments;
};
