import { Router } from "express";
import { generateServiceOrderReport } from "./serviceOrderReport";

const router = Router();

router.get("/service-order", generateServiceOrderReport);

export default router;
