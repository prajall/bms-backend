import ProductInstallation from "./productInstallation.model";
import { apiResponse, apiError } from "../../../utils/response.util";
import { Request, Response } from "express";
export const createProductInstallation = async (
  req: Request,
  res: Response
) => {
  try {
    const productInstallation = await ProductInstallation.create({
      product: req.body.product,
      customer: req.body.customer,
      installationDate: req.body.installationDate,
      status: req.body.status,
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
      additionalNote: req.body.additionalNote,
      installationCharge: req.body.installationCharge,
      addedServices: req.body.addedServices,
    });

    if (!productInstallation) {
      return apiError(res, 500, "Failed to create product installation");
    }

    return apiResponse(
      res,
      201,
      "Product installation created successfully",
      productInstallation
    );
  } catch (error: any) {
    console.error("Error creating product installation:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getAllProductInstallations = async (
  req: Request,
  res: Response
) => {
  try {
    const { customer, status } = req.query;

    const query: any = {};

    if (customer) {
      query.customer = customer;
    }

    if (status) {
      query.status = status;
    }

    const installations = await ProductInstallation.find(query)
      .populate({ path: "product", select: "name sku" })
      .populate({ path: "customer", select: "name phoneNo" })
      .populate({ path: "addedServices", select: "service date status" })
      .sort({ installationDate: -1 });

    return apiResponse(
      res,
      200,
      "Product installations retrieved successfully",
      installations
    );
  } catch (error: any) {
    console.error("Error retrieving product installations:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getProductInstallationById = async (
  req: Request,
  res: Response
) => {
  try {
    const installation = await ProductInstallation.findById(req.params.id)
      .populate({ path: "product", select: "name sku" })
      .populate({ path: "customer", select: "name phoneNo address" })
      .populate({ path: "addedServices", select: "service date status" });

    if (!installation) {
      return apiError(res, 404, "Product installation not found");
    }

    return apiResponse(
      res,
      200,
      "Product installation retrieved successfully",
      installation
    );
  } catch (error: any) {
    console.error("Error retrieving product installation:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const updateProductInstallation = async (
  req: Request,
  res: Response
) => {
  try {
    const updatedInstallation = await ProductInstallation.findByIdAndUpdate(
      req.params.id,
      {
        product: req.body.product,
        customer: req.body.customer,
        installationDate: req.body.installationDate,
        status: req.body.status,
        address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        additionalNote: req.body.additionalNote,
        installationCharge: req.body.installationCharge,
        addedServices: req.body.addedServices,
      },
      { new: true }
    );

    if (!updatedInstallation) {
      return apiError(res, 404, "Product installation not found");
    }

    return apiResponse(
      res,
      200,
      "Product installation updated successfully",
      updatedInstallation
    );
  } catch (error: any) {
    console.error("Error updating product installation:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const deleteProductInstallation = async (
  req: Request,
  res: Response
) => {
  try {
    const deletedInstallation = await ProductInstallation.findByIdAndDelete(
      req.params.id
    );

    if (!deletedInstallation) {
      return apiError(res, 404, "Product installation not found");
    }

    return apiResponse(
      res,
      200,
      "Product installation deleted successfully",
      deletedInstallation
    );
  } catch (error: any) {
    console.error("Error deleting product installation:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};
