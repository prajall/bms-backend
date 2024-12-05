import { apiError, apiResponse } from "../../../../utils/response.util";
import ServiceProvided from "./serviceProvided.model";
import Parts from "../../items/parts/parts.model";
import Billing from "../serviceBilling/serviceBilling.model";

import { Request, Response } from "express";

export const createServiceProvided = async (req: Request, res: Response) => {
  try {
    const serviceProvided = await ServiceProvided.create({
      serviceId: req.body.serviceId,
      serviceOrderId: req.body.serviceOrderId,
      title: req.body.title,
      date: req.body.date,
      serviceCharge: req.body.serviceCharge,
      products: req.body.products,
      parts: req.body.parts,
      workDetail: req.body.workDetail,
      additionalNotes: req.body.additionalNotes,
      billing: req.body.billing,
    });

    if (!serviceProvided) {
      return apiError(res, 500, "Failed to create service provided");
    }

    return apiResponse(
      res,
      201,
      "Service provided created successfully",
      serviceProvided
    );
  } catch (error: any) {
    console.error("Error creating service provided:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getAllServiceProvided = async (req: Request, res: Response) => {
  try {
    const { serviceOrderId, serviceId } = req.body;

    const query: any = {};

    if (serviceOrderId) {
      query.serviceOrderId = serviceOrderId;
    }

    if (serviceId) {
      query.serviceId = serviceId;
    }

    const servicesProvided = await ServiceProvided.find(query)
      .populate({ path: "serviceId", select: "title serviceType" })
      .populate({ path: "serviceOrderId" })
      .populate({ path: "products", select: "name brand" })
      .populate({ path: "parts", model: Parts })
      .populate({ path: "billing", model: Billing })
      .sort({ date: -1 });

    if (!servicesProvided || servicesProvided.length === 0) {
      return apiResponse(res, 404, "No services provided found");
    }

    return apiResponse(
      res,
      200,
      "Services provided retrieved successfully",
      servicesProvided
    );
  } catch (error: any) {
    console.error("Error retrieving services provided:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getServiceProvidedById = async (req: Request, res: Response) => {
  try {
    const serviceProvided = await ServiceProvided.findById(req.params.id)
      .populate({
        path: "serviceId",
        populate: {
          path: "products",
          select:
            "-dimensions -weight -seo -user -costPrice -minimumOrderQuantity",
        },
      })
      .populate({ path: "serviceOrderId" })
      .populate({ path: "products", select: "-createdAt -updatedAt" })
      .populate({ path: "parts", select: "-createdAt -updatedAt" })
      .populate({ path: "billing", select: "-createdAt -updatedAt" });

    if (!serviceProvided) {
      return apiError(res, 404, "Service provided not found");
    }

    return apiResponse(
      res,
      200,
      "Service provided retrieved successfully",
      serviceProvided
    );
  } catch (error: any) {
    console.error("Error retrieving service provided:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const updateServiceProvided = async (req: Request, res: Response) => {
  try {
    const updatedServiceProvided = await ServiceProvided.findByIdAndUpdate(
      req.params.id,
      {
        serviceId: req.body.serviceId,
        serviceOrderId: req.body.serviceOrderId,
        title: req.body.title,
        date: req.body.date,
        serviceCharge: req.body.serviceCharge,
        products: req.body.products,
        parts: req.body.parts,
        workDetail: req.body.workDetail,
        additionalNotes: req.body.additionalNotes,
        billing: req.body.billing,
      },
      { new: true }
    );

    if (!updatedServiceProvided) {
      return apiError(res, 404, "Service provided not found");
    }

    return apiResponse(
      res,
      200,
      "Service provided updated successfully",
      updatedServiceProvided
    );
  } catch (error: any) {
    console.error("Error updating service provided:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const deleteServiceProvided = async (req: Request, res: Response) => {
  try {
    const deletedServiceProvided = await ServiceProvided.findByIdAndDelete(
      req.params.id
    );

    if (!deletedServiceProvided) {
      return apiError(res, 404, "Service provided not found");
    }

    return apiResponse(
      res,
      200,
      "Service provided deleted successfully",
      deletedServiceProvided
    );
  } catch (error: any) {
    console.error("Error deleting service provided:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};
