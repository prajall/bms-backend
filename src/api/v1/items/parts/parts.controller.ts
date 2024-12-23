import { Request, Response } from "express";
import Part from "./parts.model";
import { apiResponse, apiError } from "../../../../utils/response.util";
import mongoose from "mongoose";

export const createPart = async (req: Request, res: Response) => {
  try {
    const employee = req.employee;

    const existingPart = await Part.findOne({ serialNo: req.body.serialNo });

    if (existingPart) {
      return apiError(
        res,
        400,
        "A part with this serial number already exists"
      );
    }

    const part = await Part.create({
      name: req.body.name,
      description: req.body.description,
      brand: req.body.brand,
      discount: req.body.discount,
      baseImage: req.body.baseImage,
      costPrice: req.body.costPrice,
      sellingPrice: req.body.sellingPrice,
      stock: req.body.stock,
      tags: req.body.tags,
      modelNo: req.body.modelNo,
      serialNo: req.body.serialNo,
      status: req.body.status,
      createdBy: employee._id,
    });

    if (!part) {
      return apiError(res, 500, "Failed to create part");
    }

    return apiResponse(res, 201, "Part created successfully", part);
  } catch (error) {
    console.error("Create part error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

// Get All Parts
export const getAllParts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortField as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
    const search = req.query.search as string;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { modelNo: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const totalParts = await Part.countDocuments(query);
    const totalPages = Math.ceil(totalParts / limit);

    const parts = await Part.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    return apiResponse(res, 200, "Parts retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages,
        totalParts,
        limit,
      },
      parts,
    });
  } catch (error) {
    console.error("Get all parts error:", error);
    return apiError(res, 500, "Failed to fetch parts", error);
  }
};
export const getPartsMiniList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortField as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
    const search = req.query.search as string;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { modelNo: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const totalParts = await Part.countDocuments(query);
    const totalPages = Math.ceil(totalParts / limit);

    const parts = await Part.find(query)
      .select("name modelNo sellingPrice baseImage")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    return apiResponse(res, 200, "Parts retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages,
        totalParts,
        limit,
      },
      parts,
    });
  } catch (error) {
    console.error("Get all parts error:", error);
    return apiError(res, 500, "Failed to fetch parts", error);
  }
};
// Get Part by ID
export const getPartById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid part ID format");
    }

    const part = await Part.findById(id).lean();

    if (!part) {
      return apiError(res, 404, "Part not found");
    }

    return apiResponse(res, 200, "Part retrieved successfully", part);
  } catch (error: any) {
    console.error("Get part by ID error:", error.message);
    return apiError(res, 500, "Error occurred while fetching the part", error);
  }
};

// Update Part
export const updatePart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = req.employee;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid part ID format");
    }

    const existingPart = await Part.findOne({ _id: id });

    if (!existingPart) {
      return apiError(res, 404, "Part not found");
    }

    const duplicateSerial = await Part.findOne({ serialNo: req.body.serialNo });

    if (duplicateSerial && duplicateSerial._id.toString() !== id) {
      return apiError(
        res,
        400,
        "A part with this serial number already exists"
      );
    }

    const updatedPart = await Part.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        description: req.body.description,
        brand: req.body.brand,
        discount: req.body.discount,
        baseImage: req.body.baseImage,
        costPrice: req.body.costPrice,
        sellingPrice: req.body.sellingPrice,
        stock: req.body.stock,
        tags: req.body.tags,
        modelNo: req.body.modelNo,
        serialNo: req.body.serialNo,
        status: req.body.status,
        updatedBy: employee._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPart) {
      return apiError(res, 404, "Part not found");
    }

    return apiResponse(res, 200, "Part updated successfully", updatedPart);
  } catch (error) {
    console.error("Update part error:", error);
    return apiError(res, 500, "Failed to update part", error);
  }
};

// Delete Part
export const deletePart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Id is not valid mongo id");
    }

    const part = await Part.findByIdAndDelete(id);
    if (!part) {
      return apiError(res, 404, "Part not found");
    }

    return apiResponse(res, 200, "Part deleted successfully");
  } catch (error) {
    console.error("Delete part error:", error);
    return apiError(res, 500, "Failed to delete part");
  }
};
