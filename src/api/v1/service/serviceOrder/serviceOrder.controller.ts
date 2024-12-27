import { Request, Response } from "express";
import ServiceOrder from "./serviceOrder.model";
import ServiceProvided from "../serviceProvided/serviceProvided.model";
import Product from "../../items/products/product.model";
import { apiError, apiResponse } from "../../../../utils/response.util";
import { createOrder } from "../../order/order.controller";
import Service from "../service/service.model";
import mongoose from "mongoose";
import BillingModel from "../serviceBilling/serviceBilling.model";

interface ServiceOrder {
  order: string;
  orderId: string;
  isRecurring?: boolean;
  customer: string;
  service: string;
  interval: number;
  date: Date;
  nextServiceDate?: Date;
  serviceCharge: number;
  parentServiceOrder?: string;
  additionalNotes?: string;
}

export const createServiceOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let {
      order,
      orderId,
      isRecurring = false,
      customer = "67554286140992b96228ae97",
      address,
      contactNumber,
      service,
      interval,
      nextServiceDate,
      serviceCharge,
      parentServiceOrder,
      additionalNotes,
      discount = 0,
      paidAmount = 0,
    } = req.body;

    const serviceOrderDoc = await Service.findById(service);
    if (!serviceOrderDoc) {
      return apiError(res, 400, "Service does not exist");
    }

    const date = new Date().toISOString();
    const discountedAmount = serviceCharge - (serviceCharge * discount) / 100;
    const remainingAmount = discountedAmount - paidAmount;

    let paymentStatus = "unpaid";
    if (paidAmount >= discountedAmount) {
      paymentStatus = "paid";
    } else if (paidAmount > 0) {
      paymentStatus = "partial";
    }

    const newServiceOrder: any = {
      service,
      customer,
      address,
      contactNumber,
      date,
      serviceCharge,
      additionalNotes,
      status: "pending",
      orderId,
      order,
      paymentStatus,
      remainingAmount,
    };

    if (!order || !orderId) {
      const newOrder = await createOrder(customer, "service");
      if (!newOrder) {
        return apiError(res, 500, "Failed to create order");
      }
      newServiceOrder.orderId = newOrder.orderId;
      newServiceOrder.order = newOrder.order;
    }

    const calculateNextServiceDate = () => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + interval);
      return nextDate;
    };

    if (!parentServiceOrder && isRecurring) {
      interval = interval || serviceOrderDoc.interval || 0;

      if (interval === 0) {
        return apiError(res, 400, "Interval is required for recurring orders");
      }

      newServiceOrder.isRecurring = true;
      newServiceOrder.interval = interval;
      newServiceOrder.nextServiceDate =
        nextServiceDate || calculateNextServiceDate();
    }

    let serviceOrder: any;

    //handle child service orders
    if (parentServiceOrder) {
      const parentServiceOrderDoc = await ServiceOrder.findById(
        parentServiceOrder
      );

      if (!parentServiceOrderDoc) {
        return apiError(res, 400, "Parent service order does not exist");
      }

      newServiceOrder.parentServiceOrder = parentServiceOrder;

      serviceOrder = await ServiceOrder.create([newServiceOrder], {
        session,
      });

      if (!serviceOrder) {
        await session.abortTransaction();
        return apiError(res, 500, "Failed to create service order");
      }

      if (!isRecurring) {
        parentServiceOrderDoc.isRecurring = false;
      } else {
        parentServiceOrderDoc.isRecurring = true;
        if (req.body.interval) {
          parentServiceOrderDoc.interval = interval;
        }
        parentServiceOrderDoc.nextServiceDate = calculateNextServiceDate();
      }

      await parentServiceOrderDoc.save();
    } else {
      serviceOrder = await ServiceOrder.create([newServiceOrder], {
        session,
      });
    }

    if (!serviceOrder) {
      await session.abortTransaction();
      return apiError(res, 500, "Failed to create service order");
    }

    if (paidAmount) {
      if (!serviceOrder || !serviceOrder[0]?._id) {
        await session.abortTransaction();
        return apiError(
          res,
          500,
          "Failed to create service order, billing aborted"
        );
      }

      const billing = await BillingModel.create(
        [
          {
            customer,
            type: "service",
            serviceOrder: serviceOrder[0]._id,
            order: newServiceOrder.order,
            orderId: newServiceOrder.orderId,
            date,
            totalAmount: serviceCharge,
            paidAmount,
            status: paymentStatus,
          },
        ],
        { session }
      );
      console.log("billing", billing[0]);
      if (!billing) {
        await session.abortTransaction();
        return apiError(res, 500, "Failed to create billing");
      }
    }

    await session.commitTransaction();
    session.endSession();

    return apiResponse(
      res,
      201,
      "Service order created successfully",
      serviceOrder[0]
    );
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating service order:", error);
    return apiError(res, 500, "Internal server error", error.stack);
  } finally {
    session.endSession();
  }
};

