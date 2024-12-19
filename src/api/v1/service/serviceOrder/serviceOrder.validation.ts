import { body } from "express-validator";

export const serviceOrderValidation = [
  body("service")
    .notEmpty()
    .withMessage("Service ID is required")
    .isMongoId()
    .withMessage("Invalid Service ID format"),

  body("parentServiceOrder")
    .optional()
    .isMongoId()
    .withMessage("Invalid Parent Service Order ID format"),

  body("customer")
    .optional()
    .isMongoId()
    .withMessage("Invalid Customer ID format"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Invalid date format. Please use ISO 8601 format")
    .toDate(),

  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("Recurring must be a boolean"),

  body("interval")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Interval must be a positive integer"),
  body("nextServiceDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid next service date format. Please use ISO 8601 format")
    .toDate()
    .custom((value, { req }) => {
      if (req.body.isRecurring && !value) {
        throw new Error("Next Service date is required for recurring service");
      }
      return true;
    }),
  body("serviceCharge")
    .notEmpty()
    .withMessage("Service charge is required")
    .isFloat({ min: 0 })
    .withMessage("Service charge must be a non-negative number"),

  body("additionalNotes")
    .optional()
    .isString()
    .withMessage("Additional notes must be a string"),

  body("orderId")
    .optional()
    .isString()
    .withMessage("Order ID must be a string"),

  body("order").optional().isMongoId().withMessage("Invalid Order ID format"),
];
