import { body, query } from "express-validator";

export const productValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 100 })
    .withMessage("Product name should not exceed 100 characters"),

  body("description")
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("brand")
    .trim()
    .isLength({ max: 50 })
    .withMessage("Brand name should not exceed 50 characters"),

  // Identification
  body("sku")
    .trim()
    .notEmpty()
    .withMessage("SKU is required")
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage(
      "Invalid SKU format.Please use only letters, numbers, and hyphens"
    ),

  body("modelNo").trim().notEmpty().withMessage("Model number is required"),

  body("serialNo")
    .trim()
    .optional()
    .custom((value) => {
      if (value && value.length < 1) {
        throw new Error("Serial number cannot be empty if provided");
      }
      return true;
    }),

  // Product Details
  body("condition")
    .isIn(["new", "used", "refurbished"])
    .withMessage("Invalid condition value"),

  body("warranty.duration")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Warranty duration must be a positive integer"),

  body("warranty.description")
    .optional()
    .isString()
    .withMessage("Warranty description must be a string"),

  // Pricing
  body("costPrice")
    .notEmpty()
    .withMessage("Cost price is required")
    .isFloat({ min: 0 })
    .withMessage("Cost price must be a positive number"),

  body("sellingPrice")
    .notEmpty()
    .withMessage("Selling price is required")
    .isFloat({ min: 0 })
    .withMessage("Selling price must be a positive number"),

  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  body("category").isMongoId().withMessage("Invalid category ID"),

  // body("images")
  //   .isArray()
  //   .withMessage("Images must be an array")
  //   .notEmpty()
  //   .withMessage("At least one image is required"),

  // body("images.*").isString().withMessage("Image must be a string"),

  // Specifications
  body("keyFeatures")
    .optional()
    .isArray()
    .withMessage("Key features must be an array"),

  body("keyFeatures.*").isString().withMessage("Key feature must be a string"),

  // Dimensions and Weight
  body("dimensions.width")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Width must be a positive number"),

  body("dimensions.height")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Height must be a positive number"),

  body("dimensions.length")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Length must be a positive number"),

  body("dimensions.unit")
    .optional()
    .isIn(["cm", "inch", "m"])
    .withMessage("Invalid dimension unit"),

  body("weight.value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),

  body("weight.unit")
    .optional()
    .isIn(["kg", "g", "lb"])
    .withMessage("Invalid weight unit"),

  // Categories and Organization
  body("category").isMongoId().withMessage("Invalid category ID"),

  // body("variants")
  //   .optional()
  //   .isArray()
  //   .withMessage("Variants must be an array"),

  // body("variants.*")
  //   .isMongoId()
  //   .withMessage("Invalid variant product ID"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "archived"])
    .withMessage("Invalid status value"),

  // Tags
  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*")
    .isString()
    .withMessage("Tag must be a string")
    .trim()
    .isLength({ max: 50 })
    .withMessage("Tag should not exceed 50 characters"),

  // SEO
  body("seo.slug")
    .optional()
    .isString()
    .withMessage("SEO slug must be a string"),
];

export const getAllProductsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),

  query("sortField")
    .optional()
    .isString()
    .withMessage("Sort field must be a string"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be either 'asc' or 'desc'"),

  query("search").optional().isString().withMessage("Search must be a string"),
];
