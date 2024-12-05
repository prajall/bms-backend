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

const router = Router();

router.post("/", validateService, handleValidation, createService);
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.patch("/:id", validateService, handleValidation, updateService);
router.delete("/:id", deleteService);

export default router;
