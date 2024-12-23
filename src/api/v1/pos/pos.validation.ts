import { body } from "express-validator";

export const validatePOS = [
  body("customerType")
    .notEmpty()
    .withMessage("Customer type is required")
    .isIn(["walking", "registered"])
    .withMessage("Customer type must be either 'walking' or 'registered'"),

  body("customer")
    .optional()
    .isMongoId()
    .withMessage("Invalid customer ID. Id must be mongo id"),

  // Validate products array
  body("products.*.productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("products.*.quantity")
    .notEmpty()
    .withMessage("Product quantity is required")
    .isInt({ min: 1 })
    .withMessage("Product quantity must be at least 1"),

  body("products.*.price")
    .notEmpty()
    .withMessage("Product price is required")
    .isFloat({ min: 0 })
    .withMessage("Product price must be a positive number"),

  // Validate parts array
  body("parts").optional().isArray().withMessage("Parts must be an array"),
  body("parts.*.partId")
    .notEmpty()
    .withMessage("Part ID is required")
    .isMongoId()
    .withMessage("Invalid part ID"),
  body("parts.*.quantity")
    .notEmpty()
    .withMessage("Part quantity is required")
    .isInt({ min: 1 })
    .withMessage("Part quantity must be at least 1"),
  body("parts.*.price")
    .notEmpty()
    .withMessage("Part price is required")
    .isFloat({ min: 0 })
    .withMessage("Part price must be a positive number"),

  // Validate services array
  // body("services")
  //   .optional()
  //   .isArray()
  //   .withMessage("Services must be an array"),
  // body("services.*.serviceId")
  //   .notEmpty()
  //   .withMessage("Service ID is required")
  //   .isMongoId()
  //   .withMessage("Invalid service ID"),
  // body("services.*.price")
  //   .notEmpty()
  //   .withMessage("Service price is required")
  //   .isFloat({ min: 0 })
  //   .withMessage("Service price must be a positive number"),
  // body("services.*.additionalNotes")
  //   .optional()
  //   .isString()
  //   .isLength({ max: 1000 })
  //   .withMessage("Additional notes must not exceed 1000 characters"),
  // body("services.*.date")
  //   .optional()
  //   .isISO8601()
  //   .withMessage("Invalid date format"),

  // Validate installations array
  body("installations")
    .optional()
    .isArray()
    .withMessage("Installations must be an array"),
  body("installations.*.installationId")
    .notEmpty()
    .withMessage("Installation ID is required")
    .isMongoId()
    .withMessage("Invalid installation ID"),
  body("installations.*.price")
    .notEmpty()
    .withMessage("Installation price is required")
    .isFloat({ min: 0 })
    .withMessage("Installation price must be a positive number"),
  body("installations.*.additionalNotes")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Additional notes must not exceed 1000 characters"),

  // Validate totalPrice
  body("totalPrice")
    .notEmpty()
    .withMessage("Total price is required")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a positive number"),

  // Validate discount
  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  // Validate paymentMethod
  body("subTotal")
    .notEmpty()
    .withMessage("Subtotal is required")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),

  body("tax")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Tax must be between 0 and 100"),
];
