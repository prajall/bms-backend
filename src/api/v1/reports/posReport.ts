import { Request, Response } from "express";
import POS from "../pos/pos.model";
import { apiResponse, apiError } from "../../../utils/response.util";

export const generatePOSReport = async (req: Request, res: Response) => {
  try {
    const { product, part, customer, from, to } = req.query;

    // Build the query filters
    const query: any = {};

    if (product) {
      query["products.product"] = product; 
    }

    if (part) {
      query["parts.part"] = part;
    }

    if (customer) {
      query.customer = customer;
    }

    if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(from as string);
      }
      if (to) {
        query.createdAt.$lte = new Date(to as string);
      }
    }

    // Fetch filtered POS records
    const posRecords = await POS.find(query)
      .populate("products.product", "name price")
      .populate("parts.part", "name price") 
      .populate("customer", "name email")   
      .sort({ createdAt: -1 });

    // Calculate totals
    const totals = posRecords.reduce(
      (acc, record) => {
        acc.totalPrice += record.totalPrice || 0;
        acc.tax += record.tax || 0;
        acc.subTotal += record.subTotal || 0;
        acc.discount += record.discount || 0;
        return acc;
      },
      { totalPrice: 0, tax: 0, subTotal: 0, discount: 0 }
    );

    return apiResponse(res, 200, "POS report generated successfully", {
      totals,
      posRecords,
    });
  } catch (error: any) {
    console.error("Get POS report error:", error);
    return apiError(res, 500, "Error generating POS report", error.message);
  }
};

