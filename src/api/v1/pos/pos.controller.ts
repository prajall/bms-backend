import { Request, Response } from "express";
import POS from "./pos.model";
import { apiResponse, apiError } from "../../../utils/response.util";
import ServiceOrder from "../service/serviceOrder/serviceOrder.model";
import Service from "../service/service/service.model";
import { createOrder } from "../order/order.controller";

const WALKING_CUSTOMER_ID = "67554286140992b96228ae97";
// Create a new POS record
export const createPOS = async (req: Request, res: Response) => {
  try {
    const {
      products,
      parts,
      serviceOrders,
      customerType,
      customer,
      totalPrice,
      tax,
      subTotal,
      discount,
    } = req.body;

    const { orderId, order } = await createOrder(
      customerType === "walking" ? WALKING_CUSTOMER_ID : customer,
      "pos"
    );

    if (!order || !orderId) {
      return apiError(res, 500, "Failed to create order");
    }

    let createdServiceOrders: any[] = [];
    if (serviceOrders && serviceOrders.length > 0) {
      const serviceOrdersData = await Promise.all(
        serviceOrders.map(async (serviceOrder: any) => {
          try {
            const serviceDetails = await Service.findById(
              serviceOrder.service
            ).exec();

            let nextServiceDate = null;
            if (serviceDetails?.isRecurring && serviceDetails.interval) {
              const intervalInDays = serviceDetails.interval;
              nextServiceDate = new Date();
              nextServiceDate.setDate(
                nextServiceDate.getDate() + intervalInDays
              );
            }

            return {
              service: serviceOrder,
              customer:
                customerType === "walking" ? WALKING_CUSTOMER_ID : customer,
              date: serviceOrder.date,
              nextServiceDate,
              serviceCharge: serviceOrder.price,
              orderId: orderId, // Link serviceOrder orders to the newly created Order
              order: order,
            };
          } catch (error) {
            console.error("Error processing serviceOrder order:", error);
            throw new Error(
              `Failed to process serviceOrder with ID: ${serviceOrder.service}`
            );
          }
        })
      );

      createdServiceOrders = await ServiceOrder.insertMany(serviceOrdersData);
    }

    const pos = await POS.create({
      products,
      parts,
      serviceOrders: createdServiceOrders,
      customerType: customerType || "walking",
      customer,
      totalPrice,
      tax,
      subTotal,
      discount,
      date: new Date(),
      orderId,
      order: order._id,
    });

    if (!pos) {
      return apiError(res, 400, "Failed to create POS record");
    }

    return apiResponse(res, 201, "POS record created successfully", {
      pos,
      orderId: order.orderId,
      createdServiceOrders,
    });
  } catch (error: any) {
    console.error("Create POS error:", error.message);
    return apiError(res, 500, "Error creating POS record", error.message);
  }
};

// Delete a POS record by ID

// Get all POS records with optional pagination and filters
export const getAllPOS = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.customerType) {
      query.customerType = req.query.customerType;
    }
    if (req.query.customer) {
      query.customer = req.query.customer;
    }

    const totalPOS = await POS.countDocuments(query);
    const totalPages = Math.ceil(totalPOS / limit);

    const posRecords = await POS.find(query)
      .populate("products.productId", "name price")
      .populate("parts.partId", "name price")
      .populate("services.service", "name price")
      // .populate({
      //   path: "installations.installationId",
      //   select: "name price",
      //   strictPopulate: false,
      // })
      .populate("customer", "name email")
      .skip(skip)
      .limit(limit);

    return apiResponse(res, 200, "POS records retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages,
        totalPOS,
        limit,
      },
      posRecords,
    });
  } catch (error: any) {
    console.error("Get all POS error:", error);
    return apiError(res, 500, "Error fetching POS records", error.message);
  }
};

// Get a single POS record by ID
export const getPOSById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pos = await POS.findById(id)
      .populate("products.productId", "name price")
      .populate("parts.partId", "name price")
      .populate("services.service", "name price")
      // .populate("installations.installationId", "name price")
      .populate("customer", "name email");

    if (!pos) {
      return apiError(res, 404, "POS record not found");
    }

    return apiResponse(res, 200, "POS record retrieved successfully", pos);
  } catch (error: any) {
    console.error("Get POS by ID error:", error);
    return apiError(res, 500, "Error fetching POS record", error.message);
  }
};

// Update a POS record by ID
export const updatePOS = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const posData = req.body;

    const updatedPOS = await POS.findByIdAndUpdate(id, posData, {
      new: true,
      runValidators: true,
    })
      .populate("products.productId", "name price")
      .populate("parts.partId", "name price")
      .populate("services.service", "name price")
      .populate("installations.installationId", "name price")
      .populate("customer", "name email");

    if (!updatedPOS) {
      return apiError(res, 404, "POS record not found");
    }

    return apiResponse(res, 200, "POS record updated successfully", updatedPOS);
  } catch (error: any) {
    console.error("Update POS error:", error);
    return apiError(res, 500, "Error updating POS record", error.message);
  }
};

// Delete a POS record by ID
export const deletePOS = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedPOS = await POS.findByIdAndDelete(id);

    if (!deletedPOS) {
      return apiError(res, 404, "POS record not found");
    }

    return apiResponse(res, 200, "POS record deleted successfully");
  } catch (error: any) {
    console.error("Delete POS error:", error);
    return apiError(res, 500, "Error deleting POS record", error.message);
  }
};
