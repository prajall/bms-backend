import { body } from "express-validator";
import mongoose from "mongoose";

export const validateBilling = [
  body("customer")
    .isMongoId()
    .withMessage("Invalid customer ID")
    .notEmpty()
    .withMessage("Customer is required"),
  body("serviceOrders")
    .isArray({ min: 1 })
    .withMessage("Service orders must be a non-empty array")
    .custom((serviceOrders) => {
      if (!serviceOrders.every((order: any) => order.serviceOrder && mongoose.Types.ObjectId.isValid(order.serviceOrder))) {
        throw new Error("Each service order must have a valid serviceOrder ID");
      }
      return true;
    }),
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number")
    .notEmpty()
    .withMessage("Total amount is required"),
  body("paidAmount")
    .isFloat({ min: 0 })
    .withMessage("Paid amount must be a positive number")
    .notEmpty()
    .withMessage("Paid amount is required"),
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
];
