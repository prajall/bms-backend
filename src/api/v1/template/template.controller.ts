import { Request, Response } from "express";
import templateModel from "./template.model";
import { apiError, apiResponse } from "../../../utils/response.util";
import mongoose from "mongoose";

const extractPlaceholders = (text: string) => {
  const regex = /{{(.*?)}}/g;
  const matches = text.match(regex);
  return matches
    ? matches.map((match) => match.replace(/{{|}}/g, "").trim())
    : [];
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log("Id", id);

    if (!id || !mongoose.isValidObjectId(id)) {
      return apiError(res, 400, "Invalid Template Id format");
    }

    const { subject, body } = req.body;

    const existingTemplate = await templateModel.findById(id);
    if (!existingTemplate) {
      return apiError(res, 404, "existingTemplate not found");
    }

    const placeholders = existingTemplate.placeholders;

    const extractedPlaceholders = extractPlaceholders(body);

    const invalidPlaceholders = extractedPlaceholders.filter(
      (ph) => !placeholders.includes(ph)
    );

    if (invalidPlaceholders.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some placeholders are invalid",
        invalidPlaceholders,
      });
    }

    let template = await templateModel.findByIdAndUpdate(
      id,
      { subject, body },
      { new: true, upsert: true }
    );

    if (!template) {
      return apiError(res, 404, "Template with this name and type not found");
    }

    return apiResponse(res, 200, "Template updated successfully", template);
  } catch (error: any) {
    console.error("Error creating/updating template:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, type, subject, body, placeholders } = req.body;

    if (!name || !type || !body || !placeholders) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const extractedPlaceholders = extractPlaceholders(body);

    const invalidPlaceholders = extractedPlaceholders.filter(
      (ph) => !placeholders.includes(ph)
    );

    if (invalidPlaceholders.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some placeholders are invalid",
        invalidPlaceholders,
      });
    }

    const templateExist = await templateModel.findOne({ name, type });
    if (templateExist) {
      return apiError(
        res,
        409,
        "Template with this name and type already exists"
      );
    }
    let template = await templateModel.create({
      name,
      subject,
      type,
      body,
      placeholders,
    });

    if (!template) {
      return apiError(res, 404, "Template with this name and type not found");
    }

    return apiResponse(res, 200, "Template updated successfully", template);
  } catch (error: any) {
    console.error("Error creating/updating template:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllTemplate = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let filter: { type?: string } = {};
    if (type) {
      filter.type = type.toString();
    }
    const templates = await templateModel.find();
    return apiResponse(res, 200, "Templates retrieved successfully", templates);
  } catch (error: any) {
    console.error("Error fetching templates:", error.message);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;

    if (!id || !mongoose.isValidObjectId(id)) {
      return apiError(res, 400, "Invalid Template Id format");
    }
    const template = await templateModel.findById(id);
    if (!template) {
      return apiError(res, 404, "Template not found");
    }

    return res.status(200).json({ success: true, template });
  } catch (error: any) {
    console.error("Error fetching template:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await templateModel.findByIdAndDelete(id);
    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Template deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting template:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
