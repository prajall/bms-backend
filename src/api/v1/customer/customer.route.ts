import { Router } from "express";
import { customerValidation } from "./customer.validation";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getAllCustomerList,
  getCustomerDetails,
  updateCustomer,
} from "./customer.controller";
import { handleValidation } from "../../../middlewares/validation.middleware";
import { upload } from "../../../utils/multer.util";
import parseNestedFields from "../../../middlewares/parseFormData";
import { uploadSingleImage } from "../../../middlewares/other.middleware";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  uploadSingleImage,
  parseNestedFields,
  customerValidation,
  handleValidation,
  createCustomer
);
router.get("/", getAllCustomers);
router.get("/mini-list", getAllCustomerList);
router.get("/:id", getCustomerDetails);
router.patch(
  "/:id",
  upload.single("image"),
  parseNestedFields,
  customerValidation,
  handleValidation,
  updateCustomer
);
router.delete("/:id", deleteCustomer);

export default router;
