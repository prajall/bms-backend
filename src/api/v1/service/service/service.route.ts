import { Router } from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} from "./service.controller";
import { validateService } from "./service.validation";
import { handleValidation } from "../../../../middlewares/validation.middleware";
import { checkPermission } from "../../../../middlewares/permissions.middleware";

const router = Router();

router.post(
  "/",
  checkPermission("service", "create"),
  validateService,
  handleValidation,
  createService
);
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.patch(
  "/:id",
  checkPermission("service", "update"),
  validateService,
  handleValidation,
  updateService
);
router.delete("/:id", checkPermission("service", "delete"), deleteService);

export default router;
