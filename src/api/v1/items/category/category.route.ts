import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "./category.controller";
import { categoryValidation } from "./category.validation";
import { handleValidation } from "../../../../middlewares/validation.middleware";
import { upload } from "../../../../utils/multer.util";
import { authValidation } from "../../../../middlewares/auth.middleware";
import { checkPermission } from "../../../../middlewares/permissions.middleware";

const router = Router();

router.post(
  "/",
  // upload.single("image"),
  upload.none(),
  authValidation,
  checkPermission("category", "create"),
  categoryValidation,
  handleValidation,
  createCategory
);
router.get("/", getAllCategories);
router.get("/:id", upload.none(), getCategoryById);
router.patch(
  "/:id",
  upload.none(),
  authValidation,
  checkPermission("category", "update"),
  categoryValidation,
  handleValidation,
  updateCategory
);
router.delete(
  "/:id",
  upload.none(),
  authValidation,
  checkPermission("category", "delete"),
  deleteCategory
);

export default router;
