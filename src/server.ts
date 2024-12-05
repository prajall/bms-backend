import dotenv from "dotenv";
import app from "./app";
import mongoose from "mongoose";

dotenv.config();

const PORT = process.env.PORT || 5000;

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
