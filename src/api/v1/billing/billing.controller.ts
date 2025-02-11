import { Request, Response } from "express";
import Billing from "./billing.model";
import { apiError, apiResponse } from "../../../utils/response.util";
import serviceOrderModel from "../service/serviceOrder/serviceOrder.model";
import posOrderModel from "../pos/pos.model";
import Counter from "../models/Counter";

export const createBilling = async (req: Request, res: Response) => {
  const {
    serviceOrders = [],
    posOrders = [],
    paidAmount,
    date,
    discount = 0,
    tax = 0,
    type = "service",
    customer,
  } = req.body;

  const parsedPaidAmount = parseInt(paidAmount.toString()) || 0;

  try {
    if (parsedPaidAmount < 0) {
      return apiError(res, 400, "Paid amount must be a positive integer");
    }

    // Validate date
    const billingDate = new Date(date);
    if (isNaN(billingDate.getTime())) {
      return apiError(res, 400, "Invalid date provided");
    }
    const currentDate = new Date();
    if (billingDate > currentDate) {
      return apiError(res, 400, "Future dates are not allowed");
    }

    // Generate unique invoice number
    const counter = await Counter.findOneAndUpdate(
      { sequenceName: "invoice", type: "billing" },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );
    const newInvoice = `INV-${counter.sequenceValue
      .toString()
      .padStart(5, "0")}`;

    let totalAmount = 0;
    let orderDocs = [];

    if (type === "service" && serviceOrders.length > 0) {
      // Process serviceOrders
      orderDocs = await Promise.all(
        serviceOrders.map(async (order: any) => {
          const doc = await serviceOrderModel
            .findById(order.serviceOrder)
            .populate("customer", "name phoneNo address")
            .populate("service", "title");

          if (!doc) {
            throw new Error(`Service order not found: ${order.serviceOrder}`);
          }

          return { orderDoc: doc, ...order };
        })
      );
      // customer = orderDocs[0]?.orderDoc?.customer;

      totalAmount = orderDocs.reduce((sum, { orderDoc }) => {
        const amount =
          orderDoc.serviceCharge -
          (orderDoc.discount || 0) * (orderDoc.serviceCharge / 100);
        return sum + amount;
      }, 0);
    } else if (type === "pos") {
      // Process posOrders
      orderDocs = await Promise.all(
        posOrders.map(async (order: any) => {
          const doc = await posOrderModel
            .findById(order.posOrder)
            .populate("customer", "name phoneNo address");

          if (!doc) {
            throw new Error(`POS order not found`);
          }

          return { orderDoc: doc, ...order };
        })
      );

      // customer = orderDocs[0]?.orderDoc?.customer;

      totalAmount = orderDocs.reduce((sum, { orderDoc }) => {
        return sum + orderDoc.totalPrice;
      }, 0);
    }

    const totalPaid = await orderDocs.reduce(
      async (sumPromise, { orderDoc }) => {
        const sum = await sumPromise;
        const previousBillings = await Billing.find({
          [`${type}Orders.${type}Order`]: orderDoc._id,
        });
        const totalForOrder = previousBillings.reduce(
          (subtotal, billing) => subtotal + billing.paidAmount,
          0
        );
        return sum + totalForOrder;
      },
      Promise.resolve(0)
    );

    const updatedTotalPaid = totalPaid + parsedPaidAmount;

    // Calculate tax and final total
    const discountAmount = (totalAmount * discount) / 100;
    const taxableAmount = totalAmount - discountAmount;
    const taxAmount = (taxableAmount * tax) / 100;
    const finalTotal = taxableAmount + taxAmount;

    const remainingAmount = finalTotal - updatedTotalPaid;
    const paymentStatus =
      updatedTotalPaid >= finalTotal
        ? "paid"
        : updatedTotalPaid > 0
        ? "partial"
        : "unpaid";

    const newBilling = await Billing.create({
      invoice: newInvoice,
      date: billingDate,
      customer,
      [`${type}Orders`]: orderDocs.map(({ orderDoc }) => ({
        [`${type}Order`]: orderDoc._id,
        orderId: orderDoc.orderId,
        order: orderDoc.order,
      })),
      status: paymentStatus,
      paidAmount: parsedPaidAmount,
      totalPaid: updatedTotalPaid,
      totalAmount,
      taxableAmount,
      discount,
      discountAmount,
      tax,
      taxAmount,
      finalTotal,
      type,
    });

    if (!newBilling) {
      return apiError(res, 500, "Failed to create billing");
    }

    // Update payment statuses in orders
    await Promise.all(
      orderDocs.map(async ({ orderDoc }) => {
        orderDoc.paymentStatus = paymentStatus;
        await orderDoc.save();
      })
    );

    const populatedBilling = await Billing.findById(newBilling._id)
      .populate("customer", "name phoneNo address")
      .populate({
        path: `${type}Orders.${type}Order`,
        select: type === "service" ? "serviceCharge" : "totalPrice",
      });

    return apiResponse(
      res,
      201,
      "Billing created successfully",
      populatedBilling
    );
  } catch (error: any) {
    console.error("Error creating billing:", error);
    return apiError(
      res,
      500,
      error.message ? error.message : "Error creating billing",
      error.message
    );
  }
};

