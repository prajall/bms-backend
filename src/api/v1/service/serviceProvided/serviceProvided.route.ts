import express from "express";
import { serviceProvidedValidation } from "./serviceProvided.validation";
import {
  createServiceProvided,
  getAllServiceProvided,
  getServiceProvidedById,
  updateServiceProvided,
  deleteServiceProvided,
} from "./serviceProvided.controller";
import { handleValidation } from "../../../../middlewares/validation.middleware";

const router = express.Router();

router.post(
  "/",
  serviceProvidedValidation,
  handleValidation,
  createServiceProvided
);

router.get("/", getAllServiceProvided);

router.get("/:id", getServiceProvidedById);

router.patch(
  "/:id",
  serviceProvidedValidation,
  handleValidation,
  updateServiceProvided
);

router.delete("/:id", deleteServiceProvided);

export default router;
