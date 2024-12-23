import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "./order.model";
import { apiError, apiResponse } from "../../../utils/response.util";
import { getorderId } from "./order.function";
import ServiceOrder from "../service/serviceOrder/serviceOrder.model";
import POSModel from "../pos/pos.model";

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
        return createOrder(customer, type, retries + 1);
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
    const { customer, orderId, startDate, endDate } = req.query;

    const filter: any = {};

    if (customer) {
      filter.customer = customer;
    }

    if (orderId) {
      filter.orderId = orderId;
    }
    if (startDate) {
      filter.createdAt = {
        ...filter.createdAt,
        $gte: new Date(startDate.toString()),
      };
    }
    if (endDate) {
      filter.createdAt = {
        ...filter.createdAt,
        $lte: new Date(endDate.toString()),
      };
    }

    // Fetch orders
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("customer", "name email phone")
      .lean();

    if (orders.length === 0) {
      return apiResponse(res, 404, "No orders found");
    }

    // Fetch associated serviceOrders for each order
    const orderIds = orders.map((order: any) => order._id);

    const serviceOrders = await ServiceOrder.find({
      order: { $in: orderIds },
    })
      .select("-__v") // Select or exclude fields if needed
      .lean();

    // Map serviceOrders to their respective orders
    const ordersWithServiceOrders = orders.map((order: any) => {
      order.serviceOrders = serviceOrders.filter(
        (so: any) => so.order.toString() === order._id.toString()
      );
      return order;
    });

    return apiResponse(
      res,
      200,
      "Orders fetched successfully",
      ordersWithServiceOrders
    );
  } catch (error: any) {
    console.error("Error fetching orders:", error.message);
    return apiError(res, 500, "Internal Server Error");
  }
};

// Fetch a single order with related service and POS orders
export const fetchOrderDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid id");
    }

    const order = await Order.findById(id)
      .populate("customer", "name email phone")
      .lean();

    if (!order) {
      return apiError(res, 404, "Order not found");
    }

    const serviceOrders = await ServiceOrder.find({ order: order._id })
      .populate("products", "name price")
      .populate("parts", "name price")
      .lean();

    const posOrders = await POSModel.find({ order: order._id })
      .populate({
        path: "customer",
        select: "name email phone",
        strictPopulate: false,
      })
      .populate({
        path: "products.productId",
        select: "name price",
        strictPopulate: false,
      })
      .populate({
        path: "parts.partId",
        select: "name price",
        strictPopulate: false,
      })
      .populate({
        path: "services.service",
        select: "title serviceCharge",
        strictPopulate: false,
      })
      .lean();

    const orderDetails = {
      order,
      serviceOrders,
      posOrders,
    };

    return apiResponse(
      res,
      200,
      "Order details fetched successfully",
      orderDetails
    );
  } catch (error: any) {
    console.error("Error fetching order details:", error.message);
    return apiError(res, 500, "Internal Server Error");
  }
};
