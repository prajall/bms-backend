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
    serviceProvided: {
      // i think i will remove this. This schema is for every time service was provided. is this necessary? I want to link billing with serviceOrder. tell me what to do
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvided",
      required: false,
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
    previousDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Billing", billingSchema);
