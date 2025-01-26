import { NextFunction, Request, Response } from "express";
import { apiError } from "../utils/response.util";
import { getConfigValue } from "../utils/config.utils";

export const checkMaintenanceMode = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const maintenanceMode = getConfigValue("system", "maintenanceMode");
  console.log("Maintenance Mode: ", maintenanceMode);

  if (maintenanceMode && maintenanceMode.enable) {
    return apiError(
      res,
      503,
      maintenanceMode.message || "Service is under maintenance"
    );
  }
  next();
};
