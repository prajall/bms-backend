import { Request, Response } from "express";
import ServiceOrder from "../service/serviceOrder/serviceOrder.model";
import { apiError, apiResponse } from "../../../utils/response.util";

export const generateServiceOrderReport = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      startDate,
      endDate,
      isRecurring,
      customer,
      status,
    } = req.query;

    const query: any = {};

    // Add filters based on query parameters
    if (orderId) query.orderId = orderId;
    if (isRecurring !== undefined)
      query.isRecurring = isRecurring === "true"; 
    if (customer) query.customer = customer;
    if (status) query.status = status;

    // Handle date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    // Fetch filtered service orders
    const serviceOrders = await ServiceOrder.find(query)
      .populate({
        path: "service",
        select: "title",
      })
      .populate({
        path: "customer",
        select: "name phoneNo address",
      })
      .sort({ date: -1 });

    // Calculate totals for the report
    const totalServiceCharge = serviceOrders.reduce(
      (sum, order) => sum + order.serviceCharge,
      0
    );
    const totalRemainingAmount = serviceOrders.reduce((sum, order) => {
        return sum + (order.remainingAmount ?? 0);
    }, 0);


    // Prepare response data
    const report = {
      totalOrders: serviceOrders.length,
      totalServiceCharge,
      totalRemainingAmount,
      serviceOrders,
    };

    return apiResponse(res, 200, "Service order report generated", report);
  } catch (error: any) {
    console.error("Error generating service order report:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};
