import { body } from "express-validator";

export const validateTemplate = [
  body("name").notEmpty().withMessage("Name is required"),

  body("type")
    .notEmpty()
    .withMessage("Template is required")
    .isIn(["email", "sms"])
    .withMessage("Template must be either 'email' or 'sms'"),

  body("body").notEmpty().withMessage("Body is required"),

  body("placeholders").isArray().withMessage("Placeholders must be an array"),
];
