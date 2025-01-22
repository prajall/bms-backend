import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../api/v1/user/user.model";
import Employee from "../api/v1/employee/employee.model";
import { apiError } from "../utils/response.util";

interface JwtPayload {
  id: string;
}

export const authValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return apiError(res, 401, "Authentication failed. Please Login first");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || ""
    ) as JwtPayload;

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("role");

    if (!user) {
      return apiError(res, 404, "User not found");
    }
    (req as any).user = user;
    next();
  } catch (error: any) {
    return apiError(res, 401, "Invalid or expired token", error.message);
  }
};

export const employeeVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) {
    return apiError(res, 401, "Authorization token not found");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as JwtPayload;
  console.log(decoded);

  const employee = await Employee.findOne({ user: decoded.id })
    .populate("role")
    .populate({ path: "user", select: "email" })
    .select("user name role");

  if (!employee) {
    return apiError(
      res,
      404,
      "Only employees are allowed to access this route"
    );
  }

  (req as any).employee = employee;
  next();
};
