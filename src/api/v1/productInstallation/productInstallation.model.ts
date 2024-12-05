import mongoose from "mongoose";

const productInstallationSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    installationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "in-progress", "canceled", "delayed"],
      default: "pending",
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    additionalNote: {
      type: String,
    },
    installationCharge: {
      type: Number,
      required: true,
    },
    addedServices: [
      //service Order
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceOrder",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("ProductInstallation", productInstallationSchema);
