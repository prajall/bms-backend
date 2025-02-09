import express from "express";
import {
  createServiceOrder,
  getAllServiceOrders,
  getMiniServiceOrders,
  getServiceOrderById,
  getServiceOrdersByOrderId,
  updateServiceOrder,
  deleteServiceOrder,
  getNextRecurringOrders,
} from "./serviceOrder.controller";
import { serviceOrderValidation } from "./serviceOrder.validation";
import { handleValidation } from "../../../../middlewares/validation.middleware";
import { checkPermission } from "../../../../middlewares/permissions.middleware";
import { upload } from "../../../../utils/multer.util";

const router = express.Router();

router.post(
  "/",
  checkPermission("service_order", "create"),
  serviceOrderValidation,
  handleValidation,
  createServiceOrder
);
router.get("/", checkPermission("service_order", "view"), getAllServiceOrders);
router.get(
  "/mini-list",
  checkPermission("service_order", "view"),
  getMiniServiceOrders
);
router.get(
  "/recurring",
  checkPermission("service_order", "view"),
  getNextRecurringOrders
);
router.get(
  "/:id",
  checkPermission("service_order", "view"),
  getServiceOrderById
);
router.get(
  "/orderid/:orderId",
  checkPermission("service_order", "view"),
  getServiceOrdersByOrderId
);

router.patch(
  "/:id",
  checkPermission("service_order", "update"),
  serviceOrderValidation,
  handleValidation,
  updateServiceOrder
);
router.delete(
  "/:id",
  checkPermission("service_order", "delete"),
  deleteServiceOrder
);

export default router;
