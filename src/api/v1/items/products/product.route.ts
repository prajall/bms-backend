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
import {
  authValidation,
  employeeVerification,
} from "../../../../middlewares/auth.middleware";
import { upload } from "../../../../utils/multer.util";
import { checkPermission } from "../../../../middlewares/permissions.middleware";

const router = Router();

router.post(
  "/",
  authValidation,
  checkPermission("product", "update"),
  upload.array("images", 5),
  productValidation,
  handleValidation,
  createProduct
);
router.patch(
  "/:id",
  authValidation,
  checkPermission("product", "update"),
  upload.array("images", 5),
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
