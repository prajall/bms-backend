import express from "express";
import {
  createServiceOrder,
  getAllServiceOrders,
  getServiceOrderById,
  updateServiceOrder,
  deleteServiceOrder,
} from "./serviceOrder.controller";

const router = express.Router();

router.post("/", createServiceOrder);
router.get("/", getAllServiceOrders);
router.get("/:id", getServiceOrderById);
router.patch("/:id", updateServiceOrder);
router.delete("/:id", deleteServiceOrder);

export default router;
