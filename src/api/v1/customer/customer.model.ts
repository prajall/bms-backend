import mongoose, { Schema, model } from "mongoose";

const customerSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      default: "673f15dd1f67e9ecdadaf39d",
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    address: {
      country: { type: String, required: true },
      province: { type: String, required: true },
      city: { type: String },
      addressLine: { type: String },
      houseNo: { type: String },
    },
    phoneNo: {
      type: String,
      required: true,
    },
    mobileNo1: {
      type: String,
    },
    mobileNo2: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model("Customer", customerSchema);
