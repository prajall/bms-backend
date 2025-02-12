import { Router } from "express";
import { createTemplate, updateTemplate } from "./template.controller";
import { validateTemplate } from "./template.validation";
import { handleValidation } from "../../../middlewares/validation.middleware";

const router = Router();

router.post("/", validateTemplate, handleValidation, createTemplate);
router.patch("/:id", updateTemplate);

export default router;
