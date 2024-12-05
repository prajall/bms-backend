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

const router = Router();

router.post("/", categoryValidation, handleValidation, createCategory);
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.patch("/:id", categoryValidation, handleValidation, updateCategory);
router.delete("/:id", deleteCategory);

export default router;
