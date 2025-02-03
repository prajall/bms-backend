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

// Define threshold for low-stock products/parts
const LOW_STOCK_THRESHOLD = 5; // Adjust as needed

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Extract startDate and endDate for filtering
    const { startDate, endDate } = req.query;

    // Convert to Date objects if provided
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    // Build a date match for pipeline
    const dateMatch: any = {};
    if (start) {
      dateMatch.$gte = start;
    }
    if (end) {
      dateMatch.$lte = end;
    }

    // 1) =============== FINANCIAL DATA FROM BILLING ===============
    // Query for total revenue, total due, total tax, revenue trend
    const billingMatch: any = {};
    if (Object.keys(dateMatch).length) {
      billingMatch.date = dateMatch;
    }

    const billingPipeline: PipelineStage[] = [
      { $match: billingMatch },
      {
        $facet: {
          // Summaries for the entire period
          summary: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$finalTotal" },
                totalDue: {
                  $sum: {
                    $subtract: ["$finalTotal", "$paidAmount"],
                  },
                },
                totalTax: { $sum: "$taxAmount" },
              },
            },
          ],
          // Trend by day (or month) for chart
          revenueTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$date" },
                },
                dailyRevenue: { $sum: "$finalTotal" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    // 2a) =============== SERVICE ORDERS ===============
    // Filter by date range if needed (using 'date' field in ServiceOrder)
    const serviceOrderMatch: any = {};
    if (Object.keys(dateMatch).length) {
      serviceOrderMatch.date = dateMatch;
    }

    const serviceOrderPipeline: PipelineStage[] = [
      { $match: serviceOrderMatch },
      {
        $facet: {
          totalServiceOrders: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          statusBreakdown: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          serviceOrdersTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$date" },
                },
                dailyCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          popularServices: [
            {
              $group: {
                _id: "$service",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 }, // top 5
          ],
        },
      },
    ];

    // 2b) =============== POS ORDERS ===============
    // Filter by date range if needed (using 'createdAt' or 'updatedAt' or custom date if you have one)
    const posMatch: any = {};
    if (Object.keys(dateMatch).length) {
      // Assume we filter by 'createdAt'
      posMatch.createdAt = dateMatch;
    }

    const posPipeline: PipelineStage[] = [
      { $match: posMatch },
      {
        $facet: {
          totalPosOrders: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          posOrdersTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                dailyCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    // 3) =============== CUSTOMERS ===============
    // Filter by 'createdAt' if you want to see how many customers were created in range
    const customerMatch: any = {};
    if (Object.keys(dateMatch).length) {
      customerMatch.createdAt = dateMatch;
    }

    const customersPipeline: PipelineStage[] = [
      { $match: customerMatch },
      {
        $facet: {
          totalCustomers: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          customerTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                dailyCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    // 4) =============== EMPLOYEES ===============
    const employeeMatch: any = {};
    if (Object.keys(dateMatch).length) {
      employeeMatch.createdAt = dateMatch;
    }

    const employeePipeline: PipelineStage[] = [
      { $match: employeeMatch },
      {
        $facet: {
          totalEmployees: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          employeeTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                dailyCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    // 5) =============== PRODUCTS ===============
    // Filter by 'createdAt' for date range if needed
    const productMatch: any = {};
    if (Object.keys(dateMatch).length) {
      productMatch.createdAt = dateMatch;
    }

    // For best selling, we likely need to do aggregator from POS or Billings
    // but let's keep it simple: just a placeholder aggregator for now
    const productsPipeline: PipelineStage[] = [
      { $match: productMatch },
      {
        $facet: {
          totalProducts: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          lowStock: [
            {
              $match: {
                stock: { $lt: LOW_STOCK_THRESHOLD },
              },
            },
            {
              $group: {
                _id: null,
                products: { $push: { _id: "$_id", name: "$name", stock: "$stock" } },
              },
            },
          ],
        },
      },
    ];

    // Example best selling aggregator (POS-based). If you want date-based, apply the same posMatch if needed:
    // We'll handle this in a separate query for clarity
    const bestSellingProductsPipeline: PipelineStage[] = [
      { $match: posMatch },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ];

    // 6) =============== PARTS ===============
    const partMatch: any = {};
    if (Object.keys(dateMatch).length) {
      partMatch.createdAt = dateMatch;
    }

    const partsPipeline: PipelineStage[] = [
      { $match: partMatch },
      {
        $facet: {
          totalParts: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          lowStock: [
            {
              $match: {
                stock: { $lt: LOW_STOCK_THRESHOLD },
              },
            },
            {
              $group: {
                _id: null,
                parts: { $push: { _id: "$_id", name: "$name", stock: "$stock" } },
              },
            },
          ],
        },
      },
    ];

    // Similarly for best selling parts we might check POS usage
    const bestSellingPartsPipeline: PipelineStage[] = [
      { $match: posMatch },
      { $unwind: "$parts" },
      {
        $group: {
          _id: "$parts.part",
          totalUsed: { $sum: "$parts.quantity" },
        },
      },
      { $sort: { totalUsed: -1 } },
      { $limit: 5 },
    ];

    // ------------------ PROMISE.ALL FOR PARALLEL QUERIES ------------------
    const [
      billingResult,
      serviceOrderResult,
      posResult,
      customersResult,
      employeesResult,
      productsResult,
      bestSellingProductsResult,
      partsResult,
      bestSellingPartsResult,
    ] = await Promise.all([
      Billing.aggregate(billingPipeline),
      ServiceOrder.aggregate(serviceOrderPipeline),
      POS.aggregate(posPipeline),
      Customer.aggregate(customersPipeline),
      Employee.aggregate(employeePipeline),
      Product.aggregate(productsPipeline),
      POS.aggregate(bestSellingProductsPipeline), // or handle in a separate pipeline if needed
      Part.aggregate(partsPipeline),
      POS.aggregate(bestSellingPartsPipeline),
    ]);

    // ------------------ PARSE BILLING RESULTS ------------------
    const {
      totalRevenue = 0,
      totalDue = 0,
      totalTax = 0,
    } = billingResult[0]?.summary?.[0] || {};

    const revenueTrend = billingResult[0]?.revenueTrend || [];

    // ------------------ PARSE SERVICE ORDER RESULTS ------------------
    const serviceOrderFacet = serviceOrderResult[0] || {};
    const totalServiceOrders =
      serviceOrderFacet.totalServiceOrders?.[0]?.count || 0;
    const statusBreakdown = serviceOrderFacet.statusBreakdown || [];
    const serviceOrdersTrend = serviceOrderFacet.serviceOrdersTrend || [];
    const popularServices = serviceOrderFacet.popularServices || [];

    // Count pending/completed from statusBreakdown
    const pendingServiceOrders =
      statusBreakdown.find((s: any) => s._id === "pending")?.count || 0;
    const completedServiceOrders =
      statusBreakdown.find((s: any) => s._id === "completed")?.count || 0;

    // ------------------ PARSE POS RESULTS ------------------
    const posFacet = posResult[0] || {};
    const totalPosOrders = posFacet.totalPosOrders?.[0]?.count || 0;
    const posOrdersTrend = posFacet.posOrdersTrend || [];

    // ------------------ PARSE CUSTOMERS RESULTS ------------------
    const customersFacet = customersResult[0] || {};
    const totalCustomers = customersFacet.totalCustomers?.[0]?.count || 0;
    const customerTrend = customersFacet.customerTrend || [];

    // ------------------ PARSE EMPLOYEES RESULTS ------------------
    const employeesFacet = employeesResult[0] || {};
    const totalEmployees = employeesFacet.totalEmployees?.[0]?.count || 0;
    const employeeTrend = employeesFacet.employeeTrend || [];

    // ------------------ PARSE PRODUCTS RESULTS ------------------
    const productsFacet = productsResult[0] || {};
    const totalProducts = productsFacet.totalProducts?.[0]?.count || 0;
    const lowStockProducts = productsFacet.lowStock?.[0]?.products || [];

    // Best-selling products aggregator from bestSellingProductsResult
    const bestProducts = bestSellingProductsResult.map((item: any) => ({
      productId: item._id,
      totalSold: item.totalSold,
    }));

    // ------------------ PARSE PARTS RESULTS ------------------
    const partsFacet = partsResult[0] || {};
    const totalParts = partsFacet.totalParts?.[0]?.count || 0;
    const lowStockParts = partsFacet.lowStock?.[0]?.parts || [];

    // Best-selling parts aggregator from bestSellingPartsResult
    const bestParts = bestSellingPartsResult.map((item: any) => ({
      partId: item._id,
      totalUsed: item.totalUsed,
    }));

    // ------------------ ASSEMBLE FINAL RESPONSE ------------------
    const response = {
      financial: {
        totalRevenue,
        totalDue,
        totalTax,
        revenueTrend, // daily/weekly trend
      },
      sales: {
        totalServiceOrders,
        serviceOrdersTrend,
        totalPosOrders,
        posOrdersTrend,
        pendingServiceOrders,
        completedServiceOrders,
        popularServices, // top 5 services
      },
      customers: {
        totalCustomers,
        customerTrend,
      },
      employees: {
        totalEmployees,
        employeeTrend,
      },
      products: {
        totalProducts,
        lowStockProducts,
        bestProducts, // best-selling
      },
      parts: {
        totalParts,
        lowStockParts,
        bestParts, // best-selling
      },
    };

    return apiResponse(res, 200, "Dashboard data retrieved successfully", response);
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return apiError(res, 500, "Failed to fetch dashboard data", error.message);
  }
};
