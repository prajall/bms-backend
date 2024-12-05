import { body } from "express-validator";

export const serviceProvidedValidation = [
  body("serviceId")
    .notEmpty()
    .withMessage("Service ID is required")
    .isMongoId()
    .withMessage("Invalid Service ID format"),

  body("serviceOrderId")
    .notEmpty()
    .withMessage("Service Order ID is required")
    .isMongoId()
    .withMessage("Invalid Service Order ID format"),

  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 100 })
    .withMessage("Title should not exceed 100 characters"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .toDate()
    .withMessage("Invalid date format. Please use ISO 8601 format"),

  body("serviceCharge")
    .notEmpty()
    .withMessage("Service charge is required")
    .isFloat({ min: 0 })
    .withMessage("Service charge must be a non-negative number"),

  body("products")
    .isArray()
    .withMessage("Products must be an array")
    .optional(),
  body("products.*")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),

  body("parts").isArray().withMessage("Parts must be an array").optional(),
  body("parts.*")
    .isMongoId()
    .withMessage("Each part must be a valid MongoDB ObjectId"),

  body("workDetail")
    .optional()
    .isString()
    .withMessage("Work detail must be a string"),

  body("additionalNotes")
    .optional()
    .isString()
    .withMessage("Additional notes must be a string"),

  body("billing").isArray().withMessage("Billing must be an array").optional(),
  body("billing.*")
    .isMongoId()
    .withMessage("Each billing entry must be a valid MongoDB ObjectId"),
];
