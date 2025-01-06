import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["admin", "super_admin", "customer", "employee"],
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: function (this: any) {
        return this.type === "employee" || this.type === "admin";
      },
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
