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

export const uploadSingleImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next(); // No file uploaded, move to next middleware
    }

    const imageFile = req.file;
    const originalFilePath = imageFile.path; // Path of uploaded file
    const fileName = path.parse(imageFile.filename).name;

    const tempDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // ✅ Use a different file for output
    const outputFilePath = path.join(tempDir, `${fileName}-processed.webp`);

    await sharp(originalFilePath)
      .resize({ width: 600 }) // Resize to 600px width
      .toFormat("webp")
      .toFile(outputFilePath); // Save to a new file

    // ✅ Upload processed image to Cloudinary
    const uploadedImage = await uploadOnCloudinary(outputFilePath);
    if (uploadedImage) {
      req.body.image = uploadedImage.url; // Store the image URL in req.body.image
    }

    // ✅ Remove temporary files
    try {
      fs.unlinkSync(outputFilePath);
      fs.unlinkSync(originalFilePath);
    } catch (error) {
      console.error("Error removing temporary files:", error);
    }

    next(); // Proceed to next middleware
  } catch (error) {
    console.error("Error processing and uploading image:", error);
    return res.status(500).json({ error: "Image processing failed" });
  }
};

export const processBaseImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let files: Express.Multer.File[] = [];
    // Check if single file upload (upload.single)
    if (req.file) {
      files = [req.file]; // Convert single file to array
    }
    // Check if multiple files upload (upload.array)
    else if (req.files && Array.isArray(req.files)) {
      files = req.files as Express.Multer.File[];
    }

    if (!files.length) {
      return next(); // No files uploaded, move to next middleware
    }

    let oldImages: Record<string, string> = {};
    if (req.body.images) {
      try {
        oldImages = JSON.parse(req.body.images); // Convert string to object if needed
      } catch (error) {
        console.warn("Invalid image data format in request body");
      }
    }

    const compressedImages: Record<string, string> = { ...oldImages }; // Retain old images

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

    // Process and upload images
    for (const [size, width] of Object.entries(sizes)) {
      const outputFilePath = path.join(tempDir, `${fileName}-${size}.webp`);

      const image = await sharp(originalFilePath)
        .resize({ width: Number(width) })
        .toFormat("webp")
        .toFile(outputFilePath);

      console.log("compressed Image;", image);
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
