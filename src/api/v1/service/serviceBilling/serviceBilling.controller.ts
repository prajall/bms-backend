import { Request, Response } from "express";
import Billing from "./serviceBilling.model";
import { apiError, apiResponse } from "../../../../utils/response.util";
import serviceOrderModel from "../serviceOrder/serviceOrder.model";
import Counter from "../../models/Counter";

// Create a billing record
// export const createBilling = async (req: Request, res: Response) => {
//   const { serviceOrder } = req.body;
//   const paidAmount = parseInt(req.body.paidAmount.toString()) || 0;

//   try {
//     if (paidAmount <= 0) {
//       return apiError(res, 400, "Paid amount must be greater than 0");
//     }
//     const serviceOrderDoc = await serviceOrderModel
//       .findById(serviceOrder)
//       .populate("customer", "name phoneNo address")
//       .populate("service", "title");
//     if (!serviceOrderDoc) {
//       return apiError(res, 404, "Service order not found");
//     }

//     const previousBillings = await Billing.find({
//       serviceOrder: serviceOrder,
//     });

//     const totalPaid = previousBillings.reduce(
//       (sum, billing) => sum + billing.paidAmount,
//       0
//     );
//     const totalAmount =
//       serviceOrderDoc.serviceCharge -
//       (serviceOrderDoc.discount || 0) * (serviceOrderDoc.serviceCharge / 100);
//     const remainingAmount = totalAmount - totalPaid;

//     // Calculate the new payment status
//     const updatedTotalPaid = totalPaid + paidAmount;
//     console.log("updatedTotalPaid", updatedTotalPaid, "total paid", totalPaid);
//     let paymentStatus = "unpaid";
//     if (updatedTotalPaid >= serviceOrderDoc.serviceCharge) {
//       paymentStatus = "paid";
//     } else if (updatedTotalPaid > 0) {
//       paymentStatus = "partial";
//     }

//     // Create the billing document
//     const newBilling = await Billing.create({
//       customer: serviceOrderDoc.customer,
//       type: "service",
//       serviceOrder,
//       orderId: serviceOrderDoc.orderId,
//       order: serviceOrderDoc.order,
//       date: new Date(),
//       totalAmount: serviceOrderDoc.serviceCharge,
//       paidAmount,
//       totalPaid: updatedTotalPaid,
//       remainingAmount: remainingAmount - paidAmount,
//       status: paymentStatus,
//     });

//     if (!newBilling) {
//       return apiError(res, 500, "Failed to create billing");
//     }

//     // Update the payment status in the ServiceOrder
//     serviceOrderDoc.paymentStatus = paymentStatus;
//     await serviceOrderDoc.save();
    
//     const populatedBilling = await Billing.findById(newBilling._id)
//       .populate("customer", "name phoneNo address")
//       .populate("serviceOrder", "serviceCharge discount")
//       .populate({
//         path: "serviceOrder",
//         populate: { path: "service", select: "title" },
//       });


//     return apiResponse(res, 201, "Billing created successfully", populatedBilling);
//   } catch (error: any) {
//     console.error("Error creating billing:", error);
//     return apiError(res, 500, "Error creating billing", error.message);
//   }
// };