export const getAllServiceOrders = async (req: Request, res: Response) => {
  try {
    const { customer, parentServiceOrder } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const query: any = {};
    if (customer) {
      query.customer = customer;
    }
    if (parentServiceOrder) {
      query.parentServiceOrder = parentServiceOrder;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const serviceOrders = await ServiceOrder.find(query)
      .populate({ path: "service", select: "-createdAt -updatedAt" })
      .populate({ path: "customer", select: "name phoneNo address" })
      .populate({
        path: "serviceProvided",
        model: ServiceProvided,
        strictPopulate: false,
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalOrders = await ServiceOrder.countDocuments(query);

    return apiResponse(res, 200, "Service orders retrieved successfully", {
      serviceOrders,
      totalOrders,
      currentPage: Number(page),
      totalPages: Math.ceil(totalOrders / Number(limit)),
    });
  } catch (error: any) {
    console.error("Error retrieving service orders:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getMiniServiceOrders = async (req: Request, res: Response) => {
  try {
    const miniServiceOrders = await ServiceOrder.aggregate([
      {
        $sort: { orderId: 1, createdAt: 1 }, 
      },
      {
        $group: {
          _id: "$orderId", 
          doc: { $first: "$$ROOT" }, 
        },
      },
      {
        $replaceRoot: { newRoot: "$doc" }, 
      },
      {
        $sort: { createdAt: -1 }, 
      },
      {
        $project: {
          _id: 1,
          orderId: 1,
        }, 
      },
    ]);

    return apiResponse(res, 200, "Mini service orders fetched successfully", miniServiceOrders);
  } catch (error: any) {
    console.error("Error fetching mini service orders:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};



export const getServiceOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid service order ID");
    }

    const serviceOrder = await ServiceOrder.findById(id)
      .populate({
        path: "service",
        select: "-createdAt -updatedAt",
      })
      .populate({ path: "customer", strictPopulate: false });

    if (!serviceOrder) {
      return apiError(res, 404, "Service order not found");
    }

    const previousBillings = await BillingModel.find({
      serviceOrder: serviceOrder,
    });

    const totalPaid = previousBillings.reduce(
      (sum, billing) => sum + billing.paidAmount,
      0
    );
    const remainingAmount = serviceOrder.serviceCharge - totalPaid;
    if (remainingAmount != serviceOrder.remainingAmount) {
      serviceOrder.remainingAmount = remainingAmount;
      await serviceOrder.save();
    }

    return apiResponse(res, 200, "Service order retrieved successfully", {
      serviceOrder,
      previousBillings,
    });
  } catch (error: any) {
    console.error("Error retrieving service order:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getServiceOrdersByOrderId = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return apiError(res, 400, "Order ID is required");
    }

    // Fetch all service orders with the given orderId
    const serviceOrders = await ServiceOrder.find({ orderId })
      .populate({
        path: "service",
        select: "-createdAt -updatedAt",
      })
      .populate({
        path: "customer",
        select: "name phoneNo address",
        strictPopulate: false,
      });

    if (serviceOrders.length === 0) {
      return apiError(res, 404, "No service orders found with the given order ID");
    }

    // Get the customer information from the first service order (assuming all have the same customer)
    const customer = serviceOrders[0].customer;

    // Calculate billing details for each service order and group them under "order"
    const orders = serviceOrders.map((order) => {
      return {
        _id: order._id,
        service: order.service,
        date: order.date,
        address: order.address,
        contactNumber: order.contactNumber,
        isRecurring: order.isRecurring,
        interval: order.interval,
        nextServiceDate: order.nextServiceDate,
        serviceCharge: order.serviceCharge,
        additionalNotes: order.additionalNotes,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        remainingAmount: order.remainingAmount,
      };
    });

    // Fetch all previous billings related to the given orderId
    const previousBillings = await BillingModel.find({ orderId }).sort({ date: 1 });

    // Calculate the total paid and remaining amounts across all service orders
    const totalPaid = previousBillings.reduce(
      (sum, billing) => sum + billing.paidAmount,
      0
    );

    const totalServiceCharge = serviceOrders.reduce(
      (sum, order) => sum + order.serviceCharge,
      0
    );

    const remainingAmount = totalServiceCharge - totalPaid;

    // Prepare the final response
    const response = {
      serviceOrder: {
        order: orders,
        orderId: orderId,
        customer,
      },
      previousBillings,
      totalPaid,
      remainingAmount,
    };

    return apiResponse(res, 200, "Service orders retrieved successfully", response);
  } catch (error: any) {
    console.error("Error retrieving service orders:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};



export const updateServiceOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid service order ID");
    }

    const allowedUpdates = [
      "order",
      "orderId",
      "service",
      "customer",
      "address",
      "contactNumber",
      "date",
      "isRecurring",
      "interval",
      "nextServiceDate",
      "serviceCharge",
      "additionalNotes",
      "status",
      "parentServiceOrder",
    ];

    const updates: any = {};
    for (const key of Object.keys(req.body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const updatedServiceOrder = await ServiceOrder.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
      }
    );

    if (!updatedServiceOrder) {
      return apiError(res, 404, "Service order not found");
    }

    return apiResponse(
      res,
      200,
      "Service order updated successfully",
      updatedServiceOrder
    );
  } catch (error: any) {
    console.error("Error updating service order:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const deleteServiceOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid service order ID");
    }
    const parentServiceOrder = await ServiceOrder.findById(id);

    if (!parentServiceOrder) {
      return apiError(res, 404, "Parent service order not found");
    }

    const childServiceOrders = await ServiceOrder.find({
      parentServiceOrder: id,
    }).sort({ date: 1 });

    if (childServiceOrders.length > 0) {
      const firstChild = childServiceOrders[0];
      firstChild.isRecurring = parentServiceOrder.isRecurring;
      firstChild.nextServiceDate = parentServiceOrder.nextServiceDate;
      firstChild.interval = parentServiceOrder.interval;

      await firstChild.save();

      // Update remaining children to point to the new parent
      const remainingChildren = childServiceOrders.slice(1);
      if (remainingChildren.length > 0) {
        await ServiceOrder.updateMany(
          { _id: { $in: remainingChildren.map((child) => child._id) } },
          { parentServiceOrder: firstChild._id }
        );
      }
    }

    const deletedServiceOrder = await ServiceOrder.findByIdAndDelete(id);

    if (!deletedServiceOrder) {
      return apiError(res, 404, "Failed to delete parent service order");
    }

    return apiResponse(
      res,
      200,
      "Parent service order deleted successfully",
      deletedServiceOrder
    );
  } catch (error: any) {
    console.error("Error deleting service order:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};

export const getNextRecurringOrders = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (!endDate || isNaN(Date.parse(endDate))) {
      return apiError(res, 400, "Invalid or missing end date");
    }

    const end = new Date(endDate);

    const orders = await ServiceOrder.find({
      isRecurring: true,
      nextServiceDate: { $lte: end },
    })
      .populate({
        path: "customer",
        select: "name phoneNo address",
        strictPopulate: false,
      })
      .populate({
        path: "service",
        select: "title",
        strictPopulate: false,
      })
      .sort({ nextServiceDate: 1 });

    return apiResponse(
      res,
      200,
      "Recurring orders retrieved successfully",
      orders
    );
  } catch (error: any) {
    console.error("Error fetching recurring orders to confirm:", error);
    return apiError(res, 500, "Internal server error", error.message);
  }
};
