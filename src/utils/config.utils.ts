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

const deepMerge = (target: any, source: any): any => {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  console.log("target", target);
  return target;
};

const setNestedValue = (obj: any, path: string, value: any): void => {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof current[keys[i]] !== "object" || current[keys[i]] === null) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  // Deep merge if value is an object, otherwise directly set
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    current[keys[keys.length - 1]] = deepMerge(
      current[keys[keys.length - 1]] || {},
      value
    );
  } else {
    current[keys[keys.length - 1]] = value;
  }
};
export const updateConfig = (
  type: string,
  updates: Record<string, any>
): boolean => {
  try {
    const config = readConfig(type);

    // Apply updates to the config
    Object.entries(updates).forEach(([key, value]) => {
      setNestedValue(config, key, value);
    });

    // Save the updated config
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
