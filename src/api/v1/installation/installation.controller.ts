import { Request, Response } from "express";
import fs from "fs";
import {
  addEnvToVercel,
  writeConfigData,
  writeEnvToFile,
} from "./installation.functions";
import { apiError, apiResponse } from "../../../utils/response.util";

// export const addEnv = async (req: Request, res: Response) => {
//   const { dbUri, apiToken } = req.body;

//   try {
//     if (!dbUri || !apiToken) {
//       return res.status(400).send("dbUri and apiToken are required");
//     }

//     const response1 = await addEnvToVercel("DATABASE_URI", dbUri);
//     const response2 = await addEnvToVercel("API_TOKEN", apiToken);

//     if (response1 && response2) {
//       res
//         .status(200)
//         .json({ message: "Environment Variables Set Successfully" });
//     } else {
//       res.status(500).send("Failed to set environment variables.");
//     }
//   } catch (error: any) {
//     res.status(500).send("Error during setup: " + error.message);
//   }
// };

// Add Configuration for the app like appname, theme, setupComplete, etc
export const addConfigData = async (req: Request, res: Response) => {
  const configDatas = req.body;

  try {
    if (!configDatas) {
      return apiError(res, 400, "configData is required");
    }
    const result = await writeConfigData(configDatas);
    if (result) {
      return apiResponse(
        res,
        200,
        "Setup configuration has been updated successfully."
      );
    } else {
      return apiError(res, 500, "Failed to update setup configuration.");
    }
  } catch (error: any) {
    return apiError(res, 500, `Error during setup: ${error.message}`);
  }
};

// Add the env variables for configuration
export const updateEnvData = async (req: Request, res: Response) => {
  const envData = req.body;
  console.log(envData);

  try {
    const result = await writeEnvToFile(envData);

    if (result) {
      return apiResponse(
        res,
        200,
        "Environment variables have been updated successfully."
      );
    } else {
      return apiError(res, 500, "Failed to update environment variables.");
    }
  } catch (error: any) {
    return apiError(
      res,
      500,
      `Error during environment update: ${error.message}`
    );
  }
};

export const completeInstallation = async (req: Request, res: Response) => {
  const envFilePath = ".env";
  try {
    if (!fs.existsSync(envFilePath)) {
      console.log(".env file does not exist.");
      return apiError(res, 404, "env file not found");
    }

    const envFileContent = fs.readFileSync(envFilePath, "utf8");
    const envVariables: Record<string, string> = {};

    envFileContent.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        envVariables[key.trim()] = value.trim();
      }
    });

    for (const [key, value] of Object.entries(envVariables)) {
      const success = await addEnvToVercel(key, value);
      if (!success) {
        console.log(`Failed to add environment variable ${key} to Vercel.`);
        return apiError(res, 500, "Failed to post Env");
      }
    }
    const installationCompleteData = {
      setupComplete: true,
    };
    try {
      writeConfigData(installationCompleteData);
    } catch (error: any) {
      console.log(error);
      return apiError(res, 500, "Failed to Set completion flag");
    }
    return apiResponse(res, 200, "Installation Completed");
  } catch (error) {
    console.error("Error reading .env file or posting to Vercel:", error);
    return apiError(res, 500, "Internal server error");
  }
};

export const checkConfig = async (req: Request, res: Response) => {
  const configPath = "config.json";

  if (fs.existsSync(configPath)) {
    try {
      const configData = fs.readFileSync(configPath, "utf8");

      // Check if the file is empty
      if (configData.trim() === "") {
        console.log("config.json is empty");
        return apiResponse(res, 200, "Setup not configured");
      }

      const config = JSON.parse(configData);

      if (config.setupComplete) {
        return apiResponse(res, 200, "Setup configured", {
          setupComplete: true,
        });
      } else {
        return apiResponse(res, 200, "Setup not configured", {
          setupComplete: false,
        });
      }
    } catch (err) {
      console.error("Error reading or parsing config file:", err);
      return apiError(res, 500, "Error reading or parsing config file");
    }
  } else {
    console.log("config.json not found");
    return apiError(res, 404, "config.json not found");
  }
};
export const configured = async (req: Request, res: Response) => {
  return apiResponse(res, 200, "configured");
};
