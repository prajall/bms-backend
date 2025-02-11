import { Router } from "express";
import { validatePart, validatePartId } from "./parts.validation";
import {
  createPart,
  deletePart,
  getAllParts,
  getPartById,
  getPartsMiniList,
  updatePart,
} from "./parts.controller";
import { handleValidation } from "../../../../middlewares/validation.middleware";
import {
  authValidation,
  employeeVerification,
} from "../../../../middlewares/auth.middleware";
import { upload } from "../../../../utils/multer.util";
import { checkPermission } from "../../../../middlewares/permissions.middleware";
import { processBaseImage } from "../../../../middlewares/other.middleware";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  authValidation,
  checkPermission("part", "create"),
  processBaseImage,
  validatePart,
  handleValidation,
  createPart
);
router.patch(
  "/:id",
  upload.single("image"),
  authValidation,
  checkPermission("part", "create"),
  processBaseImage,
  validatePartId,
  validatePart,
  handleValidation,
  updatePart
);

router.get("/", getAllParts);
router.get("/mini-list", getPartsMiniList);

router.get("/:id", getPartById);
router.delete(
  "/:id",
  authValidation,
  checkPermission("part", "delete"),
  deletePart
);

export default router;
