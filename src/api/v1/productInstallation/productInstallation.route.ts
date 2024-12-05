import express from "express";
import {
  createProductInstallation,
  getAllProductInstallations,
  getProductInstallationById,
  updateProductInstallation,
  deleteProductInstallation,
} from "./productInstallation.controller";
import { productInstallationValidation } from "./productInstallation.validation";
import { handleValidation } from "../../../middlewares/validation.middleware";

const router = express.Router();

router.post(
  "/",
  productInstallationValidation,
  handleValidation,
  createProductInstallation
);

router.get("/", getAllProductInstallations);

router.get("/:id", getProductInstallationById);

router.patch(
  "/:id",
  productInstallationValidation,
  handleValidation,
  updateProductInstallation
);

router.delete("/:id", deleteProductInstallation);

export default router;
