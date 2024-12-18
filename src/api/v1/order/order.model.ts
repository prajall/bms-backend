import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customerId: {
    type: mongoose.Schema.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  type: {
    type: String,
    required: true,
    index: true,
  },
});

export default mongoose.model("Order", OrderSchema);
