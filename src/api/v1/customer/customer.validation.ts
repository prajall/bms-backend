import { body } from "express-validator";

export const customerValidation = [
  body("user").optional().isMongoId().withMessage("Invalid user ID format"),

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
    // .notEmpty()
    // .withMessage("Country is required")
    .isString()
    .withMessage("Country must be a string"),

  body("address.province")
    // .notEmpty()
    // .withMessage("Province is required")
    .isString()
    .withMessage("Province must be a string"),

  body("address.city")
    // .notEmpty()
    // .withMessage("City is required")
    .isString()
    .withMessage("City must be a string"),

  body("address.addressLine")
    // .notEmpty()
    // .withMessage("Address line is required")
    .isString()
    .withMessage("Address line must be a string"),

  body("address.houseNo")
    .optional()
    .isString()
    .withMessage("House number must be a string"),

  body("phoneNo")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage("Invalid phone number format"),
];
