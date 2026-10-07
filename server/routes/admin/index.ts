import { NextFunction, Response, Router } from "express";
import mongoose from "mongoose";
import User from "../../models/User";
import { AuthenticatedRequest, requireAuth } from "../../middleware/authMiddleware";

const router = Router();
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") { res.status(403).json({ message: "Administrator access is required" }); return; }
  next();
};
router.use(requireAuth, requireAdmin);

router.get("/students", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await User.find({ role: "student", accountStatus: "approved" })
      .select("name email degree yearOfStudy semester studentId classSection institution isActive isGraduated graduatedAt createdAt")
      .sort({ isGraduated: 1, yearOfStudy: 1, semester: 1, name: 1 })
      .lean();
    return res.status(200).json({ students });
  } catch (error) {
    console.error("GET /api/admin/students error:", error);
    return res.status(500).json({ message: "Unable to load student records" });
  }
});

router.patch("/students/:studentId/promote", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.isValidObjectId(studentId)) return res.status(400).json({ message: "Invalid student id" });
    const student = await User.findOne({ _id: studentId, role: "student", accountStatus: "approved", isActive: true, isGraduated: { $ne: true } });
    if (!student) return res.status(404).json({ message: "Active student record not found" });
    const semester = Number(student.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 6) {
      return res.status(409).json({ message: "Set a valid current semester before promoting this student" });
    }
    if (semester === 6) return res.status(409).json({ message: "The student has completed semester 6. Mark them as graduated instead." });
    student.semester = semester + 1;
    student.yearOfStudy = Math.ceil(student.semester / 2);
    await student.save();
    return res.status(200).json({ message: "Student promoted to the next semester", student: {
      _id: student._id, name: student.name, email: student.email, yearOfStudy: student.yearOfStudy, semester: student.semester,
    } });
  } catch (error) {
    console.error("PATCH /api/admin/students/:studentId/promote error:", error);
    return res.status(500).json({ message: "Unable to promote this student" });
  }
});

router.patch("/students/:studentId/graduate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.isValidObjectId(studentId)) return res.status(400).json({ message: "Invalid student id" });
    if (!req.user?.userId) return res.status(401).json({ message: "Authentication required" });
    const student = await User.findOne({ _id: studentId, role: "student", accountStatus: "approved", isActive: true, isGraduated: { $ne: true } });
    if (!student) return res.status(404).json({ message: "Active student record not found" });
    student.isGraduated = true;
    student.isActive = false;
    student.graduatedAt = new Date();
    student.graduatedBy = new mongoose.Types.ObjectId(req.user.userId);
    await student.save();
    return res.status(200).json({ message: "Student marked as graduated. Their account is deactivated and exam history is preserved." });
  } catch (error) {
    console.error("PATCH /api/admin/students/:studentId/graduate error:", error);
    return res.status(500).json({ message: "Unable to graduate this student" });
  }
});

router.get("/requests", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await User.find({ role: { $in: ["student", "instructor"] }, accountStatus: "pending", isActive: true })
      .select("name email role institution degree yearOfStudy semester studentId classSection teachingAssignments createdAt")
      .sort({ createdAt: -1 }).lean();
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("GET /api/admin/requests error:", error);
    return res.status(500).json({ message: "Unable to load account requests" });
  }
});

router.patch("/requests/:requestId/approve", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    if (!mongoose.isValidObjectId(requestId)) return res.status(400).json({ message: "Invalid request id" });
    if (!req.user?.userId) return res.status(401).json({ message: "Authentication required" });
    const approved = await User.findOneAndUpdate(
      { _id: requestId, role: { $in: ["student", "instructor"] }, accountStatus: "pending", isActive: true },
      { $set: { accountStatus: "approved", approvedAt: new Date(), approvedBy: new mongoose.Types.ObjectId(req.user.userId) }, $unset: { rejectionReason: 1 } },
      { new: true, runValidators: true },
    ).select("name email role accountStatus approvedAt");
    if (!approved) return res.status(409).json({ message: "This account request is no longer pending or is unavailable" });
    return res.status(200).json({ message: "Account approved. The applicant can now sign in with their registered password.", user: approved });
  } catch (error) {
    console.error("PATCH /api/admin/requests/:requestId/approve error:", error);
    return res.status(500).json({ message: "Unable to approve this account request" });
  }
});

router.patch("/requests/:requestId/reject", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    if (!mongoose.isValidObjectId(requestId)) return res.status(400).json({ message: "Invalid request id" });
    const reason = typeof req.body?.reason === "string" && req.body.reason.trim() ? req.body.reason.trim().slice(0, 500) : "Application declined by an administrator";
    const rejected = await User.findOneAndUpdate(
      { _id: requestId, role: { $in: ["student", "instructor"] }, accountStatus: "pending", isActive: true },
      { $set: { accountStatus: "rejected", rejectionReason: reason } },
      { new: true, runValidators: true },
    ).select("name email role accountStatus rejectionReason");
    if (!rejected) return res.status(409).json({ message: "This account request is no longer pending or is unavailable" });
    return res.status(200).json({ message: "Account request declined", user: rejected });
  } catch (error) {
    console.error("PATCH /api/admin/requests/:requestId/reject error:", error);
    return res.status(500).json({ message: "Unable to decline this account request" });
  }
});

export default router;
