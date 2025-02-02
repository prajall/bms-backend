import { Request, Response } from "express";
import Category from "./category.model";
import { apiResponse, apiError } from "../../../../utils/response.util";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../../../../utils/cloudinary.util";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const image = req.file;
    console.log(image);

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    }); //for case insensitive
    if (existingCategory) {
      return apiError(res, 409, "Category with this name already exists");
    }

    let imageUrl = "";
    if (image && image.size > 500000) {
      return apiError(res, 400, "Image size should be less than 500KB");
    }
    if (image) {
      const response = await uploadOnCloudinary(image.path);
      console.log("Cloudinary response:", response);
      if (response) {
        imageUrl = response.secure_url;
      }
    }
    const category = await Category.create({
      name,
      description,
      image: imageUrl,
    });
    if (!category) {
      return apiError(res, 500, "Failed to create category");
    }

    return apiResponse(res, 201, "Category created successfully",category);
  } catch (error) {
    console.error("Create category error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });

    return apiResponse(res, 200, "Categories retrieved successfully", {
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get all categories error:", error);
    return apiError(res, 500, "Failed to fetch categories");
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return apiError(res, 400, "Category ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Id is not valid mongo id");
    }

    const category = await Category.findById(id);
    if (!category) {
      return apiError(res, 404, "Category not found");
    }

    return apiResponse(res, 200, "Category retrieved successfully", category);
  } catch (error) {
    console.error("Get category by ID error:", error);
    return apiError(res, 500, "Failed to fetch category");
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Id is not valid mongo id");
    }

    if (name) {
      const existingCategory = await Category.findOne({
        name,
        _id: { $ne: id },
      });
      if (existingCategory) {
        return apiError(res, 409, "Category with this name already exists");
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description,
        images,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return apiError(res, 404, "Category not found");
    }

    return apiResponse(res, 200, "Category updated successfully", category);
  } catch (error) {
    console.error("Update category error:", error);
    return apiError(res, 500, "Failed to update category");
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Id is not valid mongo id");
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return apiError(res, 404, "Category not found");
    }

    return apiResponse(res, 200, "Category deleted successfully");
  } catch (error) {
    console.error("Delete category error:", error);
    return apiError(res, 500, "Failed to delete category");
  }
};
