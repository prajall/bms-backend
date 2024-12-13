import { Request, Response } from "express";
import Service from "./service.model";
import { apiResponse, apiError } from "../../../../utils/response.util";

export const createService = async (req: Request, res: Response) => {
  try {
    const service = await Service.create({
      title: req.body.title,
      serviceType: req.body.serviceType,
      products: req.body.products,
      parts: req.body.parts,
      workDetail: req.body.workDetail,
      isRecurring: req.body.isRecurring,
      interval: req.body.interval,
      serviceCharge: req.body.serviceCharge,
      additionalNotes: req.body.additionalNotes,
      availability: req.body.availability,
      serviceProvided: req.body.serviceProvided,
    });

    if (!service) {
      return apiError(res, 500, "Failed to create service");
    }

    return apiResponse(res, 201, "Service created successfully", service);
  } catch (error) {
    console.error("Create service error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const services = await Service.find()
      .skip(skip)
      .limit(limit)
      .populate({
        path: "products",
        select: "name description brand baseImage sellingPrice",
      })
      .populate({
        path: "parts",
        select: "name description baseImage sellingPrice",
      });

    const totalServices = await Service.countDocuments();

    if (!services || services.length === 0) {
      return apiResponse(res, 404, "No services found");
    }

    const totalPages = Math.ceil(totalServices / limit);

    return apiResponse(res, 200, "Services retrieved successfully", {
      services,
      currentPage: page,
      totalPages,
      totalServices,
    });
  } catch (error) {
    console.error("Get all services error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id).populate("products");

    if (!service) {
      return apiError(res, 404, "Service not found");
    }

    return apiResponse(res, 200, "Service retrieved successfully", service);
  } catch (error) {
    console.error("Get service by ID error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        serviceType: req.body.serviceType,
        products: req.body.products,
        workDetail: req.body.workDetail,
        isRecurring: req.body.isRecurring,
        interval: req.body.interval,
        serviceCharge: req.body.serviceCharge,
        additionalNotes: req.body.additionalNotes,
        availability: req.body.availability,
        serviceProvided: req.body.serviceProvided,
      },
      { new: true }
    );

    if (!updatedService) {
      return apiError(res, 404, "Service not found or failed to update");
    }

    return apiResponse(
      res,
      200,
      "Service updated successfully",
      updatedService
    );
  } catch (error) {
    console.error("Update service error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);

    if (!deletedService) {
      return apiError(res, 404, "Service not found or failed to delete");
    }

    return apiResponse(res, 200, "Service deleted successfully");
  } catch (error) {
    console.error("Delete service error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};
