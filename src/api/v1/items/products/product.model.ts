import mongoose, { syncIndexes } from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name should not exceed 100 characters"],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "User is required"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    brand: {
      type: String,
      required: true,
      maxlength: [50, "Brand name should not exceed 50 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      match: [/^[a-zA-Z0-9-]+$/, "Invalid SKU format"],
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    images: [{ type: String, required: true }],
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    modelNo: {
      type: String,
      required: [true, "Model number is required"],
      trim: true,
    },
    serialNo: {
      type: String,
      trim: true,
      unique: true,
    },
    condition: {
      type: String,
      required: true,
      enum: ["new", "used", "refurbished"],
      default: "new",
    },
    manufactureDate: {
      type: Date,
      required: true,
    },
    warranty: {
      duration: Number, // in months
      description: String,
    },
    baseImage: {
      small: String,
      medium: String,
      full: String,
    },
    keyFeatures: [
      {
        type: String,
        trim: true,
      },
    ],
    minimumOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    dimensions: {
      width: Number,
      height: Number,
      length: Number,
      unit: {
        type: String,
        enum: ["cm", "inch", "m"],
        default: "m",
      },
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ["kg", "g", "lb"],
        default: "kg",
      },
    },
    variants: [
      //leave empty for now
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    seo: {
      slug: {
        type: String,
        // required: true,
        unique: true,
        trim: true,
      },
      tags: [
        {
          type: String,
          trim: true,
        },
      ],
      metaTitle: {
        type: String,
        maxlength: [60, "Meta title should not exceed 60 characters"],
      },
      metaDescription: {
        type: String,
        maxlength: [160, "Meta description should not exceed 160 characters"],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Product", productSchema);
