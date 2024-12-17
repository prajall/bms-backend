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
    installation: {
      type: {
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
      required: false,
    },
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
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("POS", posSchema);
