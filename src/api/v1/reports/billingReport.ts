import { Request, Response } from "express";
import Billing from "../billing/billing.model";
import { apiError, apiResponse } from "../../../utils/response.util";

export const generateBillingReport = async (req: Request, res: Response) => {
  const { invoice, from, to, customer, orderId, status } = req.query;

  try {
    let filter: any = {};

    if (invoice) {
      filter.invoice = invoice;
    }

    if (from || to) {
      const fromDate = from ? new Date(from.toString()) : null;
      const toDate = to ? new Date(to.toString()) : null;

      filter.date = {
        ...(fromDate && { $gte: new Date(fromDate.setHours(0, 0, 0, 0)) }),
        ...(toDate && { $lte: new Date(toDate.setHours(23, 59, 59, 999)) }),
      };
    }

    if (customer) {
      filter.customer = customer;
    }

    if (orderId) {
      filter["serviceOrders.orderId"] = orderId;
    }

    if (status) {
      filter.status = status;
    }

    // Fetch data from the Billing collection based on the filter
    const billings = await Billing.find(filter)
      .populate({
        path: "customer",
        select: "name phoneNo address",
      })
      .populate({
        path: "serviceOrders.serviceOrder",
        populate: { path: "service", select: "title" },
      })
      .sort({ createdAt: -1 })
      .exec();

    // Calculate totals
    const totalAmount = billings.reduce(
      (sum, record) => sum + record.totalAmount,
      0
    );
    const totalPaid = billings.reduce(
      (sum, record) => sum + record.totalPaid,
      0
    );
    const remainingAmount = totalAmount - totalPaid;
    const finalTotal = billings.reduce(
      (sum, record) => sum + record.finalTotal,
      0
    );

    // Return the report data with totals
    return apiResponse(res, 200, "Report generated successfully", {
      billings,
      totalBillings: billings.length,
      totalAmount,
      totalPaid,
      remainingAmount,
      finalTotal,
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return apiError(res, 500, "Error generating report", error.message);
  }
};
