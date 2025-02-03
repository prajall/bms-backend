import { Router } from "express";
import {
  getAllProductsValidation,
  productValidation,
} from "./product.validation";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductsMiniList,
  updateProduct,
} from "./product.controller";
import { handleValidation } from "../../../../middlewares/validation.middleware";
import {
  authValidation, 
} from "../../../../middlewares/auth.middleware";
import { upload } from "../../../../utils/multer.util";
import { checkPermission } from "../../../../middlewares/permissions.middleware";
import parseNestedFields from "../../../../middlewares/parseFormData";
import { processBaseImage } from "../../../../middlewares/other.middleware";

const router = Router();

router.post(
  "/",
  authValidation,
  upload.array("images", 5),
  checkPermission("product", "update"),
  parseNestedFields,
  processBaseImage,
  productValidation,
  handleValidation,
  createProduct
);
router.patch(
  "/:id",
  authValidation,
  checkPermission("product", "update"),
  authValidation,
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
router.delete("/:id", authValidation, checkPermission("product","delete"),deleteProduct)

export default router;
