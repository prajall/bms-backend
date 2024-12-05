import mongoose from "mongoose";

const serviceProvidedSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  serviceOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceOrder",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  serviceCharge: {
    type: Number,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  ],
  parts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part",
    },
  ],
  workDetail: {
    type: String,
  },
  additionalNotes: {
    type: String,
  },
  billing: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
      required: true,
    },
  ],
});

export default mongoose.model("ServiceProvided", serviceProvidedSchema);
