import express from "express";
import {
  // addEnv,
  addConfigData,
  updateEnvData,
  checkConfig,
  completeInstallation,
} from "./installation.controller";

import { apiResponse } from "../../../utils/response.util";

const router = express.Router();

// router.post("/add-env", addEnv);
// router.post("/post-env", postEnvFileToVercel);
router.post("/add-config", addConfigData);
router.post("/add-env", updateEnvData);
router.get("/check-config", checkConfig);
router.post("/finish-installation", completeInstallation);
router.get("/", (req, res) => {
  return apiResponse(res, 200, "Installation route is working");
});

export default router;
