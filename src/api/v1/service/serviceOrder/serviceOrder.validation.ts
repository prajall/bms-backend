import { body } from "express-validator";

export const serviceOrderValidation = [
  body("serviceId")
    .notEmpty()
    .withMessage("Service ID is required")
    .isMongoId()
    .withMessage("Invalid Service ID format"),

  body("customerId")
    .notEmpty()
    .withMessage("Customer ID is required")
    .isMongoId()
    .withMessage("Invalid Customer ID format"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .toDate()
    .withMessage("Invalid date format. Please use ISO 8601 format"),

  body("recurring")
    .optional()
    .isBoolean()
    .withMessage("Recurring must be a boolean"),

  body("nextServiceDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage(
      "Invalid next service date format. Please use ISO 8601 format"
    ),

  body("serviceCharge")
    .notEmpty()
    .withMessage("Service charge is required")
    .isFloat({ min: 0 })
    .withMessage("Service charge must be a non-negative number"),

  body("serviceProvided")
    .optional()
    .isArray()
    .withMessage("ServiceProvided must be an array"),
  body("serviceProvided.*")
    .isMongoId()
    .withMessage("Each serviceProvided ID must be a valid MongoDB ObjectId"),
];
