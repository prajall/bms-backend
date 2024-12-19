import mongoose from "mongoose";
const serviceOrderSchema = new mongoose.Schema(
  {
    parentServiceOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceOrder",
      required: false,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
      default: "maintenance",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
      required: false,
    },
    interval: {
      type: Number,
      required: false,
    },
    nextServiceDate: {
      type: Date,
      required: false,
    },
    serviceCharge: {
      type: Number,
      required: true,
    },
    additionalNotes: {
      type: String,
      required: false,
    },
    status: {
      type: "string",
      enum: ["pending", "completed", "cancelled", "delayed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceOrder", serviceOrderSchema);
