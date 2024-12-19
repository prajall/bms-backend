import express from "express";
import {
  createServiceOrder,
  getAllServiceOrders,
  getServiceOrderById,
  updateServiceOrder,
  deleteServiceOrder,
} from "./serviceOrder.controller";
import { serviceOrderValidation } from "./serviceOrder.validation";
import { handleValidation } from "../../../../middlewares/validation.middleware";

const router = express.Router();

router.post("/", serviceOrderValidation, handleValidation, createServiceOrder);
router.get("/", getAllServiceOrders);
router.get("/:id", getServiceOrderById);
router.patch("/:id", updateServiceOrder);
router.delete("/:id", deleteServiceOrder);

export default router;
