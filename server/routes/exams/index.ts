import { Router } from "express";
import examRoutesRead from "./read";
import examRoutesCreate from "./create";
import examRoutesManage from "./manage";
import examRoutesStart from "./start";

const router = Router();
router.use(examRoutesRead);
router.use(examRoutesCreate);
router.use(examRoutesManage);
router.use(examRoutesStart);

export default router;
