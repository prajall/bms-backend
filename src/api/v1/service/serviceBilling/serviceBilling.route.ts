import express from "express";
import {
  createBilling,
  getBillings,
  getBillingById,
  updateBilling,
  deleteBilling,
} from "./serviceBilling.controller";
import { validateBilling } from "./serviceBilling.validation";
import { handleValidation } from "../../../../middlewares/validation.middleware";

const router = express.Router();

// create
router.post("/", validateBilling, handleValidation, createBilling);

// fetch, also add filters in query for customerId, serviceOrder, serviceProvided
router.get("/", getBillings);
router.get("/:billingId", getBillingById);
//update
router.put("/:billingId", validateBilling, handleValidation, updateBilling);
router.delete("/:billingId", deleteBilling);

export default router;
