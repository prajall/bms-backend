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
import productInstallationRoutes from "./api/v1/productInstallation/productInstallation.route";
import serviceBillingRoutes from "./api/v1/service/serviceBilling/serviceBilling.route";
import orderRoutes from "./api/v1/order/order.route";
import reportRoutes from "./api/v1/reports/report.route";

import { apiError, apiResponse } from "./utils/response.util";
import cors from "cors";
import "./api/v1/user/user.model";
import "./api/v1/role/role.model";
import "./api/v1/customer/customer.model";
import "./api/v1/employee/employee.model";
import parseNestedFields from "./middlewares/parseFormData";
import mongoose from "mongoose";
import { upload } from "./utils/multer.util";

const app = express();
app.use(express.static("public"));

export default app;

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//To handle form data
// app.use(multer({ storage: multer.memoryStorage() }).none());
// app.use(formConversion);
//parse nested fields for formData
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

// normal routes
apiRoutes.use("/user", upload.none(), userRoutes);
apiRoutes.use("/installation", upload.none(), installationRoutes);
apiRoutes.use("/role", upload.none(), roleRoutes);
apiRoutes.use("/service", upload.none(), serviceRoutes);
apiRoutes.use("/service-order", upload.none(), serviceOrderRoutes);
apiRoutes.use("/service-billing", upload.none(), serviceBillingRoutes);
apiRoutes.use("/pos", upload.none(), posRoutes);
apiRoutes.use("/config", upload.none(), configRoutes);
apiRoutes.use("/order", upload.none(), orderRoutes);
apiRoutes.use("/report", upload.none(), reportRoutes);
apiRoutes.use(
  "/product-installation",
  upload.none(),
  productInstallationRoutes
);

// image upload routes
apiRoutes.use("/category", categoryRoutes);
apiRoutes.use("/product", productRoutes);
apiRoutes.use("/part", partRoutes);
apiRoutes.use("/employee", employeeRoutes);
apiRoutes.use("/customer", customerRoutes);

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
