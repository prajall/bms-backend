import { Request, Response } from "express";
import Billing from "./serviceBilling.model";
import { apiError, apiResponse } from "../../../../utils/response.util";
import serviceOrderModel from "../serviceOrder/serviceOrder.model";

// Create a billing record
export const createBilling = async (req: Request, res: Response) => {
  const { serviceOrder, paidAmount = 0 } = req.body;

  try {
    const serviceOrderDoc = await serviceOrderModel
      .findById(serviceOrder)
      .populate("customer");

    if (!serviceOrderDoc) {
      return apiError(res, 404, "Service order not found");
    }

    const previousBillings = await Billing.find({
      serviceOrder: serviceOrder,
    });

    const totalPaid = previousBillings.reduce(
      (sum, billing) => sum + billing.paidAmount,
      0
    );
    const totalAmount =
      serviceOrderDoc.serviceCharge -
      (serviceOrderDoc.discount || 0) * (serviceOrderDoc.serviceCharge / 100);
    const remainingAmount = totalAmount - totalPaid;

    if (paidAmount > remainingAmount) {
      return apiError(
        res,
        400,
        `Paid amount exceeds the remaining amount. Remaining: ${remainingAmount}`
      );
    }

    // Calculate the new payment status
    const updatedTotalPaid = totalPaid + paidAmount;
    let paymentStatus = "unpaid";
    if (updatedTotalPaid >= serviceOrderDoc.serviceCharge) {
      paymentStatus = "paid";
    } else if (updatedTotalPaid > 0) {
      paymentStatus = "partial";
    }

    // Create the billing document
    const newBilling = await Billing.create({
      customer: serviceOrderDoc.customer,
      type: "service",
      serviceOrder,
      orderId: serviceOrderDoc.orderId,
      order: serviceOrderDoc.order,
      date: new Date(),
      totalAmount: serviceOrderDoc.serviceCharge,
      paidAmount,
      remainingAmount: remainingAmount - paidAmount,
      status: paymentStatus,
    });

    if (!newBilling) {
      return apiError(res, 500, "Failed to create billing");
    }

    // Update the payment status in the ServiceOrder
    serviceOrderDoc.paymentStatus = paymentStatus;
    await serviceOrderDoc.save();

    return apiResponse(res, 201, "Billing created successfully", newBilling);
  } catch (error: any) {
    console.error("Error creating billing:", error);
    return apiError(res, 500, "Error creating billing", error.message);
  }
};

export const getBillings = async (req: Request, res: Response) => {
  const { serviceOrder, serviceProvided, customerId } = req.query;

  try {
    let filter: any = {};

    if (customerId) {
      filter.customer = customerId;
    }
    if (serviceOrder) {
      filter.serviceOrder = serviceOrder;
    }

    if (serviceProvided) {
      filter.serviceProvided = serviceProvided;
    }

    const billings = await Billing.find(filter)
      .populate({
        path: "customer serviceOrder serviceProvided",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 })
      .exec();

    // if (!billings.length) {
    //   return apiError(
    //     res,
    //     404,
    //     "No billings found for this customer with the specified filters"
    //   );
    // }

    return apiResponse(res, 200, "Billings fetched successfully", billings);
  } catch (error: any) {
    console.error("Error fetching billings:", error);
    return apiError(res, 500, "Error fetching billings", error.message);
  }
};

export const getBillingById = async (req: Request, res: Response) => {
  const { billingId } = req.params;

  try {
    const billing = await Billing.findById(billingId)
      .populate("customer serviceOrder serviceProvided")
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
  const { totalAmount, paidAmount, previousDue, remainingAmount } = req.body;

  try {
    const billing = await Billing.findById(billingId);

    if (!billing) {
      return apiError(res, 404, "Billing record not found");
    }

    // Update values
    billing.totalAmount = totalAmount;
    billing.paidAmount = paidAmount;
    // billing.remainingAmount = remainingAmount;

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
