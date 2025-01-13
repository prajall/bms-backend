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

const router = Router();

router.post(
  "/",
  upload.single("image"),
  // upload.none(),
  categoryValidation,
  handleValidation,
  createCategory
);
router.get("/", getAllCategories);
router.get("/:id", upload.none(), getCategoryById);
router.patch(
  "/:id",
  upload.none(),
  categoryValidation,
  handleValidation,
  updateCategory
);
router.delete("/:id", upload.none(), deleteCategory);

export default router;
