import { Router } from "express";
import {
  employeeValidation,
  updateEmployeeValidation,
} from "./employee.validation";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeDetails,
  updateEmployee,
} from "./employee.controller";
import { handleValidation } from "../../../middlewares/validation.middleware";

const router = Router();

router.post("/", employeeValidation, handleValidation, createEmployee);
router.get("/", getAllEmployees);
router.get("/:id", getEmployeeDetails);
router.patch(
  "/:id",
  updateEmployeeValidation,
  handleValidation,
  updateEmployee
);

export default router;
