import { NextFunction, Request, Response, Router } from "express";
import {
  getAllConfig,
  getConfig,
  updateConfigValue,
} from "./config.controller";
import { apiResponse } from "../../../utils/response.util";
import { checkPermission } from "../../../middlewares/permissions.middleware";

const router = Router();

// middleware to check if type is valid
const checkType = (req: Request, res: Response, next: NextFunction) => {
  const type = req.query.type as string;
  if (!type) {
    return apiResponse(res, 400, "Config Type is required ", null);
  }
  if (!["business", "system"].includes(type)) {
    return apiResponse(
      res,
      400,
      "Invalid config type. Expected 'business' or 'system'.",
      null
    );
  }
  next();
};

router.get("/", checkPermission("config", "view"), checkType, getConfig);
router.get("/all", checkPermission("config", "view"), checkType, getAllConfig);
router.put(
  "/",
  checkPermission("config", "update"),
  checkType,
  updateConfigValue
); // pass key, value, type in query

export default router;