export const getBillings = async (req: Request, res: Response) => {
  const { customerId, serviceOrders, date, status } = req.body;
  const { search } = req.query;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    let filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (customerId) {
      filter.customer = customerId;
    }
    if (serviceOrders && serviceOrders.length > 0) {
      filter["serviceOrders.serviceOrder"] = {
        $in: serviceOrders.map(
          (order: { serviceOrder: string }) => order.serviceOrder
        ),
      };
    }

    if (date) {
      const billingDate = new Date(date);
      filter.date = {
        $gte: new Date(billingDate.setHours(0, 0, 0, 0)),
        $lt: new Date(billingDate.setHours(23, 59, 59, 999)),
      };
    }

    const billings = await Billing.find(filter)
      .populate({
        path: "customer",
        select: "name user _id phoneNo address",
        populate: { path: "user", select: "email _id" },
      })
      .populate({
        path: "serviceOrders",
        populate: {
          path: "serviceOrder",
          select: "serviceCharge discount status paymentStatus",
          populate: { path: "service", select: "title" },
        },
      })

      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const totalBillings = await Billing.countDocuments(filter);
    const totalPages = Math.ceil(totalBillings / limit);

    return apiResponse(res, 200, "Billings fetched successfully", {
      billings,
      totalBillings,
      currentPage: page,
      totalPages,
    });
  } catch (error: any) {
    console.error("Error fetching billings:", error);
    return apiError(res, 500, "Error fetching billings", error.message);
  }
};

export const getBillingById = async (req: Request, res: Response) => {
  const { billingId } = req.params;

  try {
    const billing = await Billing.findById(billingId)
      .populate({
        path: "customer",
        select: "name user _id phoneNo address",
        populate: { path: "user", select: "email _id" },
      })
      .populate({
        path: "serviceOrders",
        populate: {
          path: "serviceOrder",
          select: "serviceCharge discount status paymentStatus",
          populate: { path: "service", select: "title" },
        },
      })
      .exec();

    if (!billing) {
      return apiError(res, 404, "Billing record not found");
    }

    return apiResponse(res, 200, "Billing fetched successfully", billing);
  } catch (error: any) {
    console.error("Error fetching billing:", error);
    return apiError(res, 500, "Error fetching billing", error.message);
  }
};

