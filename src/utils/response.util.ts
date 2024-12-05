import { Response } from "express";

export const apiResponse = (
  res: Response,
  statusCode: number,
  message = "",
  data: any = {}
) => {
  res.status(statusCode).json({ success: true, message, data });
};

export const apiError = (
  res: Response,
  statusCode: number,
  message: string,
  error: any = null
) => {
  if (error) {
    console.error(error);
    // logger(error.message);
  }

  const errorMessage = Array.isArray(error)
    ? error
    : error instanceof Error
    ? error.message
    : String(error);

  res.status(statusCode).json({
    success: false,
    message,
    error: errorMessage || "An unknown error occurred",
  });
};
