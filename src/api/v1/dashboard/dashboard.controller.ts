import { Request, Response } from "express";
import { apiResponse, apiError } from "../../../utils/response.util";
import { PipelineStage } from "mongoose";
import billingModel from "../billing/billing.model";
import serviceOrderModel from "../service/serviceOrder/serviceOrder.model";
import posModel from "../pos/pos.model";
import customerModel from "../customer/customer.model";
import employeeModel from "../employee/employee.model";
import productModel from "../items/products/product.model";
import partsModel from "../items/parts/parts.model";

export const getDashboardData = async (req: Request, res: Response) => {
  const LOW_STOCK_THRESHOLD = 5;
  try {
    const { startDate, endDate, trendType } = req.query;

    if (!trendType) {
      return apiError(res, 400, "trendType is required");
    }

    let groupByField;
    switch (trendType) {
      case "daily":
        groupByField = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
        break;
      case "monthly":
        groupByField = {
          $dateToString: { format: "%Y-%m", date: "$createdAt" },
        };
        break;
      case "yearly":
        groupByField = { $dateToString: { format: "%Y", date: "$createdAt" } };
        break;
      case "weekly":
        groupByField = { $dayOfWeek: "$createdAt" };
        break;
      default:
        return apiError(
          res,
          400,
          "Invalid trendType. Use 'daily', 'monthly', 'yearly' or 'weekly'"
        );
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const dateMatch: any = {};
    if (start) {
      dateMatch.createdAt = { $gte: new Date(start) };
    }
    if (end) {
      dateMatch.createdAt = { $lte: new Date(end) };
    }
    console.log(dateMatch);

    const billingPipeline: PipelineStage[] = [
      { $match: dateMatch },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                totalPaid: { $sum: "$totalPaid" },
                totalDue: {
                  $sum: {
                    $subtract: ["$totalAmount", "$paidAmount"],
                  },
                },
                totalTax: { $sum: "$taxAmount" },
              },
            },
          ],
          revenueTrend: [
            {
              $group: {
                _id: groupByField,
                dailyRevenue: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const serviceOrderPipeline: PipelineStage[] = [
      { $match: dateMatch },
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
                _id: groupByField,
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: "$_id",
                count: 1,
              },
            },
          ],
          popularServices: [
            {
              $group: {
                _id: "$service",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "services",
                localField: "_id",
                foreignField: "_id",
                as: "service",
              },
            },
            { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                service: {
                  _id: "$service._id",
                  title: "$service.title",
                  serviceType: "$service.serviceType",
                  serviceCharge: "$service.serviceCharge",
                },
                count: 1,
              },
            },
          ],
        },
      },
    ];

    const posPipeline: PipelineStage[] = [
      { $match: dateMatch },
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
                _id: groupByField,
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: "$_id",
                count: 1,
              },
            },
          ],
        },
      },
    ];

    const customersPipeline: PipelineStage[] = [
      { $match: dateMatch },
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
                _id: groupByField,
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: "$_id",
                count: 1,
              },
            },
          ],
        },
      },
    ];

    const employeePipeline: PipelineStage[] = [
      { $match: dateMatch },
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
                _id: groupByField,
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: "$_id",
                count: "$count",
              },
            },
          ],
        },
      },
    ];

    const productsPipeline: PipelineStage[] = [
      { $match: dateMatch },
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
                products: {
                  $push: { _id: "$_id", name: "$name", stock: "$stock" },
                },
              },
            },
          ],
        },
      },
    ];

    const bestSellingProductsPipeline: PipelineStage[] = [
      { $match: dateMatch },

      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.product",
          totalSold: { $sum: "$products.quantity" },
        },
      },

      { $sort: { totalSold: -1 } },

      { $limit: 5 },

      {
        $addFields: {
          productId: { $toObjectId: "$_id" }, // Convert `_id` to ObjectId
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },

      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } }, // Unwind to extract product details

      {
        $project: {
          _id: "$productId",
          totalSold: 1,
          productName: { $ifNull: ["$product.name", "Unknown Product"] }, // Handle missing names
          productPrice: { $ifNull: ["$product.sellingPrice", 0] }, // Handle missing prices
        },
      },
    ];

    const partsPipeline: PipelineStage[] = [
      { $match: dateMatch },
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
                parts: {
                  $push: { _id: "$_id", name: "$name", stock: "$stock" },
                },
              },
            },
          ],
        },
      },
    ];

    const bestSellingPartsPipeline: PipelineStage[] = [
      { $match: dateMatch },
      { $unwind: "$parts" },
      {
        $group: {
          _id: "$parts.part",
          totalSold: { $sum: "$parts.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "parts",
          localField: "_id",
          foreignField: "_id",
          as: "part",
        },
      },

      { $unwind: { path: "$part", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: "$_id",
          totalSold: 1,
          partName: { $ifNull: ["$part.name", "Unknown part"] },
          partPrice: { $ifNull: ["$part.sellingPrice", 0] },
        },
      },
    ];

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
      billingModel.aggregate(billingPipeline),
      serviceOrderModel.aggregate(serviceOrderPipeline),
      posModel.aggregate(posPipeline),
      customerModel.aggregate(customersPipeline),
      employeeModel.aggregate(employeePipeline),
      productModel.aggregate(productsPipeline),
      posModel.aggregate(bestSellingProductsPipeline),
      partsModel.aggregate(partsPipeline),
      posModel.aggregate(bestSellingPartsPipeline),
    ]);

    // ------------------ PARSE BILLING RESULTS ------------------

    const {
      totalRevenue = 0,
      totalPaid = 0,
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
    const cancelledServiceOrders =
      statusBreakdown.find((s: any) => s._id === "cancelled")?.count || 0;
    const delayedServiceOrders =
      statusBreakdown.find((s: any) => s._id === "delayed")?.count || 0;

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
      _id: item._id,
      totalSold: item.totalSold,
      name: item.productName,
      price: item.productPrice,
    }));

    // ------------------ PARSE PARTS RESULTS ------------------
    const partsFacet = partsResult[0] || {};
    const totalParts = partsFacet.totalParts?.[0]?.count || 0;
    const lowStockParts = partsFacet.lowStock?.[0]?.parts || [];

    // Best-selling parts aggregator from bestSellingPartsResult
    const bestParts = bestSellingPartsResult.map((item: any) => ({
      _id: item._id,
      totalSold: item.totalSold,
      name: item.partName,
      price: item.partPrice,
    }));

    // Final Response
    const response = {
      metaData: {
        trendType,
        startDate,
        endDate,
      },
      financial: {
        totalPaid,
        totalRevenue,
        totalDue,
        totalTax,
        revenueTrend,
      },
      sales: {
        totalServiceOrders,
        serviceOrdersTrend,
        totalPosOrders,
        posOrdersTrend,
        pendingServiceOrders,
        completedServiceOrders,
        cancelledServiceOrders,
        delayedServiceOrders,
        popularServices,
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
        bestProducts,
      },
      parts: {
        totalParts,
        lowStockParts,
        bestParts,
      },
    };

    return apiResponse(
      res,
      200,
      "Dashboard data retrieved successfully",
      response
    );
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return apiError(res, 500, "Failed to fetch dashboard data", error.message);
  }
};
