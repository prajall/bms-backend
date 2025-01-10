import mongoose, { CallbackError } from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    invoice: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now(),
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    serviceOrders: [
      {
        serviceOrder: {
          type: mongoose.Schema.Types.ObjectId, 
          ref: "ServiceOrder",
          required: true,
        },
        orderId: {
          type: String, 
          required: true,
        },
        order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      },
    ],
    posOrders: [
      {
        posOrder: {
          type: mongoose.Schema.Types.ObjectId, 
          ref: "ServiceOrder",
          required: true,
        },
        orderId: {
          type: String, 
          required: true,
        },
        order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      },
    ],
    status: {
      type: String,
      required: true,
      default: "unpaid",
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0
    },
    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Billing", billingSchema);
