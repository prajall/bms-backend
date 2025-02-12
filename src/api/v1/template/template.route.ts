import { Router } from "express";
import {
  createTemplate,
  deleteTemplate,
  getAllTemplate,
  getTemplateById,
  updateTemplate,
} from "./template.controller";
import { validateTemplate } from "./template.validation";
import { handleValidation } from "../../../middlewares/validation.middleware";

const router = Router();

router.post("/", validateTemplate, handleValidation, createTemplate);
router.patch("/:id", updateTemplate);
router.get("/", getAllTemplate);
router.delete("/:id", deleteTemplate);
router.get("/:id", getTemplateById);

export default router;
