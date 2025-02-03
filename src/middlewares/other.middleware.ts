import { NextFunction, Request, Response } from "express";
import { apiError } from "../utils/response.util";
import { getConfigValue } from "../utils/config.utils";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/cloudinary.util";

export const checkMaintenanceMode = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const maintenanceMode = getConfigValue("system", "maintenanceMode");

  if (maintenanceMode && maintenanceMode.enable) {
    return apiError(
      res,
      503,
      maintenanceMode.message || "Service is under maintenance"
    );
  }
  next();
};

export const processBaseImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || !(req.files as Express.Multer.File[]).length) {
      return next(); // No files uploaded, move to next middleware
    }

    const files = req.files as Express.Multer.File[];

    // Pick the first uploaded image
    const firstImage = files[0];
    const originalFilePath = firstImage.path;
    const fileName = path.parse(firstImage.filename).name;

    const tempDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Define different sizes
    const sizes = {
      small: 100, // width
      medium: 300,
      large: 600,
    };

    const compressedImages: Record<string, string> = {};

    // Process and upload images
    for (const [size, width] of Object.entries(sizes)) {
      const outputFilePath = path.join(tempDir, `${fileName}-${size}.webp`);

      const image =await sharp(originalFilePath)
        .resize({ width: Number(width) })
        .toFormat("webp")
        .toFile(outputFilePath);

        console.log("compressed Image;",image,)
      // Upload to Cloudinary
      const uploadedImage = await uploadOnCloudinary(outputFilePath);
      if (uploadedImage) {
        compressedImages[size] = uploadedImage.url;
      }

      // Remove the temporary local file
      fs.unlinkSync(outputFilePath);
    }

    // Attach compressed image URLs to req.body
    req.body.baseImage = compressedImages;

    // Proceed to next middleware
    next();
  } catch (error) {
    console.error("Error processing and uploading images:", error);
    return res.status(500).json({ error: "Image processing failed" });
  }
};