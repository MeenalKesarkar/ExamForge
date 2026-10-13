import test from "node:test";
import assert from "node:assert/strict";
import { canStudentAccessAttempt } from "../routes/attempts/helpers";

test("only the owning student can access a student attempt", () => {
  assert.equal(canStudentAccessAttempt({ userId: "student-1", role: "student" }, "student-1"), true);
  assert.equal(canStudentAccessAttempt({ userId: "student-2", role: "student" }, "student-1"), false);
  assert.equal(canStudentAccessAttempt({ userId: "instructor-1", role: "instructor" }, "student-1"), false);
  assert.equal(canStudentAccessAttempt({ userId: "admin-1", role: "admin" }, "student-1"), false);
  assert.equal(canStudentAccessAttempt(undefined, "student-1"), false);
});
