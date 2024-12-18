import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "./order.model"; // Adjust path to your model
import { apiError, apiResponse } from "../../../utils/response.util"; // Reusable response handler
import { getorderId } from "./order.function"; // Order number generator utility
import serviceOrderModel from "../service/serviceOrder/serviceOrder.model";
import posModel from "../pos/pos.model";

const PREFIX_MAPPING: { [key: string]: string } = {
  service: "SRV",
  installation: "INS",
  pos: "POS",
};

const MAX_RETRIES = 5;

export const createOrder = async (
  customer: string,
  type: string,
  retries = 0
): Promise<{ orderId: string; order: any }> => {
  try {
    // Validate type and get prefix
    const prefix = PREFIX_MAPPING[type.toLowerCase()];
    if (!prefix) {
      throw new Error(
        "Invalid order type. Allowed values: service, installation, invoice, pos"
      );
    }

    if (!customer || !mongoose.Types.ObjectId.isValid(customer)) {
      throw new Error("Invalid or missing customer");
    }

    const orderId = await getorderId(type, prefix);

    if (!orderId) {
      throw new Error("Failed to generate Order ID");
    }

    const newOrder = new Order({
      orderId: orderId,
      date: new Date().toISOString(),
      customer: new mongoose.Types.ObjectId(customer),
      type,
    });

    await newOrder.save();
    console.log("New order created:", newOrder);
    return { orderId, order: newOrder };
  } catch (error: any) {
    // Handle duplicate key error and retry
    if (error.code === 11000) {
      console.warn(
        `Duplicate order ID encountered. Retry attempt: ${retries + 1}`
      );

      if (retries < MAX_RETRIES) {
        return createOrder(customer, type, retries + 1); // Retry with incremented count
      } else {
        console.error(
          "Max retries reached. Failed to create a unique order ID."
        );
        throw new Error("Failed to create order after multiple attempts");
      }
    }

    console.error("Error creating order:", error.message);
    throw error;
  }
};

export const fetchOrders = async (req: Request, res: Response) => {
  try {
    const { customer, orderId } = req.query;

    const filter: any = {};

    if (customer) {
      if (!mongoose.Types.ObjectId.isValid(customer as string)) {
        return apiError(res, 400, "Invalid customer");
      }
      filter.customer = customer;
    }

    if (orderId) {
      filter.orderNo = orderId;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("customer", "name email phone")
      .lean();

    return apiResponse(res, 200, "Orders fetched successfully", { orders });
  } catch (error: any) {
    console.error("Error fetching orders:", error.message);
    return apiError(res, 500, "Internal Server Error");
  }
};

// Fetch a single order with related service and POS orders
export const fetchOrderDetails = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return apiError(res, 400, "Invalid orderId");
    }

    const order = await Order.findById(orderId)
      .populate("customer", "name email phone")
      .lean();

    if (!order) {
      return apiError(res, 404, "Order not found");
    }

    // Fetch related service orders
    const serviceOrders = await serviceOrderModel
      .find({ orderId: order._id })
      .populate("products", "name price") // Populate linked products
      .populate("parts", "name price") // Populate linked parts
      .lean();

    // Fetch related POS orders
    const posOrders = await posModel
      .find({ orderId: order._id })
      .populate("customer", "name email phone") // Populate customer details
      .populate("products.productId", "name price") // Populate product details
      .populate("parts.partId", "name price") // Populate part details
      .populate("services.service", "title serviceCharge") // Populate service details
      .lean();

    // Combine results
    const responseData = {
      order,
      serviceOrders,
      posOrders,
    };

    return apiResponse(
      res,
      200,
      "Order details fetched successfully",
      responseData
    );
  } catch (error: any) {
    console.error("Error fetching order details:", error.message);
    return apiError(res, 500, "Internal Server Error");
  }
};
