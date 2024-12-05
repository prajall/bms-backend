import axios from "axios";
import fs from "fs";
import path from "path";

const VERCEL_API_URL = "https://api.vercel.com/v9/projects";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "5ArwTDnPQyr9QOZiX6ncAQ0h";
const PROJECT_ID =
  process.env.VERCEL_PROJECT_ID || "prj_xcjfXyNTKTzzwzLtJuDXEmjgMA0A";

export const addEnvToVercel = async (key: String, value: String) => {
  try {
    const response = await axios.post(
      `${VERCEL_API_URL}/${PROJECT_ID}/env`,
      {
        key: key,
        value: value,
        target: ["production", "preview", "development"],
        type: "plain",
      },
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
    return true;
  } catch (error: any) {
    console.log(error.message ? error.message : error);
    console.error("Error data:", error.response?.data);

    if (error.response?.data?.error?.code === "ENV_ALREADY_EXISTS") {
      return true;
    }
    return false;
  }
};

export const writeConfigData = (datas: any): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const configFilePath = "config.json";
    let setupData: any = {};

    try {
      // Check if the config.json file exists
      if (fs.existsSync(configFilePath)) {
        const existingData = fs.readFileSync(configFilePath, "utf8");
        setupData = JSON.parse(existingData);
      }

      Object.keys(datas).forEach((key) => {
        setupData[key] = datas[key];
      });
    } catch (err) {
      console.error("Error reading or parsing config.json:", err);
      reject(false);
      return;
    }

    const jsonData = JSON.stringify(setupData, null, 2);

    // Write the updated data to config.json file
    fs.writeFile(configFilePath, jsonData, (err) => {
      if (err) {
        console.error("Error writing to config.json:", err);
        reject(false);
      } else {
        console.log("config.json has been updated successfully.");
        resolve(true);
      }
    });
  });
};

export const writeEnvToFile = async (
  envData: Record<string, string>
): Promise<boolean> => {
  const envFilePath = ".env";

  try {
    let currentEnvData: Record<string, string> = {};

    // Check if the .env file exists
    if (fs.existsSync(envFilePath)) {
      // Read the existing .env file
      const existingEnvData = fs.readFileSync(envFilePath, "utf8");
      existingEnvData.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          currentEnvData[key.trim()] = value.trim();
        }
      });
    }

    // Update or add new env variables
    Object.keys(envData).forEach((key) => {
      currentEnvData[key] = envData[key];
    });

    // Convert updated data to string format
    const updatedEnvData = Object.entries(currentEnvData)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Write to the .env file
    fs.writeFileSync(envFilePath, updatedEnvData, "utf8");
    console.log(".env file has been updated successfully.");
    return true;
  } catch (err) {
    console.error("Error reading or writing to .env file:", err);
    return false;
  }
};
