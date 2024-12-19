import { body } from "express-validator";

// Validation rules for creating or updating a service
export const validateService = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),
  body("serviceType")
    .notEmpty()
    .withMessage("Service type is required")
    .isString()
    .withMessage("Service type must be a string"),
  body("workDetail")
    .optional()
    .isString()
    .withMessage("Work detail must be a string"),
  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("isRecurring must be a boolean"),
  body("interval")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Interval must be a positive integer")
    .custom((value, { req }) => {
      if (req.body.isRecurring && !value) {
        throw new Error("Interval is required when isRecurring is true");
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
  body("availability")
    .optional()
    .isIn(["available", "unavailable"])
    .withMessage("Availability must be either 'available' or 'unavailable'"),
];
