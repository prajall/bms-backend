import { body } from "express-validator";

export const productInstallationValidation = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid Product ID format"),

  body("customerId")
    .notEmpty()
    .withMessage("Customer ID is required")
    .isMongoId()
    .withMessage("Invalid Customer ID format"),

  body("installationDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid installation date"),

  body("status")
    .optional()
    .isIn(["pending", "completed", "in-progress", "canceled", "delayed"])
    .withMessage("Invalid status value"),

  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isString()
    .withMessage("Address must be a string"),

  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string"),

  body("additionalNote")
    .optional()
    .isString()
    .withMessage("Additional note must be a string"),

  body("installationCharge")
    .notEmpty()
    .withMessage("Installation charge is required")
    .isFloat({ min: 0 })
    .withMessage("Installation charge must be a non-negative number"),

  body("addedServices")
    .optional()
    .isArray()
    .withMessage("Added services must be an array"),
  body("addedServices.*")
    .isMongoId()
    .withMessage("Each added service must be a valid MongoDB ObjectId"),
];
