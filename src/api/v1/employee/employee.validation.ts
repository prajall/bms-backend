import { body } from "express-validator";

export const employeeValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("role").optional().isMongoId().withMessage("Invalid role ID format"),
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  body("image").optional().isString().withMessage("Image url must be a string"),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isString()
    .withMessage("Gender must be a string")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be either male, female, or other"),

  body("address.country")
    .notEmpty()
    .withMessage("Country is required")
    .isString()
    .withMessage("Country must be a string"),

  body("address.province")
    .notEmpty()
    .withMessage("Province is required")
    .isString()
    .withMessage("Province must be a string"),

  body("address.city")
    .notEmpty()
    .withMessage("City is required")
    .isString()
    .withMessage("City must be a string"),

  body("address.addressLine")
    .notEmpty()
    .withMessage("Address line is required")
    .isString()
    .withMessage("Address line must be a string"),

  body("contactNo")
    .notEmpty()
    .withMessage("Contact number is required")
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage("Invalid contact number format"),

  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .isString()
    .withMessage("Department must be a string"),
];

export const updateEmployeeValidation = [
  body("email").optional().isEmail().withMessage("Invalid email format"),

  body("password")
    .optional()
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("role").optional().isMongoId().withMessage("Invalid role ID format"),

  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  body("image").optional().isString().withMessage("Image url must be a string"),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isString()
    .withMessage("Gender must be a string")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be either male, female, or other"),

  body("address.country")
    .notEmpty()
    .withMessage("Country is required")
    .isString()
    .withMessage("Country must be a string"),

  body("address.province")
    .notEmpty()
    .withMessage("Province is required")
    .isString()
    .withMessage("Province must be a string"),

  body("address.city")
    .notEmpty()
    .withMessage("City is required")
    .isString()
    .withMessage("City must be a string"),

  body("address.addressLine")
    .notEmpty()
    .withMessage("Address line is required")
    .isString()
    .withMessage("Address line must be a string"),

  body("contactNo")
    .notEmpty()
    .withMessage("Contact number is required")
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage("Invalid contact number format"),

  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .isString()
    .withMessage("Department must be a string"),
];
