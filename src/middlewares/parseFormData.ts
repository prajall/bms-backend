import { Request, Response, NextFunction } from "express";
import { apiError } from "../utils/response.util";

const reconstructNestedObject = (
  data: Record<string, any>
): Record<string, any> => {
  const result: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (key.includes(".")) {
      const keys = key.split(".");
      keys.reduce((acc, curr, index) => {
        if (index === keys.length - 1) {
          acc[curr] = data[key];
        } else {
          acc[curr] = acc[curr] || {};
        }
        return acc[curr];
      }, result);
    } else {
      result[key] = data[key];
    }
  });
  return result;
};

const parseNestedFields = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === "object") {
    req.body = reconstructNestedObject(req.body);

    Object.keys(req.body).forEach((key) => {
      try {
        if (
          typeof req.body[key] === "string" &&
          req.body[key].startsWith("{")
        ) {
          req.body[key] = JSON.parse(req.body[key]);
        } else if (
          typeof req.body[key] === "string" &&
          req.body[key].startsWith("[")
        ) {
          req.body[key] = JSON.parse(req.body[key]);
        }
      } catch (error: any) {
        apiError(
          res,
          500,
          `Failed to parse JSON for key: ${key}`,
          error.message
        );
        return;
      }
    });
  }
  next();
};

export default parseNestedFields;
