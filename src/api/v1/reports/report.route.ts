import { Router } from "express";
import { generateServiceOrderReport } from "./serviceOrderReport";
import { generateBillingReport } from "./billingReport";
import { generatePOSReport } from "./posReport";
import { checkPermission } from "../../../middlewares/permissions.middleware";

const router = Router();

router.get(
  "/service-order",
  checkPermission("service_order_report", "view"),
  generateServiceOrderReport
);
router.get(
  "/billings",
  checkPermission("billing", "view"),
  generateBillingReport
);
router.get("/pos", checkPermission("POS_report", "view"), generatePOSReport);

export default router;
