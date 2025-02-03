import { Request, Response } from "express";
import Product from "./product.model";
import { apiResponse, apiError } from "../../../../utils/response.util";
import mongoose from "mongoose";

export const createProduct = async (req: Request, res: Response) => {
  try {
    console.log("base Images:",req.body.baseImage)
    const user = req.user
    const existingProduct = await Product.findOne({
      $or: [
        { serialNo: req.body.serialNo },
        { "seo.slug": req.body.seo?.slug },
      ],
    });

    console.log("SEO: ",req.body.seo)

    if (existingProduct) {
      console.log(existingProduct)
      const isDuplicateSerial = existingProduct.serialNo === req.body.serialNo;
      const isDuplicateSlug = existingProduct.seo?.slug === req.body.seo?.slug;

      if (isDuplicateSerial && isDuplicateSlug) {
        return apiError(
          res,
          400,
          "A product with this serial number and SEO slug already exists"
        );
      } else if (isDuplicateSerial && existingProduct.serialNo) {
        return apiError(
          res,
          400,
          "A product with this serial number already exists"
        );
      } else if (isDuplicateSlug && existingProduct.seo?.slug  ) {
        console.log("duplicate slug",existingProduct.seo?.slug)
        return apiError(
          res,
          400,
          "A product with this SEO slug already exists"
        );
      }
    }

    // Create the new product
    const product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      sku: req.body.sku,
      costPrice: req.body.costPrice,
      sellingPrice: req.body.sellingPrice,
      discount: req.body.discount,
      category: req.body.category,
      images: req.body.images,
      stock: req.body.stock,
      status: req.body.status,
      tags: req.body.tags,
      brand: req.body.brand,
      modelNo: req.body.modelNo,
      serialNo: req.body.serialNo,
      condition: req.body.condition,
      manufactureDate: req.body.manufactureDate,
      warranty: req.body.warranty,
      baseImage: req.body.baseImage,
      keyFeatures: req.body.keyFeatures,
      minimumOrderQuantity: req.body.minimumOrderQuantity,
      dimensions: req.body.dimensions,
      weight: req.body.weight,
      seo: req.body.seo,
      createdBy: user._id,
    });

    if (!product) {
      return apiError(res, 500, "Failed to create product");
    }

    return apiResponse(res, 201, "Product created successfully", product);
  } catch (error) {
    console.error("Create product error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
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
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .populate({
        path: "category",
        select: "name description",
        strictPopulate: false,
      })
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    return apiResponse(res, 200, "Products retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
      },
      products,
    });
  } catch (error) {
    console.error("Get all products error:", error);
    return apiError(res, 500, "Failed to fetch products", error);
  }
};

export const getProductsMiniList = async (req: Request, res: Response) => {
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
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .select("name category modelNo sellingPrice baseImage")
      .populate("category", "name")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    return apiResponse(res, 200, "Products retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
      },
      products,
    });
  } catch (error) {
    console.error("Get all products error:", error);
    return apiError(res, 500, "Failed to fetch products", error);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid product ID format");
    }

    const product = await Product.findById(id)
      .populate({ path: "category", strictPopulate: false })
      .populate({ path: "createdBy", strictPopulate: false })
      .lean();

    if (!product) {
      return apiError(res, 404, "Product not found");
    }

    return apiResponse(res, 200, "Product retrieved successfully", {
      product,
      meta: {
        lastFetched: new Date().toISOString(),
        version: "1.0",
      },
    });
  } catch (error: any) {
    console.error("Get product by ID error:", error.message);
    return apiError(
      res,
      500,
      "An error occurred while fetching the product",
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid product ID format");
    }

    const existingProduct = await Product.findOne({ _id: id });

    if (!existingProduct) {
      return apiError(res, 404, "Product not found or unauthorized");
    }

    const duplicateSerialOrSEO = await Product.findOne({
      $or: [
        { serialNo: req.body.serialNo },
        { "seo.slug": req.body.seo?.slug },
      ],
    });

    if (duplicateSerialOrSEO && duplicateSerialOrSEO._id.toString() !== id) {
      const isDuplicateSerial =
        duplicateSerialOrSEO.serialNo === req.body.serialNo;
      const isDuplicateSlug =
        duplicateSerialOrSEO.seo?.slug === req.body.seo?.slug;

      if (isDuplicateSerial && isDuplicateSlug) {
        return apiError(
          res,
          400,
          "A product with this serial number and SEO slug already exists"
        );
      } else if (isDuplicateSerial) {
        return apiError(
          res,
          400,
          "A product with this serial number already exists"
        );
      } else {
        return apiError(
          res,
          400,
          "A product with this SEO slug already exists"
        );
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        description: req.body.description,
        sku: req.body.sku,
        costPrice: req.body.costPrice,
        sellingPrice: req.body.sellingPrice,
        discount: req.body.discount,
        category: req.body.category,
        images: req.body.images,
        stock: req.body.stock,
        status: req.body.status,
        tags: req.body.tags,
        brand: req.body.brand,
        modelNo: req.body.modelNo,
        serialNo: req.body.serialNo,
        condition: req.body.condition,
        manufactureDate: req.body.manufactureDate,
        warranty: req.body.warranty,
        baseImage: req.body.baseImage,
        keyFeatures: req.body.keyFeatures,
        minimumOrderQuantity: req.body.minimumOrderQuantity,
        dimensions: req.body.dimensions,
        weight: req.body.weight,
        variants: req.body.variants,
        seo: req.body.seo,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "category",
      select: "name description",
      strictPopulate: false,
    });

    if (!updatedProduct) {
      return apiError(res, 404, "Product not found");
    }

    return apiResponse(
      res,
      200,
      "Product updated successfully",
      updatedProduct
    );
  } catch (error) {
    console.error("Update product error:", error);
    return apiError(
      res,
      500,
      "Failed to update product",
      process.env.NODE_ENV === "development" ? error : undefined
    );
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Id is not valid mongo id");
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return apiError(res, 404, "Product not found");
    }

    return apiResponse(res, 200, "Product deleted successfully");
  } catch (error) {
    console.error("Delete product error:", error);
    return apiError(res, 500, "Failed to delete product");
  }
};
