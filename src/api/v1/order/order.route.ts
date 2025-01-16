import express from "express";
import {
  createOrder,
  fetchOrderDetails,
  fetchOrders,
} from "./order.controller";
import { checkPermission } from "../../../middlewares/permissions.middleware";

const router = express.Router();

router.get("/", checkPermission("order", "view"), fetchOrders);
router.get("/:id", checkPermission("order", "view"), fetchOrderDetails);

export default router;
