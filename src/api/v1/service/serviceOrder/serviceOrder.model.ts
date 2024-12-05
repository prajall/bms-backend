import mongoose from "mongoose";
const serviceOrderSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    nextServiceDate: {
      type: Date,
      required: false,
    },
    serviceCharge: {
      type: Number,
      required: true,
    },
    serviceProvided: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceProvided",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("ServiceOrder", serviceOrderSchema);
