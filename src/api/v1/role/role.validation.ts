import { body } from "express-validator";

export const createRoleValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  // body("permissions").isArray().withMessage("Permissions should be an array"),
  body("permissions.*.module")
    .notEmpty()
    .withMessage("Each permission must have a module"),
  body("permissions.*.actions")
    .isArray({ min: 1 })
    .withMessage("Each permission must have an array of actions"),
];

export const updateRoleValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  // body("permissions").isArray().withMessage("Permissions should be an array"),
  body("permissions.*.module")
    .notEmpty()
    .withMessage("Each permission must have a module"),
  body("permissions.*.actions")
    .isArray({ min: 1 })
    .withMessage("Each permission must have an array of actions"),
];
