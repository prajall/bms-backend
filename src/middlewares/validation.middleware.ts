import { validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
import { apiError } from "../utils/response.util";

// Handle validation error from previous middleware.
export const handleValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiError(
      res,
      400,
      "Validation Error. Please check your inputs",
      errors.array()
    );
  }
  next();
};
