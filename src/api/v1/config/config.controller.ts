import { Request, Response } from "express";
import {
  getConfigValue,
  readConfig,
  updateConfig,
} from "../../../utils/config.utils";
import { apiResponse } from "../../../utils/response.util";

export const getAllConfig = async (req: Request, res: Response) => {
  const type = req.query.type as string;
  if (!["business", "system"].includes(type)) {
    return apiResponse(res, 400, "Invalid config type", null);
  }
  const config = readConfig(type);
  return apiResponse(res, 200, "Config retrieved successfully", {
    config,
  });
};

export const getConfig = async (req: Request, res: Response) => {
  const key = req.body.key as string;
  const type = req.query.type as string;
  if (!["business", "system"].includes(type)) {
    return apiResponse(res, 400, "Invalid config type", null);
  }
  const config = getConfigValue(type, key);
  return apiResponse(res, 200, "Config retrieved successfully", {
    config,
  });
};

const parseBoolean = (value: any): any => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value; // Return the value as is if it's not a boolean string
};

export const updateConfigValue = async (req: Request, res: Response) => {
  console.log(req.body);
  const type = req.query.type as string;

  if (!["business", "system"].includes(type)) {
    return apiResponse(res, 400, "Invalid config type", null);
  }

  const updates = req.body;

  // Recursively parse all boolean strings in the body
  const parseValues = (obj: any): any => {
    if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((key) => {
        obj[key] = parseValues(obj[key]);
      });
      return obj;
    }
    return parseBoolean(obj);
  };

  const parsedUpdates = parseValues(updates);

  if (typeof parsedUpdates !== "object" || Array.isArray(parsedUpdates)) {
    return apiResponse(
      res,
      400,
      "Invalid request body format. Expected an object.",
      null
    );
  }

  const success = updateConfig(type, parsedUpdates);

  if (success) {
    return apiResponse(res, 200, "Config updated successfully", {
      updates: parsedUpdates,
    });
  } else {
    return apiResponse(res, 500, "Failed to update config", null);
  }
};