export const updateBilling = async (req: Request, res: Response) => {
  const { billingId } = req.params;
  const {
    serviceOrders = [],
    totalAmount,
    paidAmount,
    discount,
    tax,
    date,
    customer,
  } = req.body;

  try {
    const billing = await Billing.findById(billingId).populate({
      path: "serviceOrders.serviceOrder",
      populate: {
        path: "customer service",
        select: "name phoneNo address title",
      },
    });

    if (!billing) {
      return apiError(res, 404, "Billing record not found");
    }

    // Validate customer
    if (customer && !billing.customer.equals(customer)) {
      return apiError(
        res,
        400,
        `Customer does not match the previous customer for this billing record.`
      );
    }

    // Validate the date
    if (date) {
      const billingDate = new Date(date);
      if (isNaN(billingDate.getTime())) {
        return apiError(res, 400, "Invalid date provided");
      }
      const currentDate = new Date();
      if (billingDate > currentDate) {
        return apiError(res, 400, "Future dates are not allowed");
      }
      billing.date = billingDate;
    }

    // Fetch new serviceOrders
    const serviceOrderDocs = await Promise.all(
      serviceOrders.map(async (serviceOrder: any) => {
        const doc = await serviceOrderModel
          .findById(serviceOrder.serviceOrder)
          .populate("customer", "name phoneNo address")
          .populate("service", "title");

        if (!doc) {
          throw new Error(
            `Service order not found: ${serviceOrder.serviceOrder}`
          );
        }

        return {
          serviceOrder: doc._id,
          orderId: doc.orderId,
          order: doc.order,
        };
      })
    );

    // Replace the DocumentArray field properly
    billing.serviceOrders.splice(0, billing.serviceOrders.length);
    billing.serviceOrders.push(...serviceOrderDocs);

    // Calculate totalAmount based on the new serviceOrders
    const totalAmount = await serviceOrderDocs.reduce(
      async (sumPromise, serviceOrder) => {
        const sum = await sumPromise; // Ensure proper chaining
        const serviceDoc: any = await serviceOrderModel.findById(
          serviceOrder.serviceOrder
        );
        const amount =
          serviceDoc.serviceCharge -
          (serviceDoc.discount || 0) * (serviceDoc.serviceCharge / 100);
        return sum + amount;
      },
      Promise.resolve(0)
    );

    const discountAmount = (totalAmount * discount) / 100;
    const taxableAmount = totalAmount - discountAmount;
    const taxAmount = (taxableAmount * tax) / 100;
    const finalTotal = taxableAmount + taxAmount;

    // Calculate total paid and remaining amount
    const previousTotalPaid = billing.totalPaid - billing.paidAmount;
    const updatedTotalPaid =
      previousTotalPaid + (paidAmount || billing.paidAmount);
    const remainingAmount = finalTotal - updatedTotalPaid;

    // Update payment status
    const paymentStatus =
      updatedTotalPaid >= finalTotal
        ? "paid"
        : updatedTotalPaid > 0
        ? "partial"
        : "unpaid";

    billing.totalAmount = totalAmount;
    billing.discount = discount;
    billing.discountAmount = discountAmount;
    billing.taxableAmount = taxableAmount;
    billing.tax = tax;
    billing.taxAmount = taxAmount;
    billing.finalTotal = finalTotal;
    billing.totalPaid = updatedTotalPaid;
    billing.paidAmount = paidAmount || billing.paidAmount;
    billing.status = paymentStatus;

    // Save the updated billing
    await billing.save();

    await Promise.all(
      serviceOrderDocs.map(async (serviceOrder) => {
        const serviceOrderDoc = await serviceOrderModel.findById(
          serviceOrder.serviceOrder
        );
        if (serviceOrderDoc) {
          serviceOrderDoc.paymentStatus = paymentStatus;
          await serviceOrderDoc.save();
        }
      })
    );

    return apiResponse(res, 200, "Billing updated successfully", billing);
  } catch (error: any) {
    console.error("Error updating billing:", error);
    return apiError(res, 500, "Error updating billing", error.message);
  }
};

export const deleteBilling = async (req: Request, res: Response) => {
  const { billingId } = req.params;

  try {
    const billing = await Billing.findByIdAndDelete(billingId);

    if (!billing) {
      return apiError(res, 404, "Billing record not found");
    }

    return apiResponse(res, 200, "Billing deleted successfully");
  } catch (error: any) {
    console.error("Error deleting billing:", error);
    return apiError(res, 500, "Error deleting billing", error.message);
  }
};

// export const getBillingById = async (req: Request, res: Response) => {
//   const { billingId } = req.params;

//   try {
//     const billing = await Billing.findById(billingId)
//       .populate("customer serviceOrder")

//       .exec();

//     if (!billing) {
//       return apiError(res, 404, "Billing record not found");
//     }

//     return apiResponse(res, 200, "Billing fetched successfully", billing);
//   } catch (error: any) {
//     console.error("Error fetching billing:", error);
//     return apiError(res, 500, "Error fetching billing", error.message);
//   }
// };
