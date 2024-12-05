import mongoose, { Schema, model } from "mongoose";

const employeeSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "User is required"],
      default: "673afeb1d27f8553ab5cb062",
      index: true,
    },
    image: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      required: true,
    },
    address: {
      country: { type: String, required: true },
      province: { type: String, required: true },
      city: { type: String, required: true },
      addressLine: { type: String, required: true },
    },
    contactNo: {
      type: String,
      required: [true, "Contact number is required"],
      match: [/^\+?[0-9]{7,15}$/, "Invalid contact number format"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model("Employee", employeeSchema);
