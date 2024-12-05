import { Router } from "express";
import {
  getAllProductsValidation,
  productValidation,
} from "./product.validation";
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsMiniList,
  updateProduct,
} from "./product.controller";
import { handleValidation } from "../../../../middlewares/validation.middleware";
import { employeeVerification } from "../../../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  employeeVerification,
  productValidation,
  handleValidation,
  createProduct
);
router.patch(
  "/:id",
  employeeVerification,
  productValidation,
  handleValidation,
  updateProduct
);

router.get("/", getAllProducts);
router.get(
  "/mini-list",
  getAllProductsValidation,
  handleValidation,
  getProductsMiniList
);

router.get("/:id", getProductById);

export default router;
