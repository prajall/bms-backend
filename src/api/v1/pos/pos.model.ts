import mongoose from "mongoose";

const posSchema = new mongoose.Schema(
  {
    customerType: {
      type: String,
      enum: ["walking", "registered"],
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    parts: [
      {
        partId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        additionalNotes: {
          type: String,
          maxlength: 1000,
        },
        date: {
          type: Date,
        },
      },
    ],
    installations: [
      {
        installationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductInstallation",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        additionalNotes: {
          type: String,
          maxlength: 1000,
        },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("POS", posSchema);
