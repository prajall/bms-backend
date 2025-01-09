import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Employee from "../employee/employee.model";
import { apiResponse, apiError } from "../../../utils/response.util";
import mongoose from "mongoose";
import { User } from "../user/user.model";

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return apiError(res, 409, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const createdUser = await User.create({
      email,
      password: hashedPassword,
      role,
      type: "employee",
    });

    if (!createdUser) {
      return apiError(res, 500, "Failed to create user");
    }

    const employee = await Employee.create({
      user: createdUser._id,
      name: req.body.name,
      role: req.body.role,
      image: req.body.image,
      gender: req.body.gender,
      address: {
        country: req.body.address.country,
        province: req.body.address.province,
        city: req.body.address.city,
        addressLine: req.body.address.addressLine,
      },
      contactNo: req.body.contactNo,
      department: req.body.department,
    });

    if (!employee) {
      return apiError(res, 500, "Failed to create employee");
    }

    return apiResponse(res, 201, "Employee created successfully", employee);
  } catch (error) {
    console.error("Create employee error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortField as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const totalEmployees = await Employee.countDocuments({});
    const totalPages = Math.ceil(totalEmployees / limit);

    const employees = await Employee.find({})
      .populate("role", "name")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    return apiResponse(res, 200, "Employees retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages,
        totalEmployees,
        limit,
      },
      employees,
    });
  } catch (error) {
    console.error("Get all employees error:", error);
    return apiError(res, 500, "Failed to fetch employees", error);
  }
};

export const getEmployeeDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid employee ID format");
    }

    const employee = await Employee.findById(id)
      .populate({ path: "user", strictPopulate: false })
      // .populate({ path: "role", select: "_id", strictPopulate: false });

    if (!employee) {
      return apiError(res, 404, "Employee not found");
    }

    return apiResponse(res, 200, "Employee retrieved successfully", employee);
  } catch (error) {
    console.error("Get employee by ID error:", error);
    return apiError(res, 500, "Internal Server Error", error);
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, role, ...employeeUpdates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid employee ID format");
    }

    const employee = await Employee.findById(id).populate("user");
    if (!employee) {
      return apiError(res, 404, "Employee not found");
    }

    const user: any = employee.user; 

    if (email || password || role) {
      // console.log(role);
      if (!user) {
        return apiError(res, 404, "Associated user not found");
      }
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return apiError(res, 409, "Email already exists");
        }
        user.email = email;
      }
      if (password) {
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (!isSamePassword) {
          user.password = await bcrypt.hash(password, 10);
        }
      }
      if (role) {
        user.role = role;
      }
      user.type = "employee";
      await user.save();
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        role: req.body.role,
        image: req.body.image,
        gender: req.body.gender,
        address: {
          country: req.body.address.country,
          province: req.body.address.province,
          city: req.body.address.city,
          addressLine: req.body.address.addressLine,
        },
        contactNo: req.body.contactNo,
        department: req.body.department,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("user")
      .populate("role");

    if (!updatedEmployee) {
      return apiError(res, 404, "Employee not found");
    }

    return apiResponse(
      res,
      200,
      "Employee updated successfully",
      updatedEmployee
    );
  } catch (error) {
    console.error("Update employee error:", error);
    return apiError(res, 500, "Failed to update employee", error);
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid employee ID format");
    }

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return apiError(res, 404, "Employee not found");
    }

    return apiResponse(res, 200, "Employee deleted successfully");
  } catch (error) {
    console.error("Delete employee error:", error);
    return apiError(res, 500, "Failed to delete employee", error);
  }
};
