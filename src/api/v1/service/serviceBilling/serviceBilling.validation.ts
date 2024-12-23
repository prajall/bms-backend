import { body } from "express-validator";

export const validateBilling = [
  body("customer")
    .isMongoId()
    .withMessage("Invalid customer ID")
    .notEmpty()
    .withMessage("Customer is required"),
  body("serviceOrder")
    .isMongoId()
    .withMessage("Invalid service order ID")
    .notEmpty()
    .withMessage("Service order is required"),
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
];
