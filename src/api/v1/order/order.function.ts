import { Response } from "express";
import Order from "./order.model";
import { apiError } from "../../../utils/response.util";

const ORDER_ID_LENGTH = 5;
const PREFIX_MAPPING: { [key: string]: string } = {
  service: "SRV",
  installation: "INS",
  invoice: "INV",
  pos: "POS",
};

export const getorderId = async (
  type: string,
  prefix: string
): Promise<string | void> => {
  try {
    const latestOrder = await Order.findOne({ type })
      .sort({ orderId: -1 })
      .select("orderId");

    console.log("latest order", latestOrder);

    let nextOrderNumber = 1;
    if (latestOrder && latestOrder.orderId) {
      const numericPart = latestOrder.orderId.slice(prefix.length);
      nextOrderNumber = parseInt(numericPart, 10) + 1;
    }

    const paddedOrderNumber = nextOrderNumber
      .toString()
      .padStart(ORDER_ID_LENGTH, "0");

    const orderId = prefix.concat(paddedOrderNumber);

    console.log(`Generated Order ID: ${orderId}`);
    return orderId;
  } catch (error: any) {
    console.error("Error generating order number:", error);
    throw new Error("Error generating Order No.");
  }
};
