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
import { checkPermission } from "../../../middlewares/permissions.middleware";
import { authValidation } from "../../../middlewares/auth.middleware";
import { upload } from "../../../utils/multer.util";
import parseNestedFields from "../../../middlewares/parseFormData";

const router = Router();

router.post(
  "/",
  authValidation,
  checkPermission("employee", "create"),
  upload.single("image"),
  parseNestedFields,
  employeeValidation,
  handleValidation,
  createEmployee
);
router.get(
  "/",
  authValidation,
  checkPermission("employee", "view"),
  getAllEmployees
);
router.get("/:id", getEmployeeDetails);
router.patch(
  "/:id",
  upload.single("image"),
  parseNestedFields,
  updateEmployeeValidation,
  handleValidation,
  updateEmployee
);

export default router;
