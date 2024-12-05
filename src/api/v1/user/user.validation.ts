import { body, param } from "express-validator";

export const validateSignupUser = [
  body("email").isEmail().notEmpty().withMessage("Invalid Email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const validateGetUserById = [
  param("_id")
    .notEmpty()
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

export const validateUpdateUser = [
  body("email").optional().isEmail().withMessage("Email must be valid"),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

export const validateLoginUser = [
  body("email").isEmail().notEmpty().withMessage("Email is required"),
  body("password")
    .notEmpty()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

export const validateDeleteUser = [
  param("userId")
    .notEmpty()
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];
