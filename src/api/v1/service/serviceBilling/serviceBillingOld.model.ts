import mongoose from "mongoose";
const billingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
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
    date: {
      type: Date,
      required: true,
      default: Date.now(),
    },
    status: {
      type: String,
      required: true,
      default: "unpaid",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
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
    // previousDue: {
    //   type: Number,
    //   default: 0,
    //   min: 0,
    // },
    // remainingAmount: {
    //   type: Number,
    //   required: true,
    //   min: 0,
    // },
  },
  { timestamps: true }
);

export default mongoose.model("Billing", billingSchema);
