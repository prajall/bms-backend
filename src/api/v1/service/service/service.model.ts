import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    parts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Part",
      },
    ],
    workDetail: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    interval: {
      //days
      type: Number,
      default: 30,
    },
    serviceCharge: {
      type: Number,
      required: true,
    },
    additionalNotes: {
      type: String,
    },
    availability: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);

/* Example Data
{
  "title": "RO Maintenance",
  "serviceType": "maintenance",
  "product": "64b2fe22c7f1e3f6a8d1b9e1",
  "workDetail": "Regular filter cleaning and performance check.",
  "isRecurring": true,
  "interval": "quarterly",
  "serviceCharge": 500,
  "additionalNotes": "Includes a free filter change if required.",
  "availability": "available",
  "createdAt": "2024-11-26T10:00:00.000Z",
  "updatedAt": "2024-11-26T10:00:00.000Z"
}
*/
