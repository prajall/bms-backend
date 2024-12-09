import * as fs from "fs";
import * as path from "path";

const BUSINESS_CONFIG_PATH = path.join(
  __dirname,
  "../../config/businessConfig.json"
);
const SYSTEM_CONFIG_PATH = path.join(
  __dirname,
  "../../config/systemConfig.json"
);

export const readConfig = (type: string) => {
  try {
    if (type !== "business" && type !== "system") {
      throw new Error(
        `Invalid config type: "${type}". Expected "business" or "system".`
      );
    }

    const configPath =
      type === "business" ? BUSINESS_CONFIG_PATH : SYSTEM_CONFIG_PATH;
    const configData = fs.readFileSync(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    console.error("Error reading config file:", error);
    return null;
  }
};

// This function will also create a new field if it doesn't exist
export const updateConfig = (
  type: string,
  key: string,
  value: any
): boolean => {
  try {
    const config = readConfig(type);
    config[key] = value;

    fs.writeFileSync(
      type === "business" ? BUSINESS_CONFIG_PATH : SYSTEM_CONFIG_PATH,
      JSON.stringify(config, null, 2)
    );
    return true;
  } catch (error) {
    console.error("Error updating config file:", error);
    return false;
  }
};

export const getConfigValue = (type: string, key: string): any => {
  try {
    const config = readConfig(type);

    if (!(key in config)) {
      return null;
    }
    return config[key];
  } catch (error) {
    console.error("Error getting config value:", error);
    return null;
  }
};

console.log(getConfigValue("business", "appName"));
