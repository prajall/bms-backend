import express from "express";
import {
  createOrder,
  fetchOrderDetails,
  fetchOrders,
} from "./order.controller";

const router = express.Router();

router.get("/", fetchOrders);
router.get("/:id", fetchOrderDetails);

export default router;
