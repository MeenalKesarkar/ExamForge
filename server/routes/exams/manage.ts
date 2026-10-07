import { Router } from "express";
import examRoutesPatch from "./patch";
import examRoutesUpdate from "./update";
import examRoutesDelete from "./delete";

const router = Router();
router.use(examRoutesPatch);
router.use(examRoutesUpdate);
router.use(examRoutesDelete);

export default router;
