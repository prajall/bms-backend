import { Router } from "express";
import { validatePart, validatePartId } from "./parts.validation";
import {
  createPart,
  getAllParts,
  getPartById,
  getPartsMiniList,
  updatePart,
} from "./parts.controller";
import { handleValidation } from "../../../../middlewares/validation.middleware";
import { employeeVerification } from "../../../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  employeeVerification,
  validatePart,
  handleValidation,
  createPart
);
router.patch(
  "/:id",
  employeeVerification,
  validatePartId,
  validatePart,
  handleValidation,
  updatePart
);

router.get("/", getAllParts);
router.get("/mini-list", getPartsMiniList);

router.get("/:id", getPartById);

export default router;
