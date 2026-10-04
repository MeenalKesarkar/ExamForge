import { NextFunction, Response, Router } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import { AuthenticatedRequest, requireAuth } from "../middleware/authMiddleware";

const router = Router();
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") { res.status(403).json({ message: "Administrator access is required" }); return; }
  next();
};
router.use(requireAuth, requireAdmin);

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
