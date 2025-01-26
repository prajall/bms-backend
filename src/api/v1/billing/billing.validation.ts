import { body } from "express-validator";
import mongoose from "mongoose";

export const validateBilling = [
  // Date validation
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((date) => {
      const billingDate = new Date(date);
      if (billingDate > new Date()) {
        throw new Error("Future dates are not allowed");
      }
      return true;
    }),

  // Customer validation
  body("customer")
    .notEmpty()
    .withMessage("Customer is required")
    .isMongoId()
    .withMessage("Invalid customer ID"),

  // Service orders validation
  body("serviceOrders")
    .optional()
    .isArray()
    .withMessage("Service orders must be a array")
    .custom((serviceOrders) => {
      if (
        !serviceOrders.every(
          (order: any) =>
            order.serviceOrder &&
            mongoose.Types.ObjectId.isValid(order.serviceOrder) &&
            order.orderId &&
            typeof order.orderId === "string"
        )
      ) {
        throw new Error(
          "Each service order must have a valid serviceOrder ID and orderId"
        );
      }
      return true;
    }),

  // POS orders validation
  body("posOrders")
    .optional()
    .isArray()
    .withMessage("POS orders must be a array")
    .custom((posOrders) => {
      if (
        !posOrders.every(
          (order: any) =>
            order.posOrder &&
            mongoose.Types.ObjectId.isValid(order.posOrder) &&
            order.orderId &&
            typeof order.orderId === "string"
        )
      ) {
        throw new Error(
          "Each POS order must have a valid posOrder ID and orderId"
        );
      }
      return true;
    }),

  // Type validation
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["service", "pos", "customer"])
    .withMessage("Type must be one of 'service', 'pos', or 'customer'"),

  // Paid amount validation
  body("paidAmount")
    .isFloat({ min: 0 })
    .withMessage("Paid amount must be a positive number")
    .notEmpty()
    .withMessage("Paid amount is required"),

  // Total paid validation
  body("totalPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total paid must be a positive number"),

  // Total amount validation
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number")
    .notEmpty()
    .withMessage("Total amount is required"),

  // Discount validation
  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a positive number"),

  // Tax validation
  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),
];
