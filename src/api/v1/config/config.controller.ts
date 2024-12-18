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

export const updateConfigValue = async (req: Request, res: Response) => {
  const key = req.body.key as string;
  const value = req.body.value as string;
  const type = req.query.type as string;
  if (!["business", "system"].includes(type)) {
    return apiResponse(res, 400, "Invalid config type", null);
  }
  const config = updateConfig(type, key, value);
  return apiResponse(res, 200, "Config updated successfully", {
    config,
  });
};
