import dotenv from "dotenv";
import app from "./app";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { runCronJobs } from "./cron";

dotenv.config();

const PORT = process.env.PORT || 5000;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // connect to database
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/bms`);
    console.log("Database connected successfully");
  } catch (error: any) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
});

runCronJobs();
