import { Router } from "express";
import authRoutesAccount from "./account";
import authRoutesReset from "./reset";
import authRoutesVerification from "./verification";
import authRoutesSessions from "./sessions";

const router = Router();
router.use(authRoutesAccount);
router.use(authRoutesReset);
router.use(authRoutesVerification);
router.use(authRoutesSessions);

export default router;
