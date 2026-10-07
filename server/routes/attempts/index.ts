import { Router } from "express";
import attemptRoutesCore from "./core";
import attemptRoutesSubmission from "./submission";
import attemptRoutesResults from "./results";
import attemptRoutesFallback from "./fallback";

const router = Router();
router.use(attemptRoutesCore);
router.use(attemptRoutesSubmission);
router.use(attemptRoutesResults);
router.use(attemptRoutesFallback);

export default router;
