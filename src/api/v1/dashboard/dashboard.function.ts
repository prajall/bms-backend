import { PipelineStage } from "mongoose";
import Billing from "../billing/billing.model";
import Customer from "../customer/customer.model";
import Employee from "../employee/employee.model";
import Product from "../items/products/product.model";
import ServiceOrder from "../service/serviceOrder/serviceOrder.model";
import Parts from "../items/parts/parts.model";

export const fetchRevenue: any = async (match: any) => {
  const pipeline: PipelineStage[] = [
    // Group by status for payment status metrics
    {
      $facet: {
        totalRevenueSummary: [
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$finalTotal" },
              totalPaid: { $sum: "$paidAmount" },
              totalDue: {
                $sum: { $subtract: ["$finalTotal", "$paidAmount"] },
              },
              totalDiscount: { $sum: "$discountAmount" },
              totalTax: { $sum: "$taxAmount" },
            },
          },
        ],

        filteredRevenueSummary: [
          { $match: match },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$finalTotal" },
              totalPaid: { $sum: "$paidAmount" },
              totalDue: {
                $sum: { $subtract: ["$finalTotal", "$paidAmount"] },
              },
              totalDiscount: { $sum: "$discountAmount" },
              totalTax: { $sum: "$taxAmount" },
            },
          },
        ],
        // Group by date for trends
        revenueTrends: [
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              dailyRevenue: { $sum: "$finalTotal" },
            },
          },
          { $sort: { _id: 1 } }, // Sort by date
        ],

        // Payment status breakdown
        paymentStatus: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  const results = await Billing.aggregate(pipeline);
  return results;
};

export const fetchOtherData = async (match: any) => {
  try {
    // Fetch total customers
    const totalCustomers = await Customer.countDocuments();

    // Fetch total employees
    const totalEmployees = await Employee.countDocuments();

    // Fetch total products
    const totalProducts = await Product.countDocuments();

    const totalParts = await Parts.countDocuments();

    // Fetch total service orders
    const totalServiceOrders = await ServiceOrder.countDocuments();

    const serviceOrdersThisMonth = await ServiceOrder.countDocuments(match);

    // Return the results
    return {
      totalCustomers,
      totalEmployees,
      totalProducts,
      totalParts,
      totalServiceOrders,
      serviceOrdersThisMonth,
    };
  } catch (error: any) {
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch other data");
  }
};
