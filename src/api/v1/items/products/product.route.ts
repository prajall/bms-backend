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
import { upload } from "../../../../utils/multer.util";

const router = Router();

router.post(
  "/",
  upload.array("images", 5),
  employeeVerification,
  productValidation,
  handleValidation,
  createProduct
);
router.patch(
  "/:id",
  upload.array("images", 5),
  employeeVerification,
  productValidation,
  handleValidation,
  updateProduct
);

router.get("/", upload.none(), getAllProducts);
router.get(
  "/mini-list",
  getAllProductsValidation,
  handleValidation,
  getProductsMiniList
);

router.get("/:id", getProductById);

export default router;
