import express from "express";
import {
  createBilling,
  getBillings,
  getBillingById,
  updateBilling,
  deleteBilling,
} from "./billing.controller";
import { validateBilling } from "./billing.validation";
import { handleValidation } from "../../../middlewares/validation.middleware";
import { checkPermission } from "../../../middlewares/permissions.middleware";

const router = express.Router();

// create
router.post(
  "/",
  checkPermission("billing", "create"),
  validateBilling,
  handleValidation,
  createBilling
);

// fetch, also add filters in query for customerId, serviceOrder, serviceProvided
router.get("/", checkPermission("billing", "view"), getBillings);
router.get("/:billingId", checkPermission("billing", "view"), getBillingById);
//update
router.put(
  "/:billingId",
  checkPermission("billing", "update"),
  validateBilling,
  handleValidation,
  updateBilling
);
router.delete(
  "/:billingId",
  checkPermission("billing", "delete"),
  deleteBilling
);

export default router;
