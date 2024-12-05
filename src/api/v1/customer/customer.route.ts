import { Router } from "express";
import { customerValidation } from "./customer.validation";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerDetails,
  updateCustomer,
} from "./customer.controller";
import { handleValidation } from "../../../middlewares/validation.middleware";

const router = Router();

router.post("/", customerValidation, handleValidation, createCustomer);
router.get("/", getAllCustomers);
router.get("/:id", getCustomerDetails);
router.patch("/:id", customerValidation, handleValidation, updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
