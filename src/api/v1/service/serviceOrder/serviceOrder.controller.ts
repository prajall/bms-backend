import { Request, Response } from "express";
import ServiceOrder from "./serviceOrder.model";
import ServiceProvided from "../serviceProvided/serviceProvided.model";
import Product from "../../items/products/product.model";
import { apiError, apiResponse } from "../../../../utils/response.util";
import { createOrder } from "../../order/order.controller";
import Service from "../service/service.model";
import mongoose from "mongoose";

interface ServiceOrder {
  order: string;
  orderId: string;
  isRecurring?: boolean;
  customer: string;
  service: string;
  serviceType: string;
  interval: number;
  date: Date;
  nextServiceDate?: Date;
  serviceCharge: number;
  parentServiceOrder?: string;
  additionalNotes?: string;
}

export const createServiceOrder = async (req: Request, res: Response) => {
  try {
    let {
      order,
      orderId,
      isRecurring = false,
      customer = "67554286140992b96228ae97",
      service,
      serviceType = "maintenance",
      interval,
      date,
      nextServiceDate,
      serviceCharge,
      parentServiceOrder,
      additionalNotes,
    } = req.body;

    const serviceOrderDoc = await Service.findById(service);
    if (!serviceOrderDoc) {
      return apiError(res, 400, "Service does not exist");
    }

    const newServiceOrder: any = {
      service,
      serviceType,
      customer,
      date,
      serviceCharge,
      additionalNotes,
      status: "pending",
      orderId,
      order,
    };

    if (!order || !orderId) {
      const newOrder = await createOrder(customer, "service");
      if (!newOrder) {
        return apiError(res, 500, "Failed to create order");
      }
      newServiceOrder.orderId = newOrder.orderId;
      newServiceOrder.order = newOrder.order;
    }

    const calculateNextServiceDate = () => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + interval);
      return nextDate;
    };

    if (!parentServiceOrder && isRecurring) {
      interval = interval || serviceOrderDoc.interval || 0;

      if (interval === 0) {
        return apiError(res, 400, "Interval is required for recurring orders");
      }

      newServiceOrder.isRecurring = true;
      newServiceOrder.interval = interval;
      newServiceOrder.nextServiceDate =
        nextServiceDate || calculateNextServiceDate();
    }

    // Handle child service orders
    if (parentServiceOrder) {
      const parentServiceOrderDoc = await ServiceOrder.findById(
        parentServiceOrder
      );

      if (!parentServiceOrderDoc) {
        return apiError(res, 400, "Parent service order does not exist");
      }

      newServiceOrder.parentServiceOrder = parentServiceOrder;

      const childServiceOrder = await ServiceOrder.create(newServiceOrder);

      if (!childServiceOrder) {
        return apiError(res, 500, "Failed to create service order");
      }

      if (!isRecurring) {
        parentServiceOrderDoc.isRecurring = false;
      } else {
        parentServiceOrderDoc.isRecurring = true;
        if (req.body.interval) {
          parentServiceOrderDoc.interval = interval;
        }
        parentServiceOrderDoc.nextServiceDate = calculateNextServiceDate();
      }

      await parentServiceOrderDoc.save();

      return apiResponse(
        res,
        201,
        "Service order created successfully",
        childServiceOrder
      );
    }

    // Create parent service order
    const serviceOrder = await ServiceOrder.create(newServiceOrder);

    if (!serviceOrder) {
      return apiError(res, 500, "Failed to create service order");
    }

    return apiResponse(
      res,
      201,
      "Service order created successfully",
      serviceOrder
    );
  } catch (error: any) {
    console.error("Error creating service order:", error);
    return apiError(res, 500, "Internal server error", error.stack);
  }
};

export const getAllServiceOrders = async (req: Request, res: Response) => {
  try {
    const { customer, parentServiceOrder } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const query: any = {};
    if (customer) {
      query.customer = customer;
    }
    if (parentServiceOrder) {
      query.parentServiceOrder = parentServiceOrder;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const serviceOrders = await ServiceOrder.find(query)
      .populate({ path: "service", select: "-createdAt -updatedAt" })
      .populate({ path: "customer", select: "name phoneNo address" })
      .populate({
        path: "serviceProvided",
        model: ServiceProvided,
        strictPopulate: false,
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalOrders = await ServiceOrder.countDocuments(query);

    return apiResponse(res, 200, "Service orders retrieved successfully", {
      serviceOrders,
      totalOrders,
      currentPage: Number(page),
      totalPages: Math.ceil(totalOrders / Number(limit)),
    });
  } catch (error: any) {
    console.error("Error retrieving service orders:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getServiceOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid service order ID");
    }

    const serviceOrder = await ServiceOrder.findById(id)
      .populate({
        path: "service",
        select: "-createdAt -updatedAt",
      })
      .populate({ path: "customer", strictPopulate: false });

    if (!serviceOrder) {
      return apiError(res, 404, "Service order not found");
    }

    return apiResponse(
      res,
      200,
      "Service order retrieved successfully",
      serviceOrder
    );
  } catch (error: any) {
    console.error("Error retrieving service order:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const updateServiceOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid service order ID");
    }

    const allowedUpdates = [
      "order",
      "orderId",
      "service",
      "serviceType",
      "customer",
      "date",
      "isRecurring",
      "interval",
      "nextServiceDate",
      "serviceCharge",
      "additionalNotes",
      "status",
      "parentServiceOrder",
    ];

    const updates: any = {};
    for (const key of Object.keys(req.body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const updatedServiceOrder = await ServiceOrder.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
      }
    );

    if (!updatedServiceOrder) {
      return apiError(res, 404, "Service order not found");
    }

    return apiResponse(
      res,
      200,
      "Service order updated successfully",
      updatedServiceOrder
    );
  } catch (error: any) {
    console.error("Error updating service order:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const deleteServiceOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid service order ID");
    }

    const deletedServiceOrder = await ServiceOrder.findByIdAndDelete(id);

    if (!deletedServiceOrder) {
      return apiError(res, 404, "Service order not found");
    }

    return apiResponse(
      res,
      200,
      "Service order deleted successfully",
      deletedServiceOrder
    );
  } catch (error: any) {
    console.error("Error deleting service order:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};
