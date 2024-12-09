import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";

import posRoutes from "./api/v1/pos/pos.route";
import roleRoutes from "./api/v1/role/role.route";
import userRoutes from "./api/v1/user/user.route";
import configRoutes from "./api/v1/config/config.route";
import partRoutes from "./api/v1/items/parts/parts.route";
import employeeRoutes from "./api/v1/employee/employee.route";
import customerRoutes from "./api/v1/customer/customer.route";
import serviceRoutes from "./api/v1/service/service/service.route";
import productRoutes from "./api/v1/items/products/product.route";
import categoryRoutes from "./api/v1/items/category/category.route";
import installationRoutes from "./api/v1/installation/installation.route";
import serviceOrderRoutes from "./api/v1/service/serviceOrder/serviceOrder.route";
import serviceProvidedRoutes from "./api/v1/service/serviceProvided/serviceProvided.route";
import serviceBillingRoutes from "./api/v1/service/serviceBilling/serviceBilling.route";

import { apiError, apiResponse } from "./utils/response.util";
import cors from "cors";
import "./api/v1/user/user.model";
import "./api/v1/role/role.model";
import "./api/v1/customer/customer.model";
import "./api/v1/employee/employee.model";
import multer from "multer";
import parseNestedFields from "./middlewares/parseFormData";
import mongoose from "mongoose";

const app = express();
app.use(express.static("public"));

export default app;

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

//To handle form data
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(upload.none());
//parse nested fields
app.use(parseNestedFields);

// CORS configuration
//change
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Server checking
app.get("/", (req: Request, res: Response) => {
  return apiResponse(res, 200, "Server is running!");
});

// Global error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  apiError(res, 500, "Internal Server Error", err.message);
});

// Routes
const apiRoutes = express.Router();
app.use("/api/v1", apiRoutes);

apiRoutes.use("/user", userRoutes);
apiRoutes.use("/installation", installationRoutes);
apiRoutes.use("/role", roleRoutes);
apiRoutes.use("/category", categoryRoutes);
apiRoutes.use("/product", productRoutes);
apiRoutes.use("/part", partRoutes);
apiRoutes.use("/employee", employeeRoutes);
apiRoutes.use("/customer", customerRoutes);
apiRoutes.use("/service", serviceRoutes);
apiRoutes.use("/service-order", serviceOrderRoutes);
apiRoutes.use("/service-provided", serviceProvidedRoutes);
apiRoutes.use("/service-billing", serviceBillingRoutes);
apiRoutes.use("/pos", posRoutes);
apiRoutes.use("/config", configRoutes);

apiRoutes.get("/test", async (req: Request, res: Response) => {
  console.log("Testing !");
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/bms`);
    console.log("Database connected successfully");
  } catch (error: any) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
  return apiResponse(res, 200, `Test route is working!`);
});
