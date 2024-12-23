import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    workDetail: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    interval: {
      type: Number,
      default: 90,
    },
    serviceCharge: {
      type: Number,
      required: true,
    },
    additionalNotes: {
      type: String,
    },
    availability: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
