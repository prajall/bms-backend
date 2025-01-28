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
import serviceBillingRoutes from "./api/v1/billing/billing.route";
import orderRoutes from "./api/v1/order/order.route";
import reportRoutes from "./api/v1/reports/report.route";
import dashboardRoutes from "./api/v1/dashboard/dashboard.route";

import { apiError, apiResponse } from "./utils/response.util";
import cors from "cors";
import "./api/v1/user/user.model";
import "./api/v1/role/role.model";
import "./api/v1/customer/customer.model";
import "./api/v1/employee/employee.model";
import parseNestedFields, { parseFormData } from "./middlewares/parseFormData";
import mongoose from "mongoose";
import { upload } from "./utils/multer.util";
import { authValidation } from "./middlewares/auth.middleware";
import bodyParser from "body-parser";
import { checkMaintenanceMode } from "./middlewares/other.middleware";

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
apiRoutes.use(
  "/user",
  checkMaintenanceMode,
  upload.none(),
  parseFormData,
  userRoutes
);
apiRoutes.use(
  "/installation",
  upload.none(),
  parseFormData,
  authValidation,
  installationRoutes
);
apiRoutes.use(
  "/role",
  upload.none(),
  parseFormData,
  authValidation,
  roleRoutes
);
apiRoutes.use(
  "/service",
  checkMaintenanceMode,
  upload.none(),
  parseFormData,
  serviceRoutes
);
apiRoutes.use(
  "/service-order",
  checkMaintenanceMode,
  authValidation,
  upload.none(),
  parseFormData,
  serviceOrderRoutes
);
apiRoutes.use(
  "/service-billing",
  checkMaintenanceMode,
  upload.none(),
  parseFormData,
  authValidation,
  serviceBillingRoutes
);
apiRoutes.use(
  "/pos",
  checkMaintenanceMode,
  upload.none(),
  parseFormData,
  authValidation,
  posRoutes
);
apiRoutes.use("/config", upload.none(), parseFormData, configRoutes);
apiRoutes.use(
  "/order",
  checkMaintenanceMode,
  upload.none(),
  parseFormData,
  authValidation,
  orderRoutes
);
apiRoutes.use(
  "/report",
  checkMaintenanceMode,
  upload.none(),
  parseFormData,
  authValidation,
  reportRoutes
);
apiRoutes.use(
  "/product-installation",
  authValidation,
  upload.none(),
  parseFormData,
  productInstallationRoutes
);
apiRoutes.use(
  "/dashboard",
  checkMaintenanceMode,
  upload.none(),
  parseFormData,
  authValidation,
  dashboardRoutes
);

// image upload routes
apiRoutes.use("/category", checkMaintenanceMode, categoryRoutes);
apiRoutes.use("/product", checkMaintenanceMode, productRoutes);
apiRoutes.use("/part", checkMaintenanceMode, partRoutes);
apiRoutes.use("/employee", checkMaintenanceMode, employeeRoutes);
apiRoutes.use("/customer", checkMaintenanceMode, customerRoutes);

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
