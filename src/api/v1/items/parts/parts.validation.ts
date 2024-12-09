import { body, param, query } from "express-validator";
import mongoose from "mongoose";

// Validate data for creating and updating a part
export const validatePart = [
  body("name")
    .notEmpty()
    .withMessage("Part name is required")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Part name should not exceed 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("brand").notEmpty().withMessage("Brand name is required"),
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

  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock cannot be negative"),

  body("modelNo").notEmpty().withMessage("Model number is required").trim(),

  body("serialNo").optional().trim(),

  body("baseImage")
    .optional()
    .isObject()
    .withMessage("Base image must be an object containing image URLs"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings"),

  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be a number between 0 and 100"),

  body("seo").optional().isObject().withMessage("SEO data must be an object"),

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
    .withMessage("Sort order must be 'asc' or 'desc'"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search term must be a string"),
];

// Validate if part ID is valid
export const validatePartId = [
  param("id")
    .notEmpty()
    .withMessage("Part ID is required")
    .isMongoId()
    .withMessage("Invalid part ID format"),
];

// Validate query params for listing parts
export const validatePartQueryParams = [
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
    .withMessage("Sort order must be 'asc' or 'desc'"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search term must be a string"),
];
