import mongoose from "mongoose";

const partsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Part name is required"],
      trim: true,
      maxlength: [100, "Part name should not exceed 100 characters"],
      index: true,
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    brand: {
      type: String,
      required: true,
      maxlength: [50, "Brand name should not exceed 50 characters"],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    baseImage: {
      small: String,
      medium: String,
      full: String,
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
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
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
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Part", partsSchema);
