import { Request, Response } from "express";
import { apiResponse, apiError } from "../../../utils/response.util";
import { PipelineStage } from "mongoose";
import { fetchOtherData, fetchRevenue } from "./dashboard.function";

export const getKPI = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Match for date range (if provided)
    const match: any = {};
    if (startDate) {
      match.date = { $gte: new Date(startDate as string) };
    }
    if (endDate) {
      match.date = match.date || {};
      match.date.$lte = new Date(endDate as string);
    }

    const revenue = await fetchRevenue(match);
    const {
      totalCustomers,
      totalEmployees,
      totalProducts,
      totalServiceOrders,
      serviceOrdersThisMonth,
      totalParts,
    } = await fetchOtherData(match);

    if (!revenue.length) {
      return apiError(res, 404, "No KPI data found");
    }

    const totalRevenueSummary = revenue[0].totalRevenueSummary[0] || {
      totalRevenue: 0,
      totalPaid: 0,
      totalDue: 0,
      totalDiscount: 0,
      totalTax: 0,
    };
    const filteredRevenueSummary = revenue[0].filteredRevenueSummary[0] || {
      totalRevenue: 0,
      totalPaid: 0,
      totalDue: 0,
      totalDiscount: 0,
      totalTax: 0,
    };

    const revenueTrends = revenue[0].revenueTrends || [];
    const paymentStatus = revenue[0].paymentStatus.reduce(
      (acc: Record<string, number>, { _id, count }: any) => {
        acc[_id] = count;
        return acc;
      },
      {}
    );

    return apiResponse(res, 200, "KPI data retrieved successfully", {
      totalRevenueSummary,
      filteredRevenueSummary,
      revenueTrends,
      paymentStatus,
      totalCustomers,
      totalEmployees,
      totalProducts,
      totalParts,
      totalServiceOrders,
      serviceOrdersThisMonth,
    });
  } catch (error: any) {
    console.error("Error fetching KPI data:", error);
    return apiError(res, 500, "Error fetching KPI data", error.message);
  }
};
