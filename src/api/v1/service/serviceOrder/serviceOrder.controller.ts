import { Request, Response } from "express";
import ServiceOrder from "./serviceOrder.model";
import ServiceProvided from "../serviceProvided/serviceProvided.model";
import Product from "../../items/products/product.model";
import { apiError, apiResponse } from "../../../../utils/response.util";
import { createOrder } from "../../order/order.controller";
import Service from "../service/service.model";

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
      customer = "67554286140992b96228ae97", // Default "walking customer" ID
      service,
      serviceType = "service",
      interval = 0,
      date,
      nextServiceDate,
      serviceCharge,
      parentServiceOrder,
      additionalNotes,
    } = req.body;

    // Validate service existence
    const serviceOrderDoc = await Service.findById(service);
    if (!serviceOrderDoc) {
      return apiError(res, 400, "Service does not exist");
    }

    // Initialize new service order
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

    // Create order if not provided
    if (!order || !orderId) {
      const newOrder = await createOrder(customer, "service");
      if (!newOrder) {
        return apiError(res, 500, "Failed to create order");
      }
      newServiceOrder.orderId = newOrder.orderId;
      newServiceOrder.order = newOrder.order;
    }

    // Helper to calculate the next service date
    const calculateNextServiceDate = () => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + interval);
      return nextDate;
    };

    // Handle parent service orders
    if (!parentServiceOrder && isRecurring) {
      interval = interval || serviceOrderDoc.interval || 0;

      // Ensure interval is valid
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

      parentServiceOrderDoc.nextServiceDate = calculateNextServiceDate();
      if (!isRecurring) {
        parentServiceOrderDoc.isRecurring = false;
      }

      await parentServiceOrderDoc.save(); // No need for result check; exceptions handle errors

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
    const { customer } = req.body;

    const query: any = {};

    if (customer) {
      query.customer = customer;
    }

    const serviceOrders = await ServiceOrder.find(query)
      .populate({ path: "service", select: "-createdAt -updatedAt" })
      .populate({ path: "customer", select: "name phoneNo address" })
      .populate({
        path: "serviceProvided",
        model: ServiceProvided,
        strictPopulate: false,
      })
      .sort({ date: -1 });

    return apiResponse(
      res,
      200,
      "Service orders retrieved successfully",
      serviceOrders
    );
  } catch (error: any) {
    console.error("Error retrieving service orders:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getServiceOrderById = async (req: Request, res: Response) => {
  try {
    const serviceOrder = await ServiceOrder.findById(req.params.id)
      .populate({
        path: "service",
        select: "-createdAt -updatedAt",
        populate: {
          path: "products",
          select: "-createdAt -updatedAt",
          model: Product,
          strictPopulate: false,
        },
      })
      .populate({ path: "customer", select: "-createdAt -updatedAt" })
      .populate({
        path: "serviceProvided",
        model: ServiceProvided,
        strictPopulate: false,
      });

    if (!serviceOrder) {
      return res.status(404).json({ message: "Service order not found" });
    }

    return res.status(200).json({
      message: "Service order retrieved successfully",
      data: serviceOrder,
    });
  } catch (error) {
    console.error("Error retrieving service order:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateServiceOrder = async (req: Request, res: Response) => {
  try {
    const updatedServiceOrder = await ServiceOrder.findByIdAndUpdate(
      req.params.id,
      {
        service: req.body.service,
        customer: req.body.customer,
        date: req.body.date,
        recurring: req.body.recurring,
        nextServiceDate: req.body.nextServiceDate,
        serviceCharge: req.body.serviceCharge,
        serviceProvided: req.body.serviceProvided,
      },
      { new: true }
    );

    if (!updatedServiceOrder) {
      return res.status(404).json({ message: "Service order not found" });
    }

    return res.status(200).json({
      message: "Service order updated successfully",
      data: updatedServiceOrder,
    });
  } catch (error) {
    console.error("Error updating service order:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteServiceOrder = async (req: Request, res: Response) => {
  try {
    const deletedServiceOrder = await ServiceOrder.findByIdAndDelete(
      req.params.id
    );

    if (!deletedServiceOrder) {
      return res.status(404).json({ message: "Service order not found" });
    }

    return res.status(200).json({
      message: "Service order deleted successfully",
      data: deletedServiceOrder,
    });
  } catch (error) {
    console.error("Error deleting service order:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
