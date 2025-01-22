import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
    subject: {
      type: String,
    },
    body: {
      type: String,
      required: true,
    },
    placeholders: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Template", templateSchema);
