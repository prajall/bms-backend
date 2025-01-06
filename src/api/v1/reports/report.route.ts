import { Router } from "express";
import { generateServiceOrderReport } from "./serviceOrderReport";
import { generateBillingReport } from "./billingReport";
import { generatePOSReport } from "./posReport";

const router = Router();

router.get("/service-order", generateServiceOrderReport);
router.get("/billings", generateBillingReport);
router.get("/pos", generatePOSReport);

export default router;
