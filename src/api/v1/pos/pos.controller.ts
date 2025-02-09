import { Request, Response } from "express";
import POS from "./pos.model";
import { apiResponse, apiError } from "../../../utils/response.util";
import ServiceOrder from "../service/serviceOrder/serviceOrder.model";
import Service from "../service/service/service.model";
import Billing from "../billing/billing.model";
import { createOrder } from "../order/order.controller";
import { createBilling } from "../billing/billing.controller";

const WALKING_CUSTOMER_ID = "67554286140992b96228ae97";
export const createPOS = async (req: Request, res: Response) => {
  try {
    const {
      products,
      parts,
      serviceOrders,
      customerType,
      customer,
      totalPrice,
      tax,
      subTotal,
      discount,
      paidAmount,
    } = req.body;

    const { orderId, order } = await createOrder(
      customerType === "walking" ? WALKING_CUSTOMER_ID : customer,
      "pos"
    );

    if (!order || !orderId) {
      return apiError(res, 500, "Failed to create order");
    }

    let createdServiceOrders: any[] = [];
    if (serviceOrders && serviceOrders.length > 0) {
      const serviceOrdersData = await Promise.all(
        serviceOrders.map(async (serviceOrder: any) => {
          try {
            const serviceDetails = await Service.findById(
              serviceOrder.service
            ).exec();

            let nextServiceDate = null;
            if (serviceDetails?.isRecurring && serviceDetails.interval) {
              const intervalInDays = serviceDetails.interval;
              nextServiceDate = new Date();
              nextServiceDate.setDate(
                nextServiceDate.getDate() + intervalInDays
              );
            }

            return {
              service: serviceOrder,
              customer:
                customerType === "walking" ? WALKING_CUSTOMER_ID : customer,
              date: serviceOrder.date,
              nextServiceDate,
              serviceCharge: serviceOrder.price,
              orderId: orderId,
              order: order,
            };
          } catch (error) {
            console.error("Error processing serviceOrder order:", error);
            throw new Error(
              `Failed to process serviceOrder with ID: ${serviceOrder.service}`
            );
          }
        })
      );

      createdServiceOrders = await ServiceOrder.insertMany(serviceOrdersData);
    }

    const pos = await POS.create({
      products,
      parts,
      serviceOrders: createdServiceOrders,
      customerType: customerType || "walking",
      customer,
      totalPrice,
      tax,
      subTotal,
      discount,
      date: new Date(),
      orderId,
      order: order._id,
      paidAmount,
    });

    if (!pos) {
      return apiError(res, 400, "Failed to create POS record");
    }

    if (paidAmount > 0) {
      const mockRequest = {
        body: {
          posOrders: [
            {
              posOrder: pos._id,
              orderId: pos.orderId,
              order: pos.order,
            },
          ],
          paidAmount,
          date: new Date(),
          customer,
          discount,
          totalAmount: totalPrice,
          type: "pos",
        },
      } as Request;

      await createBilling(mockRequest, res);
      return;
    }
    return apiResponse(res, 201, "POS record created successfully", {
      pos,
      orderId: order.orderId,
      createdServiceOrders,
    });
  } catch (error: any) {
    console.error("Create POS error:", error.message);
    return apiError(res, 500, "Error creating POS record", error.message);
  }
};

// Delete a POS record by ID

// Get all POS records with optional pagination and filters
export const getAllPOS = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.customerType) {
      query.customerType = req.query.customerType;
    }
    if (req.query.customer) {
      query.customer = req.query.customer;
    }

    const totalPOS = await POS.countDocuments(query);
    const totalPages = Math.ceil(totalPOS / limit);

    const posRecords = await POS.find(query)
      .populate("products.product", "name price")
      .populate("parts.part", "name price")
      .populate("services.service", "name price")
      .populate({
        path: "installations.installationId",
        select: "name price",
        strictPopulate: false,
      })
      .populate("customer", "name email")
      .skip(skip)
      .limit(limit);

    return apiResponse(res, 200, "POS records retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages,
        totalPOS,
        limit,
      },
      posRecords,
    });
  } catch (error: any) {
    console.error("Get all POS error:", error);
    return apiError(res, 500, "Error fetching POS records", error.message);
  }
};

export const getAllPOSList = async (req: Request, res: Response) => {
  try {
    // Fetch all records, selecting only _id and orderId
    const posRecords = await POS.find().select("_id orderId");

    return apiResponse(res, 200, "POS records retrieved successfully", {
      posRecords,
    });
  } catch (error: any) {
    console.error("Get all POS error:", error);
    return apiError(res, 500, "Error fetching POS records", error.message);
  }
};

// Get a single POS record by ID
export const getPOSById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pos = await POS.findById(id)
      .populate("products.product", "name price")
      .populate("parts.part", "name price")
      .populate("customer", "name email");

    if (!pos) {
      return apiError(res, 404, "POS record not found");
    }

    const productsTotal = pos.products.reduce((sum, item: any) => {
      return sum + (item?.price || 0) * (item.quantity || 0);
    }, 0);

    const partsTotal = pos.parts.reduce((sum, item: any) => {
      return sum + (item?.price || 0) * (item.quantity || 0);
    }, 0);

    const subTotal = productsTotal + partsTotal;

    const taxRate = pos.tax || 0;
    const taxAmount = (subTotal * taxRate) / 100;
    const totalPrice = subTotal + taxAmount;

    // Add calculated fields to the POS data
    pos.subTotal = subTotal;
    pos.totalPrice = totalPrice;

    const pastBillings = await Billing.find({
      type: "pos",
      "posOrders.posOrder": id,
    })
      .populate("customer", "name email")
      .populate("posOrders.order", "orderId")
      .sort({ date: 1 });

    const totalPaid = pastBillings.reduce(
      (sum, billing) => sum + billing.paidAmount,
      0
    );
    const totalAmount = pastBillings.reduce(
      (sum, billing) => sum + billing.totalAmount,
      0
    );
    const remainingAmount =
      totalAmount > 0 ? totalAmount - totalPaid : subTotal - totalPaid;

    // Prepare the response object
    const response = {
      pos,
      pastBillings,
      totalPaid,
      totalAmount: subTotal,
      remainingAmount,
    };

    return apiResponse(res, 200, "POS record retrieved successfully", response);
  } catch (error: any) {
    console.error("Get POS by ID error:", error);
    return apiError(res, 500, "Error fetching POS record", error.message);
  }
};

// Update a POS record by ID
export const updatePOS = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const posData = req.body;

    const updatedPOS = await POS.findByIdAndUpdate(id, posData, {
      new: true,
      runValidators: true,
    })
      .populate("products.product", "name price")
      .populate("parts.part", "name price")
      .populate("services.service", "name price")
      .populate("installations.installationId", "name price")
      .populate("customer", "name email");

    if (!updatedPOS) {
      return apiError(res, 404, "POS record not found");
    }

    return apiResponse(res, 200, "POS record updated successfully", updatedPOS);
  } catch (error: any) {
    console.error("Update POS error:", error);
    return apiError(res, 500, "Error updating POS record", error.message);
  }
};

// Delete a POS record by ID
export const deletePOS = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedPOS = await POS.findByIdAndDelete(id);

    if (!deletedPOS) {
      return apiError(res, 404, "POS record not found");
    }

    return apiResponse(res, 200, "POS record deleted successfully");
  } catch (error: any) {
    console.error("Delete POS error:", error);
    return apiError(res, 500, "Error deleting POS record", error.message);
  }
};