export const createBilling = async (req: Request, res: Response) => {
  const { serviceOrders, paidAmount, date } = req.body;
  const parsedPaidAmount = parseInt(paidAmount.toString()) || 0;

  try {
    if (parsedPaidAmount <= 0) {
      return apiError(res, 400, "Paid amount must be greater than 0");
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

    // Generate unique invoice number using Counter with type "billing"
    const counter = await Counter.findOneAndUpdate(
      { sequenceName: "invoice", type: "billing" },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );
    const newInvoice = `INV-${counter.sequenceValue.toString().padStart(5, "0")}`;

    // Validate serviceOrders and fetch their details
    const serviceOrderDocs = await Promise.all(
      serviceOrders.map(async (serviceOrder: any) => {
        const doc = await serviceOrderModel
          .findById(serviceOrder.serviceOrder)
          .populate("customer", "name phoneNo address")
          .populate("service", "title");

        if (!doc) {
          throw new Error(`Service order not found: ${serviceOrder.serviceOrder}`);
        }

        return {
          serviceOrderDoc: doc,
          ...serviceOrder,
        };
      })
    );

    const customer = serviceOrderDocs[0].serviceOrderDoc.customer; // Assuming all service orders belong to the same customer
    const totalAmount = serviceOrderDocs.reduce((sum, { serviceOrderDoc }) => {
      const amount =
        serviceOrderDoc.serviceCharge -
        (serviceOrderDoc.discount || 0) * (serviceOrderDoc.serviceCharge / 100);
      return sum + amount;
    }, 0);

    const totalPaid = await serviceOrderDocs.reduce(async (sumPromise, { serviceOrderDoc }) => {
      const sum = await sumPromise; // Accumulate the sum
      const previousBillings = await Billing.find({ serviceOrder: serviceOrderDoc._id });
      const totalForOrder = previousBillings.reduce((subtotal, billing) => subtotal + billing.paidAmount, 0);
      return sum + totalForOrder;
    }, Promise.resolve(0));

    const updatedTotalPaid = totalPaid + parsedPaidAmount;
    const remainingAmount = totalAmount - updatedTotalPaid;
    const paymentStatus =
      updatedTotalPaid >= totalAmount
        ? "paid"
        : updatedTotalPaid > 0
        ? "partial"
        : "unpaid";

    // Calculate tax and final total
    const tax = 0 * totalAmount; // Example 0% tax
    const finalTotal = totalAmount + tax;

    const newBilling = await Billing.create({
      invoice: newInvoice,
      date: billingDate,
      customer,
      serviceOrders: serviceOrderDocs.map(({ serviceOrderDoc }) => ({
        serviceOrder: serviceOrderDoc._id,
        orderId: serviceOrderDoc.orderId,
        order: serviceOrderDoc.order,
      })),
      status: paymentStatus,
      paidAmount: parsedPaidAmount,
      totalPaid: updatedTotalPaid,
      totalAmount,
      discount: serviceOrderDocs.reduce((sum, { serviceOrderDoc }) => sum + (serviceOrderDoc.discount || 0), 0),
      tax,
      finalTotal,
    });

    if (!newBilling) {
      return apiError(res, 500, "Failed to create billing");
    }

    // Update payment statuses in ServiceOrder
    await Promise.all(
      serviceOrderDocs.map(async ({ serviceOrderDoc }) => {
        serviceOrderDoc.paymentStatus = paymentStatus;
        await serviceOrderDoc.save();
      })
    );

    // Populate the new billing for the response
    const populatedBilling = await Billing.findById(newBilling._id)
      .populate("customer", "name phoneNo address")
      .populate({
        path: "serviceOrders.serviceOrder",
        populate: { path: "service", select: "title" },
      });

    return apiResponse(res, 201, "Billing created successfully", populatedBilling);
  } catch (error: any) {
    console.error("Error creating billing:", error);
    return apiError(res, 500, "Error creating billing", error.message);
  }
};



export const getBillings = async (req: Request, res: Response) => {
  const { customerId, serviceOrders, date } = req.body;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    let filter: any = {};

    if (customerId) {
      filter.customer = customerId;
    }
    if (serviceOrders && serviceOrders.length > 0) {
      filter["serviceOrders.serviceOrder"] = { $in: serviceOrders };
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
        path: "serviceOrders.serviceOrder",
        select:
          "orderId order serviceCharge discount service status paymentStatus",
        populate: { path: "service", select: "title" },
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
      .populate("customer serviceOrder")

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
  const { totalAmount, paidAmount } = req.body;

  try {
    const billing = await Billing.findById(billingId);

    if (!billing) {
      return apiError(res, 404, "Billing record not found");
    }

    // Update values
    billing.totalAmount = totalAmount || billing.totalAmount;
    billing.paidAmount = paidAmount || billing.paidAmount;

    await billing.save();

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
