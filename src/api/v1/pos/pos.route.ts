import express from "express";
import {
  createPOS,
  getAllPOS,
  getAllPOSList,
  getPOSById,
  updatePOS,
} from "./pos.controller";
import { checkPermission } from "../../../middlewares/permissions.middleware";
import { validatePOS } from "./pos.validation";
import { handleValidation } from "../../../middlewares/validation.middleware";

const router = express.Router();

router.post(
  "/",
  checkPermission("pos", "create"),
  validatePOS,
  handleValidation,
  createPOS
);
router.get("/", checkPermission("pos", "view"), getAllPOS);
router.get("/mini-list", checkPermission("pos", "view"), getAllPOSList);
router.get("/:id", checkPermission("pos", "view"), getPOSById);
router.put(
  "/:id",
  checkPermission("pos", "update"),
  validatePOS,
  handleValidation,
  updatePOS
);

export default router;
