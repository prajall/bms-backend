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
import { upload } from "../../../../utils/multer.util";

const router = Router();

router.post(
  "/",
  upload.none(),
  employeeVerification,
  validatePart,
  handleValidation,
  createPart
);
router.patch(
  "/:id",
  upload.none(),
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
